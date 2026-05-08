#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  indexMemoryCorpus,
  planMemoryQuery,
  retrieveMemoryCandidates,
} from "./obsidian-rag.mjs";
import {
  DETERMINISTIC_VECTOR_ENGINE,
  buildChunkEmbeddingInput,
  embedTextDeterministically,
} from "./deterministic-embeddings.mjs";

const DEFAULT_FORMAT = "json";

function buildImplementationCorpus() {
  return indexMemoryCorpus({
    noteRegistry: [
      {
        id: "note-spec",
        type: "spec",
        path: "vault/00 Repositories/playground/specs/rag-rebuild.md",
        title: "Rebuild RAG memory",
        status: "active",
        created: "2026-04-29",
        updated: "2026-04-29",
        summary: "Spec for rebuilding repo memory.",
        tags: ["rag", "memory"],
        keywords: ["hybrid retrieval", "cleanup"],
        outbound_links: ["note-arch"],
        inbound_links: [],
        content_hash: "spec-hash",
        mtime_ms: 1,
        owner: "agent",
        repo_slug: "playground",
      },
      {
        id: "note-arch",
        type: "architecture-record",
        path: "vault/00 Repositories/playground/01 Architecture/Repo Memory Architecture.md",
        title: "Repo Memory Architecture",
        status: "accepted",
        created: "2026-04-20",
        updated: "2026-04-20",
        summary: "Durable architecture for repo-local memory.",
        tags: ["repo/playground"],
        keywords: ["architecture", "memory"],
        outbound_links: [],
        inbound_links: ["note-spec"],
        content_hash: "arch-hash",
        mtime_ms: 1,
        owner: "morten",
        repo_slug: "playground",
      },
      {
        id: "note-session",
        type: "session",
        path: "vault/00 Repositories/playground/03 Sessions/2026-04-29 RAG Typed Index Foundation.md",
        title: "RAG Typed Index Foundation",
        status: "active",
        created: "2026-04-29",
        updated: "2026-04-29",
        summary: "Work log for the typed index migration.",
        tags: ["repo/playground"],
        keywords: ["rag", "migration"],
        outbound_links: [],
        inbound_links: [],
        content_hash: "session-hash",
        mtime_ms: 1,
        owner: "agent",
        repo_slug: "playground",
      },
    ],
    chunkIndex: [
      {
        chunk_id: "spec-plan",
        note_id: "note-spec",
        source_path:
          "vault/00 Repositories/playground/specs/rag-rebuild.md § Implementation plan",
        heading: "Implementation plan",
        heading_level: 2,
        text: "Implementation plan for rebuilding typed RAG memory with cleanup and hybrid retrieval.",
        summary: "Implementation plan for rebuilding typed RAG memory.",
        tokens_estimated: 16,
        content_hash: "chunk-spec",
        type: "spec",
        status: "active",
      },
      {
        chunk_id: "arch-overview",
        note_id: "note-arch",
        source_path:
          "vault/00 Repositories/playground/01 Architecture/Repo Memory Architecture.md § Overview",
        heading: "Overview",
        heading_level: 2,
        text: "Architecture record describing why repo-local memory uses typed indexes and durable notes.",
        summary: "Architecture record for typed repo memory.",
        tokens_estimated: 15,
        content_hash: "chunk-arch",
        type: "architecture-record",
        status: "accepted",
      },
      {
        chunk_id: "session-log",
        note_id: "note-session",
        source_path:
          "vault/00 Repositories/playground/03 Sessions/2026-04-29 RAG Typed Index Foundation.md § Summary",
        heading: "Summary",
        heading_level: 2,
        text: "Session log covering the first typed index migration slice and compatibility work.",
        summary: "Session log for typed index migration.",
        tokens_estimated: 13,
        content_hash: "chunk-session",
        type: "session",
        status: "active",
      },
    ],
    graphIndex: {
      nodes: [
        { id: "note-spec", type: "spec", status: "active" },
        { id: "note-arch", type: "architecture-record", status: "accepted" },
        { id: "note-session", type: "session", status: "active" },
      ],
      edges: [
        {
          from: "note-spec",
          to: "note-arch",
          type: "relates_to",
        },
      ],
    },
    vectorIndex: {
      schema_version: 2,
      generated_at: "2026-04-30T00:00:00.000Z",
      status: "ready",
      engine: DETERMINISTIC_VECTOR_ENGINE,
      embeddings: [
        {
          chunk_id: "spec-plan",
          note_id: "note-spec",
          values: embedTextDeterministically(
            buildChunkEmbeddingInput({
              note: {
                title: "Rebuild RAG memory",
                summary: "Spec for rebuilding repo memory.",
                keywords: ["hybrid retrieval", "cleanup"],
                tags: ["rag", "memory"],
              },
              chunk: {
                heading: "Implementation plan",
                source_path:
                  "vault/00 Repositories/playground/specs/rag-rebuild.md § Implementation plan",
                text: "Implementation plan for rebuilding typed RAG memory with cleanup and hybrid retrieval.",
                summary: "Implementation plan for rebuilding typed RAG memory.",
              },
            }),
          ),
        },
        {
          chunk_id: "arch-overview",
          note_id: "note-arch",
          values: embedTextDeterministically(
            buildChunkEmbeddingInput({
              note: {
                title: "Repo Memory Architecture",
                summary: "Durable architecture for repo-local memory.",
                keywords: ["architecture", "memory"],
                tags: ["repo/playground"],
              },
              chunk: {
                heading: "Overview",
                source_path:
                  "vault/00 Repositories/playground/01 Architecture/Repo Memory Architecture.md § Overview",
                text: "Architecture record describing why repo-local memory uses typed indexes and durable notes.",
                summary: "Architecture record for typed repo memory.",
              },
            }),
          ),
        },
        {
          chunk_id: "session-log",
          note_id: "note-session",
          values: embedTextDeterministically(
            buildChunkEmbeddingInput({
              note: {
                title: "RAG Typed Index Foundation",
                summary: "Work log for the typed index migration.",
                keywords: ["rag", "migration"],
                tags: ["repo/playground"],
              },
              chunk: {
                heading: "Summary",
                source_path:
                  "vault/00 Repositories/playground/03 Sessions/2026-04-29 RAG Typed Index Foundation.md § Summary",
                text: "Session log covering the first typed index migration slice and compatibility work.",
                summary: "Session log for typed index migration.",
              },
            }),
          ),
        },
      ],
    },
  });
}

