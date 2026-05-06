#!/usr/bin/env node

import { stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { findProjectRoot } from "workspace-tools";

import {
  assembleMemoryContext,
  loadMemoryCorpus,
  planMemoryQuery,
  retrieveMemoryCandidates,
} from "./obsidian-rag.mjs";

const repoRoot = findProjectRoot(path.dirname(fileURLToPath(import.meta.url)), "pnpm");
const defaultIndexRoot = path.join(repoRoot, ".rag");

/**
 * Parse command-line flags for the typed memory query CLI.
 */
function parseArgs(argv) {
  const options = {
    query: "",
    limit: 5,
    tokenBudget: 600,
    repoSlug: undefined,
    noteType: undefined,
    integrityMode: "prefer-healthy",
    vectorMode: "auto",
    retrievalMode: "default",
    indexPath: defaultIndexRoot,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--query") {
      options.query = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--limit") {
      options.limit = Number(argv[index + 1] ?? options.limit);
      index += 1;
      continue;
    }

    if (arg === "--budget") {
      options.tokenBudget = Number(argv[index + 1] ?? options.tokenBudget);
      index += 1;
      continue;
    }

    if (arg === "--repo-slug") {
      options.repoSlug = argv[index + 1] ?? undefined;
      index += 1;
      continue;
    }

    if (arg === "--note-type") {
      options.noteType = argv[index + 1] ?? undefined;
      index += 1;
      continue;
    }

    if (arg === "--integrity-mode") {
      options.integrityMode = argv[index + 1] ?? options.integrityMode;
      index += 1;
      continue;
    }

    if (arg === "--vector-mode") {
      options.vectorMode = argv[index + 1] ?? options.vectorMode;
      index += 1;
      continue;
    }

    if (arg === "--retrieval-mode") {
      options.retrievalMode = argv[index + 1] ?? options.retrievalMode;
      index += 1;
      continue;
    }

    if (arg === "--corpus") {
      options.indexPath = path.resolve(process.cwd(), argv[index + 1] ?? "");
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }
  }

  return options;
}

/**
 * Print usage for `pnpm rag:query`.
 */
function printUsage() {
  console.log(
    [
      "Usage:",
      "  pnpm rag:query --query <text> [--limit 5] [--budget 600] [--repo-slug playground] [--note-type session] [--integrity-mode prefer-healthy|neutral|prefer-warning|exclude-warning] [--vector-mode auto|off] [--retrieval-mode default|quality]",
      "",
      "Search the typed Obsidian memory indexes and assemble a bounded context bundle.",
    ].join("\n"),
  );
}

/**
 * Ensure the typed memory index exists before attempting retrieval.
 */
async function ensureIndex(indexPath) {
  try {
    const indexRoot = indexPath.endsWith(".json") ? path.dirname(indexPath) : indexPath;
    await stat(path.join(indexRoot, "chunk-index.json"));
    await stat(path.join(indexRoot, "note-registry.json"));
  } catch {
    throw new Error(
      `Typed memory index not found at ${indexPath}. Run pnpm rag:index first.`,
    );
  }
}

/**
 * Run the typed memory query CLI and print ranked candidates plus context.
 */
async function run() {
  const options = parseArgs(process.argv.slice(2));

  if (!options.query.trim()) {
    throw new Error("--query is required");
  }

  await ensureIndex(options.indexPath);
  const queryPlan = planMemoryQuery(options.query);
  const corpus = await loadMemoryCorpus(options.indexPath);
  const candidates = retrieveMemoryCandidates({
    corpus,
    query: options.query,
    limit: options.limit,
    repoSlug: options.repoSlug,
    noteType: options.noteType,
    integrityMode: options.integrityMode,
    vectorMode: options.vectorMode,
    retrievalMode: options.retrievalMode,
    queryPlan,
  });
  const context = assembleMemoryContext({
    query: options.query,
    candidates,
    tokenBudget: options.tokenBudget,
  });

  const output = {
    query: options.query,
    queryPlan,
    indexPath: path.relative(repoRoot, options.indexPath),
    filters: {
      repoSlug: options.repoSlug ?? null,
      noteType: options.noteType ?? null,
      integrityMode: options.integrityMode,
      vectorMode: options.vectorMode,
      retrievalMode: options.retrievalMode,
    },
    retrieval: candidates.retrieval,
    candidates,
    context,
  };

  console.log(JSON.stringify(output, null, 2));
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
