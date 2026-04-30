---
id: "mem-20260430-note-registry-builder-extraction"
type: "session"
repo_slug: "playground"
title: "Note Registry Builder Extraction"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Extracted note-registry assembly, graph construction, and note-level validation projection into a shared builder module so rag:index consumes one reusable integrity surface."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "note-registry"
  - "builder"
  - "refactor"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-rag-registry-validation-status"
    - "mem-20260430-rag-registry-chunk-ids"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-14"
  expires_after: "2026-10-27"
  keep: false
branch: "feat/agent-facing-rag-rebuild-foundation"
touched_paths:
  - "tools/obsidian-memory/src/note-registry.mjs"
  - "tools/obsidian-memory/src/rag-index.ts"
  - "tools/obsidian-memory/tests/note-registry.test.mjs"
---

## Goal

Move note-registry assembly behind a real module boundary so index generation
and later governance work can consume one deterministic registry builder.

## Actions taken

- extracted registry row assembly, inbound-link computation, graph edge
  generation, unresolved-link collection, and validation projection into
  `note-registry.mjs`
- switched `rag:index` to call the shared builder instead of assembling the
  registry inline
- added focused module tests for successful registry assembly and duplicate ID
  failure
- removed the now-dead inline registry builder path from `rag-index.ts`

## Tests run

- `node --test ./tools/obsidian-memory/tests/note-registry.test.mjs ./tools/obsidian-memory/tests/rag-index.test.mjs`
- `pnpm --filter @playground/obsidian-memory test:retrieval`

## Findings

- the current extraction boundary is already enough for future `rag:doctor`
  reuse because it returns note registry rows, graph edges, and unresolved-link
  diagnostics together
- keeping the allow/fail policy for unresolved links outside the builder keeps
  the module reusable for both strict indexing and advisory governance flows

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next thin slice should be teaching `rag:doctor` to consume the shared
builder or shared note-level integrity output instead of depending purely on the
serialized artifacts after index generation.
