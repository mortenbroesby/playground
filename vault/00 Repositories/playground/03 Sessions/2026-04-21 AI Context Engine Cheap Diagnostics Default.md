---
type: repo-session
repo: playground
date: 2026-04-21
started_at: 2026-04-21 23:27
branch: main
summary: Made `ai-context-engine` diagnostics cheap by default, added explicit live freshness scanning, and split the benchmark to show metadata vs scan cost.
keywords:
  - ai-context-engine
  - diagnostics
  - benchmark
  - freshness
  - cli
touched_paths:
  - packages/ai-context-engine/src/types.ts
  - packages/ai-context-engine/src/index.ts
  - packages/ai-context-engine/src/storage.ts
  - packages/ai-context-engine/src/cli.ts
  - packages/ai-context-engine/src/mcp.ts
  - packages/ai-context-engine/scripts/benchmark-small.mjs
  - packages/ai-context-engine/tests/engine-behavior.test.ts
  - packages/ai-context-engine/tests/interface.test.ts
  - packages/ai-context-engine/tests/mutation-smoke.cli.test.ts
  - packages/ai-context-engine/README.md
tags:
  - type/session
  - repo/playground
---

# AI Context Engine Cheap Diagnostics Default

## Summary

Changed diagnostics to use metadata by default instead of always walking and
hashing the repository. Callers that need live drift detection can now opt into
that slower path with `scanFreshness`.

This keeps diagnostics useful for agent health checks without paying the full
freshness-scan cost on every call.

## What Changed

- added `scanFreshness?: boolean` to the diagnostics input surface
- added `freshnessMode` and `freshnessScanned` to diagnostics output
- kept full repository drift comparison behind explicit scan mode
- wired the option through CLI and MCP
- updated the small benchmark to report both metadata diagnostics and scanned
  diagnostics
- updated tests and README for the new default behavior

## Verification

- `pnpm --filter @playground/ai-context-engine type-check`
- `pnpm --filter @playground/ai-context-engine test -- --run tests/engine-behavior.test.ts tests/interface.test.ts tests/mutation-smoke.cli.test.ts tests/mutation-smoke.watch.test.ts`
- `pnpm --filter @playground/ai-context-engine bench:small`

## Benchmark Highlights

- metadata diagnostics from subdir: `80.8 ms`
- live freshness scan diagnostics from subdir: `1246.7 ms`
- the benchmark now reports both modes explicitly instead of conflating them

## Notes

This slice improves agent-facing latency without removing live drift detection.
The remaining expensive background path is watch-mode polling, which still does
full snapshot comparison and is a separate optimization target.
