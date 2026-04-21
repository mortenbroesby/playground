---
type: repo-session
repo: playground
date: 2026-04-21
started_at: 2026-04-21 23:49
branch: main
summary: Added an optional Hyperfine-backed CLI benchmark wrapper for `ai-context-engine` so command-level timing can be measured separately from the in-process benchmark harness.
keywords:
  - ai-context-engine
  - hyperfine
  - cli
  - benchmark
  - performance
touched_paths:
  - packages/ai-context-engine/package.json
  - packages/ai-context-engine/scripts/benchmark-cli.mjs
  - packages/ai-context-engine/README.md
tags:
  - type/session
  - repo/playground
---

# AI Context Engine Hyperfine CLI Benchmark Wrapper

## Summary

Added `bench:cli` as an optional Hyperfine-backed benchmark path for the
`ai-context-engine` CLI. This complements the in-process `bench:small` harness
instead of replacing it.

The wrapper prepares a clean repo copy, indexes it once, seeds symbol ids for
exact-source retrieval, and then delegates command timing to Hyperfine.

## What Changed

- added `pnpm --filter @playground/ai-context-engine bench:cli`
- added `scripts/benchmark-cli.mjs` to orchestrate CLI benchmarks through
  Hyperfine
- benchmarked commands include:
  - metadata diagnostics
  - scanned diagnostics
  - symbol search
  - symbol source retrieval
  - ranked context assembly
- made the missing-Hyperfine case fail clearly with an install hint
- documented the new benchmark path in the package README

## Verification

- `pnpm --filter @playground/ai-context-engine type-check`
- `pnpm --filter @playground/ai-context-engine bench:cli`

## Notes

On this machine, `bench:cli` currently verifies the missing-binary error path:
`hyperfine` was not already installed, and Homebrew attempted a much heavier
dependency chain than expected. The wrapper itself is ready, but real CLI
timings still depend on a successful local Hyperfine install.
