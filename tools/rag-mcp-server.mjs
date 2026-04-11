#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const serverVersion = "1.0.0";
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const corpusPath = path.join(repoRoot, ".rag", "obsidian-vault.corpus.json");

const toolDefinitions = [
  {
    name: "memory_search",
    description:
      "Search the repo-local Obsidian RAG memory corpus for architecture, decisions, sessions, open questions, and historical context. Use before answering repo-history or architecture questions.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Natural-language query to search for.",
        },
        limit: {
          type: "number",
          description: "Maximum results to return. Defaults to 5.",
        },
        repo_slug: {
          type: "string",
          description: "Optional repo slug filter, for example playground.",
        },
        note_type: {
          type: "string",
          description:
            "Optional note type filter, for example repo, repo-decision, or repo-question.",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "memory_unfold",
    description:
      "Fetch a specific memory chunk by source path, or by source file plus heading. Use after memory_search when more detail is needed from a cited section.",
    inputSchema: {
      type: "object",
      properties: {
        source_path: {
          type: "string",
          description:
            "Exact chunk path, for example vault/02 Repositories/playground/00 Repo Home.md § Active Focus.",
        },
        source_file: {
          type: "string",
          description:
            "Source file path when looking up by heading, for example vault/02 Repositories/playground/00 Repo Home.md.",
        },
        heading: {
          type: "string",
          description: "Heading to fetch within source_file.",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "memory_context",
    description:
      "Return the highest-signal context primer for this repo from the Obsidian memory corpus: what it is, current architecture, active focus, open questions, and key decisions.",
    inputSchema: {
      type: "object",
      properties: {
        repo_slug: {
          type: "string",
          description: "Repo slug to load context for. Defaults to playground.",
        },
      },
      additionalProperties: false,
    },
  },
];

let loadedCorpus = null;

function ensureCorpus() {
  try {
    statSync(corpusPath);
  } catch {
    const result = spawnSync("pnpm", ["rag:index"], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: "pipe",
    });

    if (result.status !== 0) {
      throw new Error(
        `Unable to build obsidian-vault corpus with pnpm rag:index.\n${result.stderr || result.stdout}`,
      );
    }
  }
}

function loadCorpus() {
  ensureCorpus();

  const raw = readFileSync(corpusPath, "utf8");
  const stat = statSync(corpusPath);

  if (loadedCorpus?.mtimeMs === stat.mtimeMs) {
    return loadedCorpus.value;
  }

  loadedCorpus = {
    mtimeMs: stat.mtimeMs,
    value: JSON.parse(raw),
  };

  return loadedCorpus.value;
}

function tokenize(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9/._-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function normalize(value) {
  return value.toLowerCase();
}

function scoreChunk(query, chunk) {
  const queryTokens = tokenize(query);
  const chunkText = [
    chunk.source_path,
    chunk.note_type,
    chunk.repo_slug,
    chunk.status,
    chunk.summary,
    ...(chunk.tags ?? []),
    ...(chunk.keywords ?? []),
    chunk.text,
  ]
    .filter(Boolean)
    .join("\n");
  const chunkTokens = tokenize(chunkText);
  const chunkTokenSet = new Set(chunkTokens);
  const pathTokenSet = new Set(tokenize(chunk.source_path));
  const normalizedQuery = normalize(query);
  const normalizedText = normalize(chunkText);
  let score = 0;

  for (const token of queryTokens) {
    if (chunkTokenSet.has(token)) {
      score += 2;
    }

    if (pathTokenSet.has(token)) {
      score += 3;
    }
  }

  if (normalizedText.includes(normalizedQuery)) {
    score += 10;
  }

  if (
    normalizedQuery.includes("question") &&
    chunk.note_type === "repo-question"
  ) {
    score += 4;
  }

  if (
    normalizedQuery.includes("decision") &&
    chunk.note_type === "repo-decision"
  ) {
    score += 4;
  }

  if (
    normalizedQuery.includes("session") &&
    chunk.note_type === "repo-session"
  ) {
    score += 4;
  }

  if (
    normalizedQuery.includes("architecture") &&
    chunk.heading.toLowerCase().includes("architecture")
  ) {
    score += 4;
  }

  return score;
}

function searchMemory(args) {
  const corpus = loadCorpus();
  const limit = Number.isFinite(args.limit)
    ? Math.max(1, Math.min(20, args.limit))
    : 5;
  const query = args.query.trim();

  if (!query) {
    throw new Error("query is required");
  }

  const hits = corpus.chunks
    .filter((chunk) => !args.repo_slug || chunk.repo_slug === args.repo_slug)
    .filter((chunk) => !args.note_type || chunk.note_type === args.note_type)
    .map((chunk) => ({
      chunk,
      score: scoreChunk(query, chunk),
    }))
    .filter((hit) => hit.score > 0)
    .sort((left, right) => {
      return (
        right.score - left.score ||
        left.chunk.source_path.localeCompare(right.chunk.source_path)
      );
    })
    .slice(0, limit);

  if (hits.length === 0) {
    return `No memory results found for: ${query}`;
  }

  return hits
    .map(({ chunk, score }, index) => {
      return [
        `#${index + 1} score=${score}`,
        `source_path: ${chunk.source_path}`,
        `type: ${chunk.note_type ?? "unknown"} repo: ${chunk.repo_slug ?? "unknown"}`,
        chunk.summary ? `summary: ${chunk.summary}` : null,
        "",
        trimText(chunk.text, 1200),
      ]
        .filter((line) => line !== null)
        .join("\n");
    })
    .join("\n\n---\n\n");
}

function unfoldMemory(args) {
  const corpus = loadCorpus();
  const sourcePath = args.source_path?.trim();
  const sourceFile = args.source_file?.trim();
  const heading = args.heading?.trim();
  const chunk = sourcePath
    ? corpus.chunks.find((candidate) => candidate.source_path === sourcePath)
    : corpus.chunks.find(
        (candidate) =>
          candidate.source_file === sourceFile && candidate.heading === heading,
      );

  if (!chunk) {
    throw new Error(
      "No memory chunk matched the provided source path or file plus heading.",
    );
  }

  return [
    `source_path: ${chunk.source_path}`,
    `type: ${chunk.note_type ?? "unknown"} repo: ${chunk.repo_slug ?? "unknown"}`,
    chunk.summary ? `summary: ${chunk.summary}` : null,
    "",
    chunk.text,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function contextMemory(args) {
  const repoSlug = args.repo_slug ?? "playground";
  const desiredHeadings = [
    "What This Repo Is",
    "Current Architecture",
    "Architecture Map",
    "Active Focus",
    "Open Questions",
    "Key Decisions",
    "Next Actions",
  ];
  const corpus = loadCorpus();
  const chunks = desiredHeadings
    .map((heading) =>
      corpus.chunks.find(
        (chunk) =>
          chunk.repo_slug === repoSlug &&
          chunk.source_file.endsWith(
            `02 Repositories/${repoSlug}/00 Repo Home.md`,
          ) &&
          chunk.heading === heading,
      ),
    )
    .filter(Boolean);

  if (chunks.length === 0) {
    return searchMemory({
      query: `repo home active focus architecture ${repoSlug}`,
      limit: 5,
      repo_slug: repoSlug,
    });
  }

  return chunks
    .map((chunk) =>
      [
        `## ${chunk.heading}`,
        `source_path: ${chunk.source_path}`,
        "",
        chunk.text,
      ].join("\n"),
    )
    .join("\n\n---\n\n");
}

function trimText(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 20).trimEnd()}\n...[truncated]`;
}

function resultText(text) {
  return {
    content: [
      {
        type: "text",
        text,
      },
    ],
  };
}

function handleToolCall(params) {
  const args = params.arguments ?? {};

  if (params.name === "memory_search") {
    return resultText(searchMemory(args));
  }

  if (params.name === "memory_unfold") {
    return resultText(unfoldMemory(args));
  }

  if (params.name === "memory_context") {
    return resultText(contextMemory(args));
  }

  throw new Error(`Unknown tool: ${params.name}`);
}

function handleRequest(message) {
  if (message.method === "initialize") {
    return {
      protocolVersion: message.params?.protocolVersion ?? "2024-11-05",
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: "playground-obsidian-memory",
        version: serverVersion,
      },
    };
  }

  if (message.method === "tools/list") {
    return {
      tools: toolDefinitions,
    };
  }

  if (message.method === "tools/call") {
    return handleToolCall(message.params ?? {});
  }

  if (message.method === "ping") {
    return {};
  }

  throw new Error(`Unsupported method: ${message.method}`);
}

function sendResponse(id, result) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, result })}\n`);
}

function sendError(id, error) {
  process.stdout.write(
    `${JSON.stringify({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32000,
        message: error instanceof Error ? error.message : String(error),
      },
    })}\n`,
  );
}

const rl = createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});

rl.on("line", (line) => {
  if (!line.trim()) {
    return;
  }

  let message;

  try {
    message = JSON.parse(line);
  } catch {
    sendError(null, "Invalid JSON-RPC message");
    return;
  }

  if (!Object.hasOwn(message, "id")) {
    return;
  }

  try {
    sendResponse(message.id, handleRequest(message));
  } catch (error) {
    sendError(message.id, error);
  }
});
