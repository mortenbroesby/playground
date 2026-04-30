---
id: "mem-20260430-registry-driven-diagnostics"
type: "session"
repo_slug: "playground"
title: "Registry Driven Diagnostics"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Moved rag:index diagnostics projection onto note-registry-derived integrity data so synthetic IDs, normalization reports, and validation warnings come from the same canonical note surface."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "diagnostics"
  - "note-registry"
  - "integrity"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-doctor-registry-integrity-adoption"
    - "mem-20260430-note-registry-builder-extraction"
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

Make note-registry integrity the canonical source for generated diagnostics
instead of recomputing note-level warnings from raw indexed notes.

## Actions taken

- added a diagnostics builder in `note-registry.mjs`
- switched `rag:index` to derive synthetic IDs, normalization reports, and
  validation warnings from emitted registry rows plus unresolved-link output
- added focused module coverage for diagnostics projection from registry data
- removed the old inline diagnostics derivation path from `rag-index.ts`

## Tests run

- `node --test ./tools/obsidian-memory/tests/note-registry.test.mjs ./tools/obsidian-memory/tests/rag-index.test.mjs`
- `pnpm --filter @playground/obsidian-memory test:retrieval`

## Findings

- the remaining note-level integrity duplication in `rag:index` was small but
  real; moving it into the registry module makes doctor, diagnostics, and
  registry rows agree by construction
- diagnostics fallback in governance still remains useful for older generated
  artifacts, but fresh index output now has one canonical note-integrity source

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next thin slice should probably tighten retrieval fixtures or MCP/query
surfaces around the richer typed registry fields, since the indexing and
governance integrity path is now substantially unified.
