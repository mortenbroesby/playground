---
id: "mem-20260430-adr-chunk-id-format"
type: "session"
repo_slug: "playground"
title: "ADR Chunk ID Format"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Changed rag:index chunk IDs to the ADR-style deterministic format using note ID, chunk order, and content-hash prefix instead of the old opaque short hash."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "chunk-id"
  - "traceability"
  - "rag:index"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-rag-registry-chunk-ids"
    - "mem-20260430-note-registry-builder-extraction"
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
  - "tools/obsidian-memory/tests/note-registry.test.mjs"
---

## Goal

Align generated chunk IDs with the ADR so traceability is readable and stable
across one index generation.

## Actions taken

- changed chunk ID generation to `chunk:${note_id}:${chunk_index}:${content_hash_prefix}`
- derived the hash prefix from the final emitted chunk text so IDs track actual
  retrieval content
- threaded chunk order into `createChunk()` so IDs are deterministic by note and
  section position
- added assertions that generated registry chunk IDs match the ADR-style format

## Tests run

- `node --test ./tools/obsidian-memory/tests/rag-index.test.mjs`
- `pnpm --filter @playground/obsidian-memory test:retrieval`

## Findings

- keeping the content-hash prefix tied to final chunk text means metadata edits
  that affect retrieval also visibly change the chunk ID
- the note-registry traceability slice did not need structural changes beyond
  chunk generation because registry rows already consume emitted chunk IDs

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next thin slice should likely reduce remaining duplicate note-integrity
derivation between diagnostics emission and governance helpers, or teach
retrieval fixtures to assert against the new chunk ID format where useful.
