---
type: repo-session
repo: playground
date: 2026-04-21
started_at: 2026-04-21 23:05
branch: main
summary: Replaced the primary `ai-context-engine` parser path with Oxc, retained Tree-sitter only as a parser-facade fallback, and updated the small benchmark to report backend and fallback metadata.
keywords:
  - ai-context-engine
  - oxc
  - parser
  - tree-sitter
  - benchmark
touched_paths:
  - packages/ai-context-engine/package.json
  - packages/ai-context-engine/src/parser.ts
  - packages/ai-context-engine/scripts/benchmark-small.mjs
  - pnpm-lock.yaml
tags:
  - type/session
  - repo/playground
---

# AI Context Engine Oxc Parser Migration

## Summary

Moved `@playground/ai-context-engine` to an Oxc-first parser path for JS/TS
files. Tree-sitter remains only as a bounded fallback behind `src/parser.ts`
when Oxc throws, which keeps the migration rail explicit instead of leaking a
second parser model across the package.

The small benchmark now records which backend parsed each file and whether a
fallback was used, so the migration can be measured rather than asserted.

## What Changed

- added `oxc-parser` as the primary parse backend dependency
- kept Tree-sitter in place only for parser-facade fallback behavior
- extended `ParsedFile` with `backend`, `fallbackUsed`, and `fallbackReason`
- implemented Oxc-based symbol and import extraction for the current engine
  surfaces
- preserved the existing Tree-sitter chunking fallback for parse failures
- updated `bench:small` to report parser backend and fallback metadata

## Verification

- `pnpm --filter @playground/ai-context-engine type-check`
- `pnpm --filter @playground/ai-context-engine test -- --run tests/engine-behavior.test.ts tests/interface.test.ts`
- `pnpm --filter @playground/ai-context-engine bench:small`

## Benchmark Highlights

- `src/storage.ts`: `29.5 ms` median parse time, `65` symbols, `8` imports,
  backend `oxc`, no fallback
- `searchSymbols`: `58.8 ms`, `88.4%` token savings vs raw baseline
- `getSymbolSource` batch: `41.8 ms`, `81.4%` token savings
- `getRankedContext`: `90.5 ms`, `86.1%` token savings
- `diagnosticsFromSubdir`: `796.9 ms`

## Notes

This slice is parser-first, not full parser-plus-resolver migration. The engine
now proves that Oxc can carry the primary indexing path, but module resolution
and any eventual Tree-sitter removal still belong to later slices.