function buildLexicalArtifactCorpus() {
  return indexMemoryCorpus({
    noteRegistry: [
      {
        id: "note-routing",
        type: "architecture-record",
        path: "vault/arch/doc-a.md",
        title: "Document A",
        status: "accepted",
        created: "2026-05-01",
        updated: "2026-05-01",
        summary: "Alpha beta gamma.",
        tags: ["repo/playground"],
        keywords: ["alpha"],
        outbound_links: [],
        inbound_links: [],
        content_hash: "routing-decision-hash",
        mtime_ms: 1,
        owner: "agent",
        repo_slug: "playground",
      },
      {
        id: "note-generic",
        type: "reference",
        path: "vault/reference/generic.md",
        title: "Generic Reference",
        status: "accepted",
        created: "2026-05-01",
        updated: "2026-05-01",
        summary: "Generic reference entry.",
        tags: ["repo/playground"],
        keywords: ["generic"],
        outbound_links: [],
        inbound_links: [],
        content_hash: "generic-reference-hash",
        mtime_ms: 1,
        owner: "agent",
        repo_slug: "playground",
      },
    ],
    chunkIndex: [
      {
        chunk_id: "decision-routing",
        note_id: "note-routing",
        source_path: "vault/arch/doc-a.md § Overview",
        heading: "Overview",
        heading_level: 2,
        text: "Alpha beta gamma.",
        summary: "Alpha beta gamma.",
        tokens_estimated: 3,
        content_hash: "decision-routing-chunk",
        type: "architecture-record",
        status: "accepted",
      },
      {
        chunk_id: "generic-noise",
        note_id: "note-generic",
        source_path: "vault/reference/generic.md § Noise",
        heading: "Noise",
        heading_level: 2,
        text: "Alpha beta gamma.",
        summary: "Alpha beta gamma.",
        tokens_estimated: 3,
        content_hash: "generic-noise-chunk",
        type: "reference",
        status: "accepted",
      },
    ],
    graphIndex: {
      nodes: [],
      edges: [],
    },
    lexicalIndex: {
      schema_version: 3,
      generated_at: "2026-05-01T00:00:00.000Z",
      documentCount: 2,
      fields: {
        text: true,
        title: true,
        path: true,
        summary: true,
        tags: true,
        keywords: true,
      },
      avgFieldLengths: {
        text: 3,
        title: 2,
        path: 2,
        summary: 3,
        tags: 1,
        keywords: 1,
      },
      documents: {
        "decision-routing": {
          note_id: "note-routing",
          fieldLengths: {
            text: 3,
            title: 2,
            path: 2,
            summary: 3,
            tags: 1,
            keywords: 2,
          },
        },
        "generic-noise": {
          note_id: "note-generic",
          fieldLengths: {
            text: 3,
            title: 2,
            path: 2,
            summary: 3,
            tags: 1,
            keywords: 1,
          },
        },
      },
      terms: {
        shell: {
          docs: [
            {
              chunk_id: "decision-routing",
              fields: {
                title: 1,
                path: 1,
                keywords: 1,
              },
            },
          ],
        },
        navigation: {
          docs: [
            {
              chunk_id: "decision-routing",
              fields: {
                title: 1,
                path: 1,
                keywords: 1,
              },
            },
          ],
        },
      },
    },
  });
}

