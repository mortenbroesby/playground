---
id: "mem-20260430-rag-registry-chunk-ids"
type: "session"
repo_slug: "playground"
title: "RAG Registry Chunk IDs"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Added deterministic chunk_ids to note-registry output so each typed note row records its generated chunk traceability without changing retrieval or graph behavior."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "rag:index"
  - "note-registry"
  - "chunk-index"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-rag-index-validation-hardening"
    - "mem-20260430-rag-unresolved-link-enforcement"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-14"
  expires_after: "2026-10-27"
  keep: false
branch: "feat/agent-facing-rag-rebuild-foundation"
touched_paths:
  - "tools/obsidian-memory/src/rag-index.ts"
  - "tools/obsidian-memory/tests/rag-index.test.mjs"
---

## Goal

Finish the missing note-to-chunk traceability in the generated registry without
expanding the policy surface beyond data already produced by `rag:index`.

## Actions taken

- added a red assertion that `note-registry.json` rows expose deterministic
  `chunk_ids`
- populated each registry note with the ordered list of generated chunk IDs for
  that note
- kept the value derived from the existing chunk projection so chunk ordering
  stays stable and no retrieval path changes

## Tests run

- `node --test ./tools/obsidian-memory/tests/rag-index.test.mjs`
- `pnpm --filter @playground/obsidian-memory test:retrieval`

## Findings

- this slice is purely registry assembly plumbing; it does not need changes to
  chunk generation, graph construction, or diagnostics
- deriving `chunk_ids` from `chunkIndex` keeps the registry aligned with the
  final emitted artifact rather than a parallel pre-output structure

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next thin slice should likely add a validation-status field or extract
registry assembly into a dedicated builder so `rag:index` and `rag:doctor` can
share one integrity surface.
