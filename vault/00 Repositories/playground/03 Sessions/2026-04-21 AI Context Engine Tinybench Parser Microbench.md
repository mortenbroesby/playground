---
type: repo-session
repo: playground
date: 2026-04-21
started_at: 2026-04-21 23:41
branch: main
summary: Switched the `ai-context-engine` parser microbenchmark to Tinybench while preserving the existing product-specific benchmark outputs for token savings and retrieval behavior.
keywords:
  - ai-context-engine
  - benchmark
  - tinybench
  - parser
  - performance
touched_paths:
  - packages/ai-context-engine/package.json
  - packages/ai-context-engine/scripts/benchmark-small.mjs
  - pnpm-lock.yaml
tags:
  - type/session
  - repo/playground
---

# AI Context Engine Tinybench Parser Microbench

## Summary

Replaced the hand-rolled parser timing loop in `bench:small` with Tinybench.
The benchmark still reports `ai-context-engine` specific outcomes like symbol
counts, token savings, parser backend, and fallback metadata, but the parser
microbench now uses a real statistics-aware timing library.

## What Changed

- added `tinybench` as a dev dependency for `@playground/ai-context-engine`
- switched parser target timing in `benchmark-small.mjs` to Tinybench
- kept the existing custom benchmark output shape and token-savings reporting
- added parse-benchmark fields for `benchmarkTool`, sample count, mean, median,
  min, max, and relative margin of error

## Verification

- `pnpm --filter @playground/ai-context-engine type-check`
- `pnpm --filter @playground/ai-context-engine bench:small -- --runs 10`

## Benchmark Highlights

- `src/types.ts`: Tinybench median `2.2 ms`, `10` samples
- `src/storage.ts`: Tinybench median `14.6 ms`, `10` samples
- parser results still report backend `oxc` and no fallback on the benchmark targets

## Notes

This is a tooling improvement rather than a product-behavior change. The
stateful index and retrieval timings are still measured by the existing custom
harness because they also need to report product-level outputs, not only raw
latency.
