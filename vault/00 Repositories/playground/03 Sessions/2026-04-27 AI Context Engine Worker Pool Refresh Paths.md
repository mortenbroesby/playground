---
id: "mem-20260427-ai-context-engine-worker-pool-refresh-paths"
type: "session"
repo_slug: "playground"
title: "AI Context Engine Worker Pool Refresh Paths"
status: "done"
created: "2026-04-27"
updated: "2026-04-27"
owner: "agent"
summary: "Extended the Phase 6 Piscina slice so single-file refresh and watch refresh paths also use optional worker-pool analysis."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "ai-context-engine"
  - "astrograph"
  - "piscina"
  - "worker pool"
  - "index-file"
  - "watch mode"
  - "refresh"
  - "tests"
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-11"
  expires_after: "2026-10-24"
  keep: false
branch: "astrograph-ai-engine-refactor"
started_at: "2026-04-27 17:10"
touched_paths:
  - "tools/ai-context-engine/package.json"
  - "tools/ai-context-engine/src/storage.ts"
  - "tools/ai-context-engine/tests/engine-behavior.test.ts"
  - "tools/ai-context-engine/tests/engine-contract.test.ts"
---

## Summary

This session follows the first Phase 6 Piscina landing by threading the same
optional worker-pool analysis path through the remaining refresh seams:
`indexFile()` and watch-triggered changed-file refreshes.

The worker pool is still optional and SQLite remains single-writer in the main
thread, but the parse/hash work is now consistent across folder indexing,
single-file repair, and watch refresh.

## What Changed

- taught `upsertFileIndex()` to accept worker-pool options instead of hardcoding
  direct analysis
- routed `indexFileDirect()` through the configured worker pool when enabled
- routed watch refresh changed-file analysis through the configured worker pool
- added behavior coverage for:
  - single-file refresh with worker mode enabled
  - watch refresh with worker mode enabled
  - continued worker/non-worker equivalence for indexed output

## Verification

- `pnpm --filter @astrograph/astrograph type-check`
- `pnpm exec vitest run tests/engine-behavior.test.ts -t "produces equivalent index output with and without the worker pool enabled|can refresh a single file with worker-pool analysis enabled|supports watch refresh with worker-pool analysis enabled"`
