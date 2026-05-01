import test from "node:test";
import assert from "node:assert/strict";

import {
  assembleMemoryContext,
  classifyMemoryQuery,
  indexMemoryCorpus,
  planMemoryQuery,
  retrieveMemoryCandidates,
} from "../src/obsidian-rag.mjs";
import {
  DETERMINISTIC_VECTOR_ENGINE,
  buildChunkEmbeddingInput,
  embedTextDeterministically,
} from "../src/deterministic-embeddings.mjs";

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

const semanticVectorCorpus = indexMemoryCorpus({
  noteRegistry: [
    {
      id: "routing-ownership",
      type: "architecture-record",
      path: "vault/arch/routing-ownership.md",
      title: "Routing Ownership",
      status: "accepted",
      created: "2026-04-30",
      updated: "2026-04-30",
      summary: "The shell keeps control of navigation and layout orchestration.",
      tags: ["repo/playground"],
      keywords: ["navigation", "shell", "layout"],
      outbound_links: [],
      inbound_links: [],
      content_hash: "routing-ownership-hash",
      mtime_ms: 1,
      owner: "agent",
      repo_slug: "playground",
    },
    {
      id: "deploy-architecture",
      type: "architecture-record",
      path: "vault/arch/deploy-architecture.md",
      title: "Deployment Architecture",
      status: "accepted",
      created: "2026-04-30",
      updated: "2026-04-30",
      summary: "Release topology for the host and remotes.",
      tags: ["repo/playground"],
      keywords: ["deploy", "release", "topology"],
      outbound_links: [],
      inbound_links: [],
      content_hash: "deploy-architecture-hash",
      mtime_ms: 1,
      owner: "agent",
      repo_slug: "playground",
    },
  ],
  chunkIndex: [
    {
      chunk_id: "routing-shell",
      note_id: "routing-ownership",
      source_path: "vault/arch/routing-ownership.md § Overview",
      heading: "Overview",
      heading_level: 2,
      text: "The shell controls navigation decisions and page layout composition for the application.",
      summary: "Shell controls navigation and layout.",
      tokens_estimated: 14,
      content_hash: "routing-shell-chunk",
      type: "architecture-record",
      status: "accepted",
    },
    {
      chunk_id: "deploy-topology",
      note_id: "deploy-architecture",
      source_path: "vault/arch/deploy-architecture.md § Overview",
      heading: "Overview",
      heading_level: 2,
      text: "Deployment topology covers release promotion and service boundaries.",
      summary: "Deployment topology for releases.",
      tokens_estimated: 11,
      content_hash: "deploy-topology-chunk",
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
    generated_at: "2026-04-30T00:00:00.000Z",
    status: "ready",
    engine: DETERMINISTIC_VECTOR_ENGINE,
    embeddings: [
      {
        chunk_id: "routing-shell",
        note_id: "routing-ownership",
        values: embedTextDeterministically(
          "shell navigation layout ownership architecture",
        ),
      },
      {
        chunk_id: "deploy-topology",
        note_id: "deploy-architecture",
        values: embedTextDeterministically(
          "deployment release topology services",
        ),
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

test("classifyMemoryQuery returns explicit retrieval intent and decisions", () => {
  const classification = classifyMemoryQuery("What spec should we build for RAG cleanup?");

  assert.equal(classification.normalized, "what spec should we build for rag cleanup?");
  assert.equal(classification.intent, "implementation");
  assert.ok(classification.preferredNoteTypes.includes("spec"));
  assert.ok(classification.preferredNoteTypes.includes("todo"));
  assert.ok(classification.excludedStatuses.includes("archived"));
});

test("planMemoryQuery separates classification from planning and routing", () => {
  const plan = planMemoryQuery("What spec should we build for RAG cleanup?");

  assert.equal(plan.classification.intent, "implementation");
  assert.deepEqual(plan.expectedNoteTypes, plan.classification.preferredNoteTypes);
  assert.deepEqual(plan.negativeStatuses, plan.classification.excludedStatuses);
  assert.equal(plan.routing.allowArchived, false);
  assert.equal(plan.routing.useGraphExpansion, true);
  assert.equal(plan.variants.normalized, "what spec should we build for rag cleanup?");
  assert.ok(
    plan.variants.expanded.some((variant) => variant.includes("implementation spec")),
  );
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
    query: "hybrid retrieval cleanup implementation plan",
    limit: 3,
    queryPlan: planMemoryQuery("hybrid retrieval cleanup implementation plan"),
  });

  const architectureCandidate = candidates.find(
    (candidate) => candidate.chunkId === "arch-overview",
  );

  assert.ok(architectureCandidate);
  assert.ok(architectureCandidate.matchReasons.includes("route:graph"));
  assert.ok(
    architectureCandidate.matchReasons.some((reason) =>
      reason.startsWith("graph:"),
    ),
  );
});

test("retrieveMemoryCandidates disables graph expansion for reference-style queries", () => {
  const candidates = retrieveMemoryCandidates({
    corpus: typedCorpus,
    query: "reference api for typed RAG memory",
    limit: 3,
    queryPlan: planMemoryQuery("reference api for typed RAG memory"),
  });

  const architectureCandidate = candidates.find(
    (candidate) => candidate.chunkId === "arch-overview",
  );

  assert.ok(architectureCandidate);
  assert.ok(
    architectureCandidate.matchReasons.every((reason) => !reason.startsWith("graph:")),
  );
  assert.ok(!architectureCandidate.matchReasons.includes("route:graph"));
});

test("retrieveMemoryCandidates explains when vector retrieval is disabled", () => {
  const candidates = retrieveMemoryCandidates({
    corpus: semanticVectorCorpus,
    query: "who owns routing",
    limit: 2,
    vectorMode: "off",
    queryPlan: planMemoryQuery("who owns routing"),
  });

  assert.equal(candidates.retrieval.vector.available, false);
  assert.equal(candidates.retrieval.vector.reason, "disabled_by_request");
});

test("retrieveMemoryCandidates merges vector hits as a distinct retrieval source", () => {
  const candidates = retrieveMemoryCandidates({
    corpus: semanticVectorCorpus,
    query: "who owns routing",
    limit: 2,
    queryPlan: planMemoryQuery("who owns routing"),
  });

  assert.equal(candidates[0]?.chunkId, "routing-shell");
  assert.ok(candidates[0]?.retrievalSources.includes("vector"));
  assert.ok(candidates[0]?.matchReasons.includes("source:hybrid"));
  assert.equal(candidates.retrieval.vector.available, true);
});

test("typed retrieval normalizes migrated legacy note metadata before ranking", () => {
  const migratedCorpus = indexMemoryCorpus({
    noteRegistry: [
      {
        id: "note-session-legacy",
        type: "repo-session",
        path: "vault/00 Repositories/playground/03 Sessions/2026-04-29 Typed RAG.md",
        title: "Typed RAG",
        status: "In Progress",
        created: "2026-04-29",
        updated: "2026-04-29",
        summary: "Session log for the typed RAG hardening pass.",
        tags: ["repo/playground"],
        keywords: ["typed rag", "hardening"],
        outbound_links: [],
        inbound_links: [],
        content_hash: "legacy-session-hash",
        mtime_ms: 1,
        owner: "agent",
        repo_slug: "playground",
      },
    ],
    chunkIndex: [
      {
        chunk_id: "legacy-session-summary",
        note_id: "note-session-legacy",
        source_path:
          "vault/00 Repositories/playground/03 Sessions/2026-04-29 Typed RAG.md § Summary",
        heading: "Summary",
        heading_level: 2,
        text: "Recent typed RAG hardening work covered doctor output and frontmatter remediation.",
        summary: "",
        tokens_estimated: 13,
        content_hash: "legacy-session-chunk",
      },
    ],
    graphIndex: {
      nodes: [],
      edges: [],
    },
  });

  const candidates = retrieveMemoryCandidates({
    corpus: migratedCorpus,
    query: "recent typed rag hardening handoff",
    limit: 3,
    queryPlan: planMemoryQuery("recent typed rag hardening handoff"),
  });

  assert.equal(candidates[0]?.chunkId, "legacy-session-summary");
  assert.equal(candidates[0]?.noteType, "session");
  assert.equal(candidates[0]?.status, "active");
  assert.ok(candidates[0].matchReasons.includes("plan-type:session"));
});

test("retrieveMemoryCandidates allows archived notes when the query asks for history", () => {
  const archiveAwareCorpus = indexMemoryCorpus({
    noteRegistry: [
      {
        id: "archived-spec",
        type: "spec",
        path: "vault/specs/archived-rag.md",
        title: "Archived RAG plan",
        status: "archived",
        created: "2026-04-01",
        updated: "2026-04-01",
        summary: "Archived plan for the previous RAG rebuild.",
        tags: ["rag"],
        keywords: ["rag", "history"],
        outbound_links: [],
        inbound_links: [],
        content_hash: "archived-spec-hash",
        mtime_ms: 1,
        owner: "agent",
        repo_slug: "playground",
      },
    ],
    chunkIndex: [
      {
        chunk_id: "archived-spec-history",
        note_id: "archived-spec",
        source_path: "vault/specs/archived-rag.md § History",
        heading: "History",
        heading_level: 2,
        text: "Historical archived RAG rebuild plan for the previous migration.",
        summary: "Archived RAG rebuild history.",
        tokens_estimated: 11,
        content_hash: "archived-spec-history-chunk",
        type: "spec",
        status: "archived",
      },
    ],
    graphIndex: {
      nodes: [],
      edges: [],
    },
  });

  const candidates = retrieveMemoryCandidates({
    corpus: archiveAwareCorpus,
    query: "archived rag rebuild history",
    limit: 2,
    queryPlan: planMemoryQuery("archived rag rebuild history"),
  });

  assert.equal(candidates[0]?.chunkId, "archived-spec-history");
  assert.ok(candidates[0]?.matchReasons.includes("route:archive"));
});

test("typed retrieval prefers healthy notes over warning-scoped matches when relevance is similar", () => {
  const integrityAwareCorpus = indexMemoryCorpus({
    noteRegistry: [
      {
        id: "healthy-spec",
        type: "spec",
        path: "vault/specs/healthy.md",
        title: "Healthy typed RAG plan",
        status: "active",
        created: "2026-04-29",
        updated: "2026-04-29",
        summary: "Healthy spec for typed RAG ranking.",
        tags: ["rag"],
        keywords: ["typed", "rag", "ranking"],
        outbound_links: [],
        inbound_links: [],
        content_hash: "healthy-hash",
        mtime_ms: 1,
        owner: "agent",
        repo_slug: "playground",
        validation_status: "ok",
        validation_issues: [],
      },
      {
        id: "warning-spec",
        type: "spec",
        path: "vault/specs/warning.md",
        title: "Warning typed RAG plan",
        status: "active",
        created: "2026-04-29",
        updated: "2026-04-29",
        summary: "Warning spec for typed RAG ranking.",
        tags: ["rag"],
        keywords: ["typed", "rag", "ranking"],
        outbound_links: [],
        inbound_links: [],
        content_hash: "warning-hash",
        mtime_ms: 1,
        owner: "agent",
        repo_slug: "playground",
        validation_status: "warning",
        validation_issues: ["missing_summary"],
      },
    ],
    chunkIndex: [
      {
        chunk_id: "chunk:healthy-spec:0000:aaaaaaaa",
        note_id: "healthy-spec",
        source_path: "vault/specs/healthy.md § Plan",
        heading: "Plan",
        heading_level: 2,
        text: "Typed RAG ranking plan for healthy retrieval behavior.",
        summary: "Typed RAG ranking plan.",
        tokens_estimated: 10,
        content_hash: "healthy-chunk",
        type: "spec",
        status: "active",
      },
      {
        chunk_id: "chunk:warning-spec:0000:bbbbbbbb",
        note_id: "warning-spec",
        source_path: "vault/specs/warning.md § Plan",
        heading: "Plan",
        heading_level: 2,
        text: "Typed RAG ranking plan for warning retrieval behavior.",
        summary: "Typed RAG ranking plan.",
        tokens_estimated: 10,
        content_hash: "warning-chunk",
        type: "spec",
        status: "active",
      },
    ],
    graphIndex: {
      nodes: [],
      edges: [],
    },
  });

  const candidates = retrieveMemoryCandidates({
    corpus: integrityAwareCorpus,
    query: "typed rag ranking plan",
    limit: 2,
    queryPlan: planMemoryQuery("typed rag ranking plan"),
  });

  assert.equal(candidates[0]?.noteId, "healthy-spec");
  assert.equal(candidates[0]?.validationStatus, "ok");
  assert.deepEqual(candidates[0]?.validationIssues, []);
  assert.equal(candidates[1]?.validationStatus, "warning");
  assert.deepEqual(candidates[1]?.validationIssues, ["missing_summary"]);
  assert.ok(
    candidates[1]?.matchReasons.includes("integrity:warning"),
  );
});

test("typed retrieval can exclude warning-scoped notes explicitly", () => {
  const integrityAwareCorpus = indexMemoryCorpus({
    noteRegistry: [
      {
        id: "healthy-spec",
        type: "spec",
        path: "vault/specs/healthy.md",
        title: "Healthy typed RAG plan",
        status: "active",
        created: "2026-04-29",
        updated: "2026-04-29",
        summary: "Healthy spec for typed RAG ranking.",
        tags: ["rag"],
        keywords: ["typed", "rag", "ranking"],
        outbound_links: [],
        inbound_links: [],
        content_hash: "healthy-hash",
        mtime_ms: 1,
        owner: "agent",
        repo_slug: "playground",
        validation_status: "ok",
        validation_issues: [],
      },
      {
        id: "warning-spec",
        type: "spec",
        path: "vault/specs/warning.md",
        title: "Warning typed RAG plan",
        status: "active",
        created: "2026-04-29",
        updated: "2026-04-29",
        summary: "Warning spec for typed RAG ranking.",
        tags: ["rag"],
        keywords: ["typed", "rag", "ranking"],
        outbound_links: [],
        inbound_links: [],
        content_hash: "warning-hash",
        mtime_ms: 1,
        owner: "agent",
        repo_slug: "playground",
        validation_status: "warning",
        validation_issues: ["missing_summary"],
      },
    ],
    chunkIndex: [
      {
        chunk_id: "chunk:healthy-spec:0000:aaaaaaaa",
        note_id: "healthy-spec",
        source_path: "vault/specs/healthy.md § Plan",
        heading: "Plan",
        heading_level: 2,
        text: "Typed RAG ranking plan for healthy retrieval behavior.",
        summary: "Typed RAG ranking plan.",
        tokens_estimated: 10,
        content_hash: "healthy-chunk",
        type: "spec",
        status: "active",
      },
      {
        chunk_id: "chunk:warning-spec:0000:bbbbbbbb",
        note_id: "warning-spec",
        source_path: "vault/specs/warning.md § Plan",
        heading: "Plan",
        heading_level: 2,
        text: "Typed RAG ranking plan for warning retrieval behavior.",
        summary: "Typed RAG ranking plan.",
        tokens_estimated: 10,
        content_hash: "warning-chunk",
        type: "spec",
        status: "active",
      },
    ],
    graphIndex: {
      nodes: [],
      edges: [],
    },
  });

  const candidates = retrieveMemoryCandidates({
    corpus: integrityAwareCorpus,
    query: "typed rag ranking plan",
    limit: 2,
    integrityMode: "exclude-warning",
    queryPlan: planMemoryQuery("typed rag ranking plan"),
  });

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0]?.noteId, "healthy-spec");
});

test("typed retrieval can prefer warning-scoped notes explicitly", () => {
  const integrityAwareCorpus = indexMemoryCorpus({
    noteRegistry: [
      {
        id: "healthy-spec",
        type: "spec",
        path: "vault/specs/healthy.md",
        title: "Healthy typed RAG plan",
        status: "active",
        created: "2026-04-29",
        updated: "2026-04-29",
        summary: "Healthy spec for typed RAG ranking.",
        tags: ["rag"],
        keywords: ["typed", "rag", "ranking"],
        outbound_links: [],
        inbound_links: [],
        content_hash: "healthy-hash",
        mtime_ms: 1,
        owner: "agent",
        repo_slug: "playground",
        validation_status: "ok",
        validation_issues: [],
      },
      {
        id: "warning-spec",
        type: "spec",
        path: "vault/specs/warning.md",
        title: "Warning typed RAG plan",
        status: "active",
        created: "2026-04-29",
        updated: "2026-04-29",
        summary: "Warning spec for typed RAG ranking.",
        tags: ["rag"],
        keywords: ["typed", "rag", "ranking"],
        outbound_links: [],
        inbound_links: [],
        content_hash: "warning-hash",
        mtime_ms: 1,
        owner: "agent",
        repo_slug: "playground",
        validation_status: "warning",
        validation_issues: ["missing_summary"],
      },
    ],
    chunkIndex: [
      {
        chunk_id: "chunk:healthy-spec:0000:aaaaaaaa",
        note_id: "healthy-spec",
        source_path: "vault/specs/healthy.md § Plan",
        heading: "Plan",
        heading_level: 2,
        text: "Typed RAG ranking plan for healthy retrieval behavior.",
        summary: "Typed RAG ranking plan.",
        tokens_estimated: 10,
        content_hash: "healthy-chunk",
        type: "spec",
        status: "active",
      },
      {
        chunk_id: "chunk:warning-spec:0000:bbbbbbbb",
        note_id: "warning-spec",
        source_path: "vault/specs/warning.md § Plan",
        heading: "Plan",
        heading_level: 2,
        text: "Typed RAG ranking plan for warning retrieval behavior.",
        summary: "Typed RAG ranking plan.",
        tokens_estimated: 10,
        content_hash: "warning-chunk",
        type: "spec",
        status: "active",
      },
    ],
    graphIndex: {
      nodes: [],
      edges: [],
    },
  });

  const candidates = retrieveMemoryCandidates({
    corpus: integrityAwareCorpus,
    query: "typed rag ranking plan",
    limit: 2,
    integrityMode: "prefer-warning",
    queryPlan: planMemoryQuery("typed rag ranking plan"),
  });

  assert.equal(candidates[0]?.noteId, "warning-spec");
  assert.ok(candidates[0]?.matchReasons.includes("integrity:prefer-warning"));
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

test("assembleMemoryContext does not exceed token budget when first candidate is oversized", () => {
  const context = assembleMemoryContext({
    query: "typed RAG memory",
    tokenBudget: 5,
    candidates: [
      {
        noteId: "note-spec",
        chunkId: "oversized-chunk",
        sourceFile: "vault/specs/rag-rebuild.md",
        sourcePath: "vault/specs/rag-rebuild.md § Oversized",
        heading: "Oversized",
        noteType: "spec",
        status: "active",
        score: 10,
        matchReasons: ["plan-type:spec"],
        text: "x".repeat(80),
      },
    ],
  });

  assert.equal(context.selectedCount, 0);
  assert.equal(context.estimatedTokens, 0);
  assert.equal(context.omitted.length, 1);
  assert.equal(context.omitted[0].reason, "token_budget");
  assert.equal(context.truncated, true);
});

test("assembleMemoryContext carries integrity metadata into items and references", () => {
  const context = assembleMemoryContext({
    query: "typed rag ranking plan",
    tokenBudget: 200,
    candidates: [
      {
        noteId: "warning-spec",
        chunkId: "chunk:warning-spec:0000:bbbbbbbb",
        sourceFile: "vault/specs/warning.md",
        sourcePath: "vault/specs/warning.md § Plan",
        heading: "Plan",
        noteType: "spec",
        status: "active",
        validationStatus: "warning",
        validationIssues: ["missing_summary"],
        score: 8,
        matchReasons: ["plan-type:spec", "integrity:warning"],
        text: "Typed RAG ranking plan for warning retrieval behavior.",
      },
    ],
  });

  assert.equal(context.items[0].validationStatus, "warning");
  assert.deepEqual(context.items[0].validationIssues, ["missing_summary"]);
  assert.equal(context.references[0].validationStatus, "warning");
  assert.deepEqual(context.references[0].validationIssues, ["missing_summary"]);
});
