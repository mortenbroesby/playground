#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline";
import { statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { findProjectRoot } from "workspace-tools";

import {
  findMemoryChunk,
  getMemoryContext,
  loadMemoryCorpus,
  planMemoryQuery,
  retrieveMemoryCandidates,
} from "./obsidian-rag.mjs";
import {
  buildCleanupReport,
  buildWriteTargetPath,
  classifyMemoryInput,
  findStaleGeneratedFiles,
  findWriteDuplicates,
  loadTypedMemoryArtifacts,
  renderTypedNoteTemplate,
  validateWriteInput,
} from "./rag-governance.mjs";

const serverVersion = "1.0.0";
const repoRoot = findProjectRoot(path.dirname(fileURLToPath(import.meta.url)), "pnpm");
const vaultRoot = process.env.PLAYGROUND_OBSIDIAN_MEMORY_VAULT_ROOT
  ? path.resolve(process.env.PLAYGROUND_OBSIDIAN_MEMORY_VAULT_ROOT)
  : path.join(repoRoot, "vault");
const indexRoot = process.env.PLAYGROUND_OBSIDIAN_MEMORY_INDEX_ROOT
  ? path.resolve(process.env.PLAYGROUND_OBSIDIAN_MEMORY_INDEX_ROOT)
  : path.join(repoRoot, ".rag");

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
            "Optional note type filter, for example session, spec, architecture-record, or todo.",
        },
        integrity_mode: {
          type: "string",
          enum: ["prefer-healthy", "neutral", "prefer-warning", "exclude-warning"],
          description:
            "Optional integrity handling mode for warning-scoped notes. Defaults to prefer-healthy.",
        },
        vector_mode: {
          type: "string",
          enum: ["auto", "off"],
          description:
            "Optional vector retrieval mode. Defaults to auto; use off to disable vector search explicitly.",
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
  {
    name: "classify",
    description:
      "Classify a memory-related request into the typed RAG workflow and suggest retrieval filters.",
    inputSchema: {
      type: "object",
      properties: {
        input: {
          type: "string",
          description: "Free-text memory request or statement to classify.",
        },
      },
      required: ["input"],
      additionalProperties: false,
    },
  },
  {
    name: "propose_write",
    description:
      "Preview a typed memory note write without mutating the vault. Returns the rendered note, target path, and duplicate proposals.",
    inputSchema: {
      type: "object",
      properties: {
        note_type: {
          type: "string",
          description:
            "Typed note category such as spec, architecture-record, session, todo, investigation, reference, or glossary.",
        },
        title: {
          type: "string",
          description: "Human-readable note title.",
        },
        summary: {
          type: "string",
          description: "Short summary to store in frontmatter.",
        },
        owner: {
          type: "string",
          description: "Optional owner override for the proposed note.",
        },
        repo_slug: {
          type: "string",
          description: "Optional repo slug. Defaults to playground.",
        },
      },
      required: ["note_type", "title", "summary"],
      additionalProperties: false,
    },
  },
  {
    name: "clean_dry_run",
    description:
      "Return the current memory cleanup report without deleting or rewriting anything.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
];

let loadedCorpus = null;

function ensureCorpus() {
  try {
    statSync(path.join(indexRoot, "manifest.json"));
    statSync(path.join(indexRoot, "chunk-index.json"));
    statSync(path.join(indexRoot, "note-registry.json"));
  } catch {
    const result = spawnSync("pnpm", ["rag:index"], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: "pipe",
    });

    if (result.status !== 0) {
      throw new Error(
        `Unable to build typed memory indexes with pnpm rag:index.\n${result.stderr || result.stdout}`,
      );
    }
  }
}

async function loadCorpus() {
  ensureCorpus();

  const manifestPath = path.join(indexRoot, "manifest.json");
  const stat = statSync(manifestPath);

  if (loadedCorpus?.mtimeMs === stat.mtimeMs) {
    return loadedCorpus.value;
  }

  loadedCorpus = {
    mtimeMs: stat.mtimeMs,
    value: await loadMemoryCorpus(indexRoot),
  };

  return loadedCorpus.value;
}

async function searchMemory(args) {
  const corpus = await loadCorpus();
  const limit = Number.isFinite(args.limit)
    ? Math.max(1, Math.min(20, args.limit))
    : 5;
  const query = args.query.trim();
  const fullDetail = args.detail === "full";

  if (!query) {
    throw new Error("query is required");
  }

  const queryPlan = planMemoryQuery(query);
  const candidates = retrieveMemoryCandidates({
    corpus,
    query,
    limit,
    repoSlug: args.repo_slug,
    noteType: args.note_type,
    integrityMode: args.integrity_mode,
    vectorMode: args.vector_mode,
    queryPlan,
  });
  const hits = candidates.filter((hit) => hasSubstantiveContent(hit));
  const retrievalSummary = formatRetrievalSummary(candidates.retrieval);

  if (hits.length === 0) {
    return [`No memory results found for: ${query}`, retrievalSummary]
      .filter(Boolean)
      .join("\n");
  }

  const formattedHits = hits.map((chunk, index) => {
    if (fullDetail) {
      return formatFullChunk(chunk, `#${index + 1} score=${chunk.score}`);
    }

    return [
      `#${index + 1} score=${chunk.score}`,
      `source_path: ${chunk.sourcePath}`,
      `type: ${chunk.noteType ?? "unknown"} status: ${chunk.status ?? "unknown"} repo: ${chunk.repoSlug ?? "unknown"}`,
      `heading: ${chunk.heading}`,
      chunk.summary ? `summary: ${chunk.summary}` : null,
      "",
      `excerpt: ${createExcerpt(contentOnly(chunk), query)}`,
    ]
      .filter((line) => line !== null)
      .join("\n");
  });

  if (fullDetail) {
    return [retrievalSummary, formattedHits.join("\n\n---\n\n")]
      .filter(Boolean)
      .join("\n\n");
  }

  return [
    "Compact memory results. Use memory_unfold with a source_path for detail.",
    retrievalSummary,
    "",
    formattedHits.join("\n\n---\n\n"),
  ]
    .filter(Boolean)
    .join("\n");
}

