---
type: repo-session
repo: playground
date: 2026-04-21
started_at: 2026-04-21 23:56
branch: main
summary: Reworked the `ai-context-engine` watch poller to use file metadata scans instead of full content-hash snapshots, while keeping explicit freshness diagnostics on the slower hash-based path.
keywords:
  - ai-context-engine
  - watch
  - polling
  - performance
  - diagnostics
touched_paths:
  - packages/ai-context-engine/src/storage.ts
tags:
  - type/session
  - repo/playground
---

# AI Context Engine Watch Poller Metadata Scan

## Summary

Changed the watch poller to detect candidate file changes from directory scans
plus file metadata (`mtimeMs` and `size`) instead of hashing every indexed file
on every poll interval.

The slower content-hash snapshot path remains in place for explicit freshness
diagnostics, but it is no longer on the normal watch polling path.

## What Changed

- added a metadata-only filesystem state snapshot helper for watch polling
- added a metadata-state diff helper for changed, added, and removed paths
- switched `watchFolder` polling from `compareSnapshots(loadIndexedSnapshot, loadFilesystemSnapshot)`
  to the cheaper metadata-state comparison
- preserved watch retry behavior by re-queueing changed paths after refresh errors

## Verification

- `pnpm --filter @playground/ai-context-engine type-check`
- `pnpm --filter @playground/ai-context-engine test -- --run tests/engine-behavior.test.ts tests/mutation-smoke.watch.test.ts`

## Notes

This slice removes the most obvious unnecessary work from steady-state watch
polling. It still scans the supported file tree and still consults `git
check-ignore`, so there is more room to optimize later, but the poller no
longer re-read and re-hash all watched file contents each cycle.
