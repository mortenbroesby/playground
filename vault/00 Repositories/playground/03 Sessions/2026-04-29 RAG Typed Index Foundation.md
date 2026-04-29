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
  - tools/obsidian-memory/src/obsidian-rag.mjs
  - tools/obsidian-memory/src/rag-governance.mjs
  - tools/obsidian-memory/src/rag-classify.mjs
  - tools/obsidian-memory/src/rag-clean.mjs
  - tools/obsidian-memory/src/rag-doctor.mjs
  - tools/obsidian-memory/src/rag-query.mjs
  - tools/obsidian-memory/src/rag-mcp-server.mjs
  - tools/obsidian-memory/src/verify-obsidian-rag.mjs
  - tools/obsidian-memory/tests/obsidian-rag.test.mjs
  - tools/obsidian-memory/tests/rag-governance.test.mjs
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
- moved retrieval off `obsidian-vault.corpus.json` and onto the typed
  `note-registry.json`, `chunk-index.json`, and `graph-index.json` outputs
- added a lightweight query planner with expected note types and default
  negative status filters
- updated ranking to combine lexical scoring with type boosts, status boosts,
  selective recency boosts, exact lookup boosts, graph-aware expansion, and a
  small duplicate-note penalty
- rewired `rag:query` and the MCP memory server to load the typed `.rag/`
  index root directly while preserving the existing command and tool surfaces
- added `rag:classify` with a first rule-based request classifier for decisions,
  specs, todos, investigations, glossary-style questions, and cleanup flows
- added a shared governance module for typed index verification, cleanup
  analysis, and command-level policy reuse
- added `rag:clean --dry-run` and `rag:doctor`
- tightened `rag:verify` so it now validates the typed index contract with a
  typed fixture vault instead of the old corpus-only path
- confirmed the real repo still fails `rag:doctor` because most vault notes have
  synthetic IDs and sparse links, which is the expected migration backlog from
  the stricter schema

## Verification

- `pnpm --filter @playground/obsidian-memory rag:test`
- `pnpm --filter @playground/obsidian-memory rag:index --json`
- `pnpm --filter @playground/obsidian-memory rag:query --query 'What should we build for typed RAG memory?' --limit 3 --budget 300`
- `pnpm --filter @playground/obsidian-memory rag:classify --input 'We decided to use hybrid retrieval'`
- `pnpm --filter @playground/obsidian-memory rag:clean --dry-run`
- `pnpm --filter @playground/obsidian-memory rag:doctor`
- `pnpm --filter @playground/obsidian-memory rag:verify`

## Next Step

Start shrinking the migration backlog that `rag:doctor` now surfaces:
introduce stricter frontmatter remediation, link backfills, and eventually
`rag:write` so new notes stop adding to the legacy debt.
