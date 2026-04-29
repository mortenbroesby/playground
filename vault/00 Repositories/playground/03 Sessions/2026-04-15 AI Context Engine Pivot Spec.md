---
id: "mem-20260415-ai-context-engine-pivot-spec"
type: "session"
repo_slug: "playground"
title: "AI Context Engine Pivot Spec"
status: archived
created: "2026-04-15"
updated: "2026-04-29"
owner: "agent"
summary: "Pivot the abandoned `@playground/code-intel` slice into the canonical `@playground/ai-context-engine` package and follow [`/.specs/ai-code-context-engine-spec.md`](../../../.specs/ai-code-context-engine-spec.md) as the source spec."
tags: []
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-04-29"
  expires_after: "2026-10-12"
  keep: false
---

## Summary

Pivot the abandoned `@playground/code-intel` slice into the canonical
`@playground/ai-context-engine` package and follow
[`/.specs/ai-code-context-engine-spec.md`](../../../.specs/ai-code-context-engine-spec.md)
as the source spec.

## Why The Pivot Happened

- `code-intel` was the weaker name and contract.
- The prior slice mixed planning and implementation assumptions.
- The implementation files were intentionally removed, so this was a clean restart.

## Current Phase 1 Contract

- package name: `@playground/ai-context-engine`
- package path: `packages/ai-context-engine`
- repo-local storage root: `.ai-context-engine/`
- storage backend target: SQLite with WAL mode
- language scope: `ts`, `tsx`, `js`, `jsx`
- required Phase 1 tools: init, indexing, repo/file outline discovery, symbol
  and text search, exact source retrieval, and diagnostics

## Non-goals For This Slice

- full parser/index/retrieval implementation in one shot
- semantic search
- mandatory summarization
- watch mode before the storage and retrieval contract is stable

## Verification For The Pivot

- `pnpm --filter @playground/ai-context-engine test`
- `pnpm --filter @playground/ai-context-engine type-check`
- `pnpm lint:md`

## Implemented In This Slice

- SQLite schema and repo-local path bootstrap
- TypeScript-family parsing plus file and folder indexing
- Discovery queries, exact retrieval, and diagnostics
- Fixture-backed tests proving indexing, search, and exact source retrieval

## Next Build Slice

- tighten symbol summaries and ranking quality
- add stale metadata and richer freshness reporting
- add bounded context bundles, watch mode, and user-facing CLI/MCP surfaces
