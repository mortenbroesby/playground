---
type: repo-session
repo: playground
date: 2026-04-27
started_at: 2026-04-27 17:00
branch: astrograph-ai-engine-refactor
summary: Landed the first Phase 6 `.specs/performance-deps.md` slice in `tools/ai-context-engine`: optional Piscina-backed file analysis during folder indexing with main-thread persistence unchanged.
keywords:
  - ai-context-engine
  - astrograph
  - piscina
  - worker pool
  - indexing
  - performance
  - parsing
  - tests
touched_paths:
  - tools/ai-context-engine/package.json
  - tools/ai-context-engine/README.md
  - tools/ai-context-engine/src/config.ts
  - tools/ai-context-engine/src/file-analysis.ts
  - tools/ai-context-engine/src/storage.ts
  - tools/ai-context-engine/src/types.ts
  - tools/ai-context-engine/src/workers/analyze-file-worker.ts
  - tools/ai-context-engine/tests/engine-behavior.test.ts
  - tools/ai-context-engine/tests/engine-contract.test.ts
  - pnpm-lock.yaml
tags:
  - type/session
  - repo/playground
---

# AI Context Engine Piscina Worker Pool

## Summary

This session lands the first thin Phase 6 worker-pool slice from
`.specs/performance-deps.md`.

Astrograph can now optionally offload CPU-heavy parse and hash analysis for
folder indexing to a Piscina worker pool, while keeping file reads and all
SQLite writes in the main thread. The goal was to prove equivalent indexed data
without broadening the architecture more than necessary.

## What Changed

- added `piscina` as a runtime dependency for `tools/ai-context-engine`
- introduced `src/file-analysis.ts` as the shared parse/hash analysis module
- added `src/workers/analyze-file-worker.ts` as the Piscina worker entrypoint
- added a dedicated worker build step so the dist/runtime path includes the
  worker module
- extended repo config with:
  - `performance.workerPool.enabled`
  - `performance.workerPool.maxWorkers`
- routed `indexFolderDirect()` analysis tasks through Piscina only when that
  config is enabled
- kept `index-file` on the direct non-worker path for now
- preserved single-writer SQLite persistence in the main process
- added contract coverage for worker-pool config loading and normalization
- added behavior coverage proving worker and non-worker modes produce equivalent
  index output

## Verification

- `pnpm --filter @astrograph/astrograph type-check`
- `pnpm --filter @astrograph/astrograph test -- tests/engine-contract.test.ts`
- `pnpm exec vitest run tests/engine-behavior.test.ts -t "produces equivalent index output with and without the worker pool enabled|produces deterministic index output across file processing concurrency settings"`
- `pnpm --filter @astrograph/astrograph build:workers`
