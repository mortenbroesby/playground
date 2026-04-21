import test from "node:test";
import assert from "node:assert/strict";

import {
  assembleMemoryContext,
  indexMemoryCorpus,
  retrieveMemoryCandidates,
} from "./obsidian-rag.mjs";

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
