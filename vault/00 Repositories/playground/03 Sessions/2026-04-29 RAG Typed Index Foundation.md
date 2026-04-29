---
id: "mem-20260429-rag-typed-index-foundation"
type: "session"
repo_slug: "playground"
title: "RAG Typed Index Foundation"
status: archived
created: "2026-04-29"
updated: "2026-04-29"
owner: "agent"
summary: "Started the RAG refactor by rebuilding `rag:index` around typed generated indexes, moving retrieval onto them, and adding governance plus migration commands for the vault."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "typed-index"
  - "memory"
  - "graph-index"
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-13"
  expires_after: "2026-10-26"
  keep: false
branch: "feat/rag-refactor"
started_at: "2026-04-29 21:05"
touched_paths:
  - "tools/obsidian-memory/src/rag-index.ts"
  - "tools/obsidian-memory/src/obsidian-rag.mjs"
  - "tools/obsidian-memory/src/rag-governance.mjs"
  - "tools/obsidian-memory/src/rag-classify.mjs"
  - "tools/obsidian-memory/src/rag-clean.mjs"
  - "tools/obsidian-memory/src/rag-doctor.mjs"
  - "tools/obsidian-memory/src/rag-write.mjs"
  - "tools/obsidian-memory/src/rag-query.mjs"
  - "tools/obsidian-memory/src/rag-mcp-server.mjs"
  - "tools/obsidian-memory/src/verify-obsidian-rag.mjs"
  - "tools/obsidian-memory/tests/obsidian-rag.test.mjs"
  - "tools/obsidian-memory/tests/rag-governance.test.mjs"
  - "tools/obsidian-memory/tests/rag-index.test.mjs"
  - "tools/obsidian-memory/package.json"
  - "package.json"
  - "vault/00 Repositories/playground/03 Sessions/2026-04-29 RAG Typed Index Foundation.md"
---

## Summary

Started `.specs/rag-refactor.md` with the lowest-risk migration slice:
rebuild index generation first while keeping the current query path working.

## What Changed

- rebuilt `rag:index` to emit typed generated indexes under `.rag/`, while
  keeping compatibility outputs during migration
- normalized legacy note types, statuses, and frontmatter into the stricter
  typed schema, including nested `links` and `retention` fields
- moved retrieval, ranking, `rag:query`, and the MCP server onto the typed
  index root instead of the old corpus-only path
- added governance and maintenance surfaces: `rag:test`, `rag:classify`,
  `rag:clean --dry-run`, `rag:doctor`, `rag:write`, and `rag:fix-frontmatter`
- added fixture and governance regression coverage for typed output, graph
  edges, link diagnostics, retrieval signals, and metadata preservation
- applied the first reviewed frontmatter-migration batches to legacy session
  notes so synthetic-ID debt started dropping in the real vault

## Verification

- `pnpm --filter @playground/obsidian-memory rag:test`
- `pnpm --filter @playground/obsidian-memory rag:index --json`
- `pnpm --filter @playground/obsidian-memory rag:doctor`
- `pnpm --filter @playground/obsidian-memory rag:verify`
- `pnpm --filter @playground/obsidian-memory rag:fix-frontmatter --path-prefix '03 Sessions' --limit 10 --apply`
- `pnpm markdown:check`

## Next Step

Keep shrinking the migration backlog with reviewed
`rag:fix-frontmatter --apply` batches and then add targeted link backfill so
retrieval improves without loosening the typed contract.