function buildSemanticFalsePositiveCorpus() {
  return indexMemoryCorpus({
    noteRegistry: [
      {
        id: "note-lexical",
        type: "reference",
        path: "vault/reference/doc-one.md",
        title: "Doc One",
        status: "accepted",
        created: "2026-05-01",
        updated: "2026-05-01",
        summary: "Reference note with sparse wording.",
        tags: ["repo/playground"],
        keywords: ["alpha"],
        outbound_links: [],
        inbound_links: [],
        content_hash: "note-lexical-hash",
        mtime_ms: 1,
        owner: "agent",
        repo_slug: "playground",
      },
      {
        id: "note-semantic",
        type: "architecture-record",
        path: "vault/arch/semantic.md",
        title: "Semantic Shell Architecture",
        status: "accepted",
        created: "2026-05-01",
        updated: "2026-05-01",
        summary: "Architecture note with semantic but not lexical support.",
        tags: ["repo/playground"],
        keywords: ["shell", "navigation"],
        outbound_links: [],
        inbound_links: [],
        content_hash: "note-semantic-hash",
        mtime_ms: 1,
        owner: "agent",
        repo_slug: "playground",
      },
    ],
    chunkIndex: [
      {
        chunk_id: "routing-reference",
        note_id: "note-lexical",
        source_path: "vault/reference/doc-one.md § Overview",
        heading: "Overview",
        heading_level: 2,
        text: "Routing note.",
        summary: "Sparse note.",
        tokens_estimated: 1,
        content_hash: "routing-reference-chunk",
        type: "reference",
        status: "accepted",
      },
      {
        chunk_id: "semantic-shell",
        note_id: "note-semantic",
        source_path: "vault/arch/semantic.md § Overview",
        heading: "Overview",
        heading_level: 2,
        text: "Alpha beta gamma.",
        summary: "Alpha beta gamma.",
        tokens_estimated: 3,
        content_hash: "semantic-shell-chunk",
        type: "architecture-record",
        status: "accepted",
      },
    ],
    graphIndex: {
      nodes: [],
      edges: [],
    },
    vectorIndex: {
      schema_version: 2,
      generated_at: "2026-05-01T00:00:00.000Z",
      status: "ready",
      engine: DETERMINISTIC_VECTOR_ENGINE,
      embeddings: [
        {
          chunk_id: "routing-reference",
          note_id: "note-lexical",
          values: embedTextDeterministically("deploy release topology"),
        },
        {
          chunk_id: "semantic-shell",
          note_id: "note-semantic",
          values: embedTextDeterministically("routing direct lexical support"),
        },
      ],
    },
  });
}

