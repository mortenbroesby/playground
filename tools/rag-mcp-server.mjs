#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  findMemoryChunk,
  getMemoryContext,
  indexMemoryCorpus,
  retrieveMemoryCandidates,
} from "./obsidian-rag.mjs";

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
        detail: {
          type: "string",
          enum: ["compact", "full"],
          description:
            "Response detail level. Defaults to compact; use full only when excerpts are insufficient.",
        },
        repo_slug: {
          type: "string",
          description: "Optional repo slug filter, for example playground.",
        },
        note_type: {
          type: "string",
          description:
            "Optional note type filter, for example repo, repo-architecture, repo-decision, or repo-session.",
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
            "Exact chunk path, for example vault/00 Repositories/playground/00 Repo Home.md § Active Focus.",
        },
        source_file: {
          type: "string",
          description:
            "Source file path when looking up by heading, for example vault/00 Repositories/playground/00 Repo Home.md.",
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
        detail: {
          type: "string",
          enum: ["compact", "full"],
          description:
            "Response detail level. Defaults to compact; use full only when the full repo primer is needed.",
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

function searchMemory(args) {
  const corpus = indexMemoryCorpus(loadCorpus());
  const limit = Number.isFinite(args.limit)
    ? Math.max(1, Math.min(20, args.limit))
    : 5;
  const query = args.query.trim();
  const fullDetail = args.detail === "full";

  if (!query) {
    throw new Error("query is required");
  }

  const hits = retrieveMemoryCandidates({
    corpus,
    query,
    limit,
    repoSlug: args.repo_slug,
    noteType: args.note_type,
  }).filter((hit) => hasSubstantiveContent(hit));

  if (hits.length === 0) {
    return `No memory results found for: ${query}`;
  }

  const formattedHits = hits.map((chunk, index) => {
    if (fullDetail) {
      return formatFullChunk(chunk, `#${index + 1} score=${chunk.score}`);
    }

    return [
      `#${index + 1} score=${chunk.score}`,
      `source_path: ${chunk.sourcePath}`,
      `type: ${chunk.noteType ?? "unknown"} repo: ${chunk.repoSlug ?? "unknown"}`,
      `heading: ${chunk.heading}`,
      chunk.summary ? `summary: ${chunk.summary}` : null,
      "",
      `excerpt: ${createExcerpt(contentOnly(chunk), query)}`,
    ]
      .filter((line) => line !== null)
      .join("\n");
  });

  if (fullDetail) {
    return formattedHits.join("\n\n---\n\n");
  }

  return [
    "Compact memory results. Use memory_unfold with a source_path for detail.",
    "",
    formattedHits.join("\n\n---\n\n"),
  ].join("\n");
}

function unfoldMemory(args) {
  const corpus = indexMemoryCorpus(loadCorpus());
  const chunk = findMemoryChunk({
    corpus,
    sourcePath: args.source_path?.trim(),
    sourceFile: args.source_file?.trim(),
    heading: args.heading?.trim(),
  });

  if (!chunk) {
    throw new Error(
      "No memory chunk matched the provided source path or file plus heading.",
    );
  }

  return formatFullChunk(chunk);
}

function contextMemory(args) {
  const repoSlug = args.repo_slug ?? "playground";
  const fullDetail = args.detail === "full";
  const corpus = indexMemoryCorpus(loadCorpus());
  const chunks = getMemoryContext({
    corpus,
    repoSlug,
  });

  if (chunks.length === 0) {
    return searchMemory({
      query: `repo home active focus architecture ${repoSlug}`,
      limit: 5,
      repo_slug: repoSlug,
    });
  }

  const formattedChunks = chunks.map((chunk) =>
    formatContextChunk(chunk, fullDetail),
  );

  if (fullDetail) {
    return formattedChunks.join("\n\n---\n\n");
  }

  return [
    `source_file: ${chunks[0].sourceFile}`,
    "Compact repo context. Use memory_unfold with source_file and heading for detail.",
    "",
    formattedChunks.join("\n\n"),
  ].join("\n");
}

function formatContextChunk(chunk, fullDetail) {
  if (!fullDetail) {
    return [`## ${chunk.heading}`, trimText(contentOnly(chunk), 450)].join(
      "\n",
    );
  }

  return [
    `## ${chunk.heading}`,
    `source_path: ${chunk.sourcePath}`,
    chunk.summary ? `summary: ${chunk.summary}` : null,
    "",
    contentOnly(chunk),
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function formatFullChunk(chunk, headingLine = null) {
  return [
    headingLine,
    `source_path: ${chunk.sourcePath}`,
    `type: ${chunk.noteType ?? "unknown"} repo: ${chunk.repoSlug ?? "unknown"}`,
    `heading: ${chunk.heading}`,
    chunk.summary ? `summary: ${chunk.summary}` : null,
    "",
    contentOnly(chunk),
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function contentOnly(chunk) {
  const separatorIndex = chunk.text.indexOf("\n\n");

  if (separatorIndex === -1) {
    return chunk.text;
  }

  return chunk.text.slice(separatorIndex + 2).trim();
}

function hasSubstantiveContent(chunk) {
  const content = contentOnly(chunk)
    .replace(/^#+\s+.+$/gm, "")
    .replace(/\s+/g, " ")
    .trim();

  return content.length >= 40;
}

function createExcerpt(content, query, maxLength = 240) {
  const compactContent = compactWhitespace(content);

  if (compactContent.length <= maxLength) {
    return compactContent;
  }

  const tokens = query
    .toLowerCase()
    .replace(/[^a-z0-9/._-]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
  const lowerContent = compactContent.toLowerCase();
  const matchIndex = tokens
    .map((token) => lowerContent.indexOf(token))
    .filter((index) => index >= 0)
    .sort((left, right) => left - right)[0];

  if (matchIndex === undefined) {
    return trimText(compactContent, maxLength);
  }

  const start = Math.max(0, matchIndex - Math.floor(maxLength / 3));
  const end = Math.min(compactContent.length, start + maxLength);
  const prefix = start > 0 ? "... " : "";
  const suffix = end < compactContent.length ? " ..." : "";

  return `${prefix}${compactContent.slice(start, end).trim()}${suffix}`;
}

function compactWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
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
