---
type: repo-session
repo: playground
date: 2026-04-21
started_at: 2026-04-21 22:40
branch: main
summary: Added an in-process `ai-context-engine` benchmark harness with token-savings reporting, hardened the current large-file parser path with overlap-aware chunk ownership, and wrote the parser replacement spec targeting `oxc-parser` plus `oxc-resolver` with tightly bounded Tree-sitter fallback during migration.
keywords:
  - ai-context-engine
  - benchmark
  - parser
  - tree-sitter
  - oxc
  - token-savings
  - spec
touched_paths:
  - packages/ai-context-engine/package.json
  - packages/ai-context-engine/scripts/benchmark-small.mjs
  - packages/ai-context-engine/src/parser.ts
  - packages/ai-context-engine/tests/engine-behavior.test.ts
  - .specs/ai-context-engine-parser-replacement-spec.md
tags:
  - type/session
  - repo/playground
---

# AI Context Engine Parser Bench And Replacement Spec

## Summary

This session moved the parser work from vague discussion into measurable and
actionable shape.

Three things landed together:

- an in-process benchmark harness for `@playground/ai-context-engine`
- a safer large-file Tree-sitter workaround with chunk overlap ownership
- a concrete parser replacement spec that targets Oxc while allowing tightly
  bounded Tree-sitter fallback during migration

## What Changed

- added `bench:small` to the package and implemented
  `packages/ai-context-engine/scripts/benchmark-small.mjs`
- benchmark output now reports:
  - parser and library-surface latency
  - token-savings versus naive raw-source baselines
  - parser fallback hints
- upgraded the current Tree-sitter large-file workaround from simple chunking to
  overlap-aware chunk ownership so declarations spanning chunk boundaries are
  indexed once instead of being missed or duplicated
- added behavior coverage for:
  - large-file symbol extraction after single-pass parse failure
  - declaration indexing across chunk boundaries
- added `.specs/ai-context-engine-parser-replacement-spec.md` with:
  - `oxc-parser` + `oxc-resolver` as the primary recommendation
  - temporary Tree-sitter fallback only inside the parser facade
  - fallback telemetry requirements
  - stop conditions if the migration gets too spaghetti-sloppy
  - explicit definition of done

## Benchmark Signal

`pnpm --filter @playground/ai-context-engine bench:small` currently shows:

- `searchSymbols`: about `74ms` and about `87%` token savings
- `getSymbolSource` batch: about `103ms` and about `81%` token savings
- `getRankedContext`: about `92ms` and about `85%` token savings
- `diagnostics`: still the slow outlier at about `1.15s`
- `src/storage.ts`: no longer empty-fallback parses; it now extracts about
  `65` symbols and `8` imports in the benchmark path

## Why It Matters

The benchmark now gives the engine a comparison surface that is useful against
other retrieval tools, not just an internal timing toy. At the same time, the
replacement spec is now strict enough to guide implementation without quietly
turning into a permanent dual-parser system.

## Verification

- `pnpm --filter @playground/ai-context-engine type-check`
- `pnpm --filter @playground/ai-context-engine test -- --run tests/engine-behavior.test.ts`
- `pnpm --filter @playground/ai-context-engine bench:small`