const DEFAULT_EVAL_CASES = [
  {
    id: "implementation-spec",
    query: "What should we build for typed RAG memory?",
    corpus: buildImplementationCorpus,
    retrievalMode: "default",
    expectedTopChunkId: "spec-plan",
  },
  {
    id: "lexical-shell-navigation",
    query: "shell navigation",
    corpus: buildLexicalArtifactCorpus,
    retrievalMode: "default",
    expectedTopChunkId: "decision-routing",
  },
  {
    id: "routing-guidance-default",
    query: "routing guidance",
    corpus: buildSemanticFalsePositiveCorpus,
    retrievalMode: "default",
    expectedTopChunkId: "routing-reference",
  },
  {
    id: "routing-guidance-quality",
    query: "routing guidance",
    corpus: buildSemanticFalsePositiveCorpus,
    retrievalMode: "quality",
    expectedTopChunkId: "routing-reference",
  },
];

export function parseArgs(argv) {
  const options = {
    format: DEFAULT_FORMAT,
    caseId: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--case") {
      options.caseId = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg === "--format") {
      options.format = argv[index + 1] ?? options.format;
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

function printUsage() {
  console.log(
    [
      "Usage:",
      "  pnpm rag:evals [--case <id>] [--format json]",
      "",
      "Run the judged retrieval eval suite over representative typed-memory fixtures.",
    ].join("\n"),
  );
}

function evaluateCase(entry) {
  const corpus = entry.corpus();
  const candidates = retrieveMemoryCandidates({
    corpus,
    query: entry.query,
    limit: 2,
    retrievalMode: entry.retrievalMode,
    queryPlan: planMemoryQuery(entry.query),
  });
  const top = candidates[0] ?? null;

  return {
    id: entry.id,
    query: entry.query,
    retrievalMode: entry.retrievalMode,
    expectedTopChunkId: entry.expectedTopChunkId,
    topChunkId: top?.chunkId ?? null,
    topSourcePath: top?.sourcePath ?? null,
    topMatchReasons: [...(top?.matchReasons ?? [])],
    hitChunkIds: candidates.map((candidate) => candidate.chunkId),
    retrieval: {
      candidatePool: candidates.retrieval?.candidatePool ?? 0,
      sources: [...(candidates.retrieval?.sources ?? [])],
    },
    passed: top?.chunkId === entry.expectedTopChunkId,
  };
}

export async function runRetrievalEvals(options = {}) {
  const requestedCaseId = options.caseId ?? null;
  const selectedCases = requestedCaseId
    ? DEFAULT_EVAL_CASES.filter((entry) => entry.id === requestedCaseId)
    : DEFAULT_EVAL_CASES;

  if (requestedCaseId && selectedCases.length === 0) {
    throw new Error(`Unknown retrieval eval case: ${requestedCaseId}`);
  }

  const results = selectedCases.map(evaluateCase);
  const passed = results.filter((entry) => entry.passed).length;

  return {
    passed: passed === results.length,
    summary: {
      total: results.length,
      passed,
      failed: results.length - passed,
      retrievalModes: results.reduce(
        (accumulator, entry) => ({
          ...accumulator,
          [entry.retrievalMode]: (accumulator[entry.retrievalMode] ?? 0) + 1,
        }),
        {},
      ),
    },
    results,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await runRetrievalEvals(options);
  const output =
    options.format === DEFAULT_FORMAT ? JSON.stringify(result, null, 2) : JSON.stringify(result);

  console.log(output);

  if (!result.passed) {
    process.exitCode = 1;
  }
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exit(1);
  });
}
