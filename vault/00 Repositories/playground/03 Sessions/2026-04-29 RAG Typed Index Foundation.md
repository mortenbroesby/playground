---
type: repo-session
repo: playground
date: 2026-04-29
started_at: 2026-04-29 21:05
branch: feat/rag-refactor
summary: Started the RAG refactor by rebuilding `rag:index` around a typed multi-index output, added legacy taxonomy normalization and compatibility corpus generation, and covered the new index contract with focused tests.
keywords:
  - rag
  - obsidian-memory
  - typed-index
  - memory
  - graph-index
touched_paths:
  - tools/obsidian-memory/src/rag-index.ts
  - tools/obsidian-memory/tests/rag-index.test.mjs
  - tools/obsidian-memory/package.json
  - package.json
  - vault/00 Repositories/playground/03 Sessions/2026-04-29 RAG Typed Index Foundation.md
tags:
  - type/session
  - repo/playground
---

# RAG Typed Index Foundation

## Summary

Started `.specs/rag-refactor.md` with the lowest-risk migration slice:
rebuild index generation first while keeping the current query path working.

## What Changed

- rewrote `tools/obsidian-memory/src/rag-index.ts` to emit the new generated
  index family:
  - `manifest.json`
  - `note-registry.json`
  - `chunk-index.json`
  - `lexical-index.json`
  - `vector-index.json` placeholder
  - `graph-index.json`
  - `diagnostics.json`
  - `cleanup-report.json`
- kept `obsidian-vault.corpus.json` and `obsidian-vault.manifest.json` as
  compatibility outputs so `rag:query`, verification, and MCP callers still
  have the current retrieval input during migration
- added compatibility normalization for current repo note types:
  - `repo` -> `repo-home`
  - `repo-architecture` and `repo-decision` -> `architecture-record`
  - `repo-session` and `session-note` -> `session`
  - `repo-task` and `repo-tasks` -> `todo`
- normalized older status values like `In Progress`, `Ready`, and `Backlog`
  into the new status model
- extended the frontmatter parser to handle nested maps and lists needed by the
  target `links` and `retention` schema
- added `rag:test` and a new fixture-driven index test covering typed output,
  graph edges, unresolved-link diagnostics, and backward-compatible corpus
  generation

## Verification

- `pnpm --filter @playground/obsidian-memory rag:test`
- `pnpm --filter @playground/obsidian-memory rag:index --json`

## Next Step

Move retrieval off the legacy corpus and onto the new registry/chunk/graph
indexes, starting with query planning and type/status-aware ranking.