async function unfoldMemory(args) {
  const corpus = await loadCorpus();
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

async function contextMemory(args) {
  const repoSlug = args.repo_slug ?? "playground";
  const fullDetail = args.detail === "full";
  const corpus = await loadCorpus();
  const chunks = getMemoryContext({
    corpus,
    repoSlug,
  });

  if (chunks.length === 0) {
    return searchMemory({
      query: `architecture spec plan memory ${repoSlug}`,
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

function classifyInput(args) {
  const input = args.input?.trim();

  if (!input) {
    throw new Error("input is required");
  }

  return classifyMemoryInput(input);
}

async function proposeWrite(args) {
  validateWriteInput({
    noteType: args.note_type,
    title: args.title,
    summary: args.summary,
  });

  const artifacts = await loadTypedMemoryArtifacts(indexRoot);
  const duplicates = findWriteDuplicates({
    noteRegistry: artifacts.noteRegistry,
    noteType: args.note_type,
    title: args.title,
    summary: args.summary,
  });

  if (duplicates.exact.length > 0) {
    throw new Error(
      `Exact duplicate note candidate exists:\n${duplicates.exact.map((note) => `- ${note.path}`).join("\n")}`,
    );
  }

  const repoSlug = args.repo_slug ?? "playground";
  const target = buildWriteTargetPath({
    vaultRoot,
    repoSlug,
    noteType: args.note_type,
    title: args.title,
  });
  const rendered = renderTypedNoteTemplate({
    noteType: args.note_type,
    repoSlug,
    title: args.title,
    summary: args.summary,
    owner: args.owner,
  });

  return {
    note_id: rendered.noteId,
    type: args.note_type,
    path: path.relative(repoRoot, target.absolutePath),
    repo_slug: repoSlug,
    dry_run: true,
    duplicate_proposals: duplicates.heuristic,
    content_preview: rendered.content,
    next_step: "Review the proposal, then use pnpm rag:write --apply to create the note.",
  };
}

async function cleanDryRun() {
  const artifacts = await loadTypedMemoryArtifacts(indexRoot);
  const staleGeneratedFiles = await findStaleGeneratedFiles(indexRoot);

  return {
    dry_run: true,
    ...buildCleanupReport({
      noteRegistry: artifacts.noteRegistry,
      chunkIndex: artifacts.chunkIndex,
      diagnostics: artifacts.diagnostics,
      staleGeneratedFiles,
    }),
  };
}

function formatContextChunk(chunk, fullDetail) {
  const integrityLine =
    chunk.validationStatus === "warning"
      ? `integrity: warning (${(chunk.validationIssues ?? []).join(", ") || "unspecified"})`
      : null;

  if (!fullDetail) {
    return [`## ${chunk.heading}`, integrityLine, trimText(contentOnly(chunk), 450)]
      .filter((line) => line !== null)
      .join("\n");
  }

  return [
    `## ${chunk.heading}`,
    `source_path: ${chunk.sourcePath}`,
    chunk.summary ? `summary: ${chunk.summary}` : null,
    integrityLine,
    "",
    contentOnly(chunk),
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function formatRetrievalSummary(retrieval) {
  if (!retrieval) {
    return null;
  }

  const sourceLine = `retrieval_sources: ${retrieval.sources.join(", ")}`;
  const vector = retrieval.vector;
  const vectorLine = vector.available
    ? `vector_search: ready (${vector.engine?.name ?? "unknown"}, ${vector.dimensions ?? "?"}d, candidates=${vector.candidateCount ?? 0})`
    : `vector_search: unavailable (${vector.reason ?? "unknown"})`;

  return [sourceLine, vectorLine].join("\n");
}

function formatFullChunk(chunk, headingLine = null) {
  const integrityLine =
    chunk.validationStatus === "warning"
      ? `integrity: warning (${(chunk.validationIssues ?? []).join(", ") || "unspecified"})`
      : null;

  return [
    headingLine,
    `source_path: ${chunk.sourcePath}`,
    `type: ${chunk.noteType ?? "unknown"} status: ${chunk.status ?? "unknown"} repo: ${chunk.repoSlug ?? "unknown"}`,
    `heading: ${chunk.heading}`,
    chunk.summary ? `summary: ${chunk.summary}` : null,
    integrityLine,
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

function resultJson(value) {
  return {
    structuredContent: value,
    content: [
      {
        type: "text",
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

async function handleToolCall(params) {
  const args = params.arguments ?? {};

  if (params.name === "memory_search") {
    return resultText(await searchMemory(args));
  }

  if (params.name === "memory_unfold") {
    return resultText(await unfoldMemory(args));
  }

  if (params.name === "memory_context") {
    return resultText(await contextMemory(args));
  }

  if (params.name === "classify") {
    return resultJson(classifyInput(args));
  }

  if (params.name === "propose_write") {
    return resultJson(await proposeWrite(args));
  }

  if (params.name === "clean_dry_run") {
    return resultJson(await cleanDryRun(args));
  }

  throw new Error(`Unknown tool: ${params.name}`);
}

async function handleRequest(message) {
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

  Promise.resolve(handleRequest(message))
    .then((result) => sendResponse(message.id, result))
    .catch((error) => sendError(message.id, error));
});
