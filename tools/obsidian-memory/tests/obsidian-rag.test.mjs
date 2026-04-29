import test from "node:test";
import assert from "node:assert/strict";

import {
  assembleMemoryContext,
  indexMemoryCorpus,
  planMemoryQuery,
  retrieveMemoryCandidates,
} from "../src/obsidian-rag.mjs";

const indexedCorpus = indexMemoryCorpus({
  chunks: [
    {
      id: "decision-1",
      source_file:
        "vault/00 Repositories/playground/02 Decisions/2026-04-08 Narrow MFE Scope.md",
      source_path:
        "vault/00 Repositories/playground/02 Decisions/2026-04-08 Narrow MFE Scope.md § Narrow MFE Scope",
      heading: "Narrow MFE Scope",
      heading_level: 0,
      note_type: "repo-decision",
      repo_slug: "playground",
      tags: ["repo/playground", "type/decision"],
      status: "accepted",
      summary:
        "Narrow the microfrontend seam so todo-app remains the sole live injected remote.",
      keywords: ["todo-app", "sole live injected remote", "microfrontend"],
      mtime_ms: 1,
      text: "Source: vault/... Narrow the microfrontend seam so todo-app remains the sole live injected remote.",
    },
    {
      id: "architecture-1",
      source_file:
        "vault/00 Repositories/playground/01 Architecture/Host Ownership.md",
      source_path:
        "vault/00 Repositories/playground/01 Architecture/Host Ownership.md § Host Ownership",
      heading: "Host Ownership",
      heading_level: 0,
      note_type: "repo-architecture",
      repo_slug: "playground",
      tags: ["repo/playground"],
      status: null,
      summary:
        "The host app owns routing, page composition, and page metadata for public and playground routes.",
      keywords: ["host routing", "page composition", "metadata"],
      mtime_ms: 1,
      text: "Source: vault/... The host app owns routing and page composition.",
    },
    {
      id: "session-1",
      source_file:
        "vault/00 Repositories/playground/03 Sessions/2026-04-10 Route Metadata Pass.md",
      source_path:
        "vault/00 Repositories/playground/03 Sessions/2026-04-10 Route Metadata Pass.md § Route Metadata Pass",
      heading: "Route Metadata Pass",
      heading_level: 0,
      note_type: "repo-session",
      repo_slug: "playground",
      tags: ["repo/playground"],
      status: null,
      summary:
        "Added route-aware metadata coverage across playground routes and kept host route ownership explicit.",
      keywords: ["route metadata", "SEO", "host route ownership"],
      mtime_ms: 1,
      text: "Source: vault/... Verified that playground pages have route-aware metadata.",
    },
  ],
});

const typedCorpus = indexMemoryCorpus({
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
});

test("retrieveMemoryCandidates favors decision note affinity and exact summary match", () => {
  const candidates = retrieveMemoryCandidates({
    corpus: indexedCorpus,
    query: "Which remote is the sole live injected remote decision?",
    limit: 3,
  });

  assert.equal(candidates[0]?.chunkId, "decision-1");
  assert.ok(candidates[0].matchReasons.includes("note-type:decision"));
  assert.ok(
    candidates[0].matchReasons.some((reason) => reason.startsWith("keyword-token:")),
  );
});

test("retrieveMemoryCandidates favors architecture note for architecture queries", () => {
  const candidates = retrieveMemoryCandidates({
    corpus: indexedCorpus,
    query: "Who owns routing and page composition architecture?",
    limit: 3,
  });

  assert.equal(candidates[0]?.chunkId, "architecture-1");
  assert.ok(candidates[0].matchReasons.includes("note-type:architecture"));
});

test("assembleMemoryContext returns bounded items and structured references", () => {
  const candidates = retrieveMemoryCandidates({
    corpus: indexedCorpus,
    query: "playground metadata",
    limit: 3,
  });

  const context = assembleMemoryContext({
    query: "playground metadata",
    candidates,
    tokenBudget: 20,
    maxItems: 3,
  });

  assert.equal(context.query, "playground metadata");
  assert.ok(context.selectedCount >= 1);
  assert.equal(context.references.length, context.selectedCount);
  assert.ok(context.references[0].sourceFile.startsWith("vault/"));
  assert.ok(context.estimatedTokens <= context.tokenBudget);
});

test("planMemoryQuery identifies spec-oriented retrieval intent", () => {
  const plan = planMemoryQuery("What spec should we build for RAG cleanup?");

  assert.equal(plan.normalized, "what spec should we build for rag cleanup?");
  assert.ok(plan.expectedNoteTypes.includes("spec"));
  assert.ok(plan.expectedNoteTypes.includes("todo"));
  assert.ok(plan.negativeStatuses.includes("archived"));
});

test("retrieveMemoryCandidates favors typed spec notes for implementation queries", () => {
  const candidates = retrieveMemoryCandidates({
    corpus: typedCorpus,
    query: "What should we build for typed RAG memory?",
    limit: 3,
    queryPlan: planMemoryQuery("What should we build for typed RAG memory?"),
  });

  assert.equal(candidates[0]?.chunkId, "spec-plan");
  assert.equal(candidates[0]?.noteType, "spec");
  assert.ok(candidates[0].matchReasons.includes("plan-type:spec"));
});

test("retrieveMemoryCandidates applies graph boosts to linked architecture notes", () => {
  const candidates = retrieveMemoryCandidates({
    corpus: typedCorpus,
    query: "typed RAG memory implementation plan",
    limit: 3,
    queryPlan: planMemoryQuery("typed RAG memory implementation plan"),
  });

  const architectureCandidate = candidates.find(
    (candidate) => candidate.chunkId === "arch-overview",
  );

  assert.ok(architectureCandidate);
  assert.ok(
    architectureCandidate.matchReasons.some((reason) =>
      reason.startsWith("graph:"),
    ),
  );
});

test("assembleMemoryContext reports omitted items when token budget truncates", () => {
  const candidates = retrieveMemoryCandidates({
    corpus: typedCorpus,
    query: "typed RAG memory",
    limit: 3,
    queryPlan: planMemoryQuery("typed RAG memory"),
  });

  const context = assembleMemoryContext({
    query: "typed RAG memory",
    candidates,
    tokenBudget: 10,
    maxItems: 3,
  });

  assert.ok(context.omitted.length >= 1);
  assert.equal(context.omitted[0].reason, "token_budget");
});
