# AI Context Benchmark Runner MVP

## Summary

Turn `@playground/ai-context-engine-bench` from a scaffold into a runnable
benchmark MVP with a CLI, a runner, fixed workflow adapters, and artifact
generation.

## Implemented

- added benchmark runner orchestration
- added fixed workflow adapters over `@playground/ai-context-engine`
- added a simple token estimator for benchmark accounting
- upgraded the benchmark CLI to execute a run instead of only printing scaffold
  metadata
- added runner coverage proving a filtered task can write `results.json` and
  `report.md`

## Current Limitation

- token accounting currently uses a simple local approximation rather than the
  benchmark spec's intended `tiktoken cl100k_base`
- this makes the harness runnable for iteration, but not yet comparable to the
  final benchmark-policy target

## Verification

- `pnpm --filter @playground/ai-context-engine-bench test`
- `pnpm --filter @playground/ai-context-engine-bench type-check`
- `pnpm lint:md`
