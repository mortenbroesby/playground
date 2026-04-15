# AI Context Engine Pivot Spec

## Summary

Pivot the abandoned `@playground/code-intel` slice into the canonical
`@playground/ai-context-engine` package and follow
[`/.specs/ai-code-context-engine-spec.md`](../../../.specs/ai-code-context-engine-spec.md)
as the source spec.

## Why The Pivot Happened

- `code-intel` was a weaker product name than the spec's "AI context engine"
- the prior slice mixed planning with implementation assumptions that no longer
  matched the authored spec
- the implementation files were intentionally removed, so this is a clean
  restart point rather than an incremental refactor

## Current Phase 1 Contract

- package name: `@playground/ai-context-engine`
- package path: `packages/ai-context-engine`
- repo-local storage root: `.ai-context-engine/`
- storage backend target: SQLite with WAL mode
- language scope: `ts`, `tsx`, `js`, `jsx`
- required Phase 1 tools:
  - `init`
  - `index_folder`
  - `index_file`
  - `get_repo_outline`
  - `get_file_tree`
  - `get_file_outline`
  - `suggest_initial_queries`
  - `search_symbols`
  - `search_text`
  - `get_file_content`
  - `get_symbol_source`
  - `diagnostics`

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
- Tree-sitter TypeScript-family parsing
- `index_folder` and `index_file`
- discovery queries:
  - `get_repo_outline`
  - `get_file_tree`
  - `get_file_outline`
  - `suggest_initial_queries`
- exact retrieval and diagnostics:
  - `search_symbols`
  - `search_text`
  - `get_file_content`
  - `get_symbol_source`
  - `diagnostics`
- fixture-backed tests proving indexing, search, and exact source retrieval

## Next Build Slice

1. tighten symbol summaries and ranking quality
2. add stale metadata and richer freshness reporting
3. add bounded context bundles and ranked context assembly
4. add watch mode and changed-file fast paths
5. add CLI and MCP surfaces on top of the library core
