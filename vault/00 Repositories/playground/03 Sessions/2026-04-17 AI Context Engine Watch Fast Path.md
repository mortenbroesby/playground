---
type: repo-session
repo: playground
date: 2026-04-17
started_at: 2026-04-17 19:22
branch: feat/ai-context-engine-phase2-watch
summary: Replaced watch-mode full-folder refreshes in `@playground/ai-context-engine` with changed-file fast paths for modified and deleted files.
keywords:
  - ai-context-engine
  - watch
  - fast-path
  - indexing
  - sqlite
touched_paths:
  - packages/ai-context-engine/src/storage.ts
  - packages/ai-context-engine/tests/engine-behavior.test.ts
  - packages/ai-context-engine/README.md
tags:
  - type/session
  - repo/playground
---

# AI Context Engine Watch Fast Path

## Summary

Changed `@playground/ai-context-engine` watch-mode flushes so they stop calling
full `indexFolder(...)` refreshes after every detected change.

The polling snapshot detector is still in place, but once a debounce window
closes the watcher now:

- reindexes only the changed supported files
- removes deleted or newly ignored files from the SQLite index
- finalizes freshness metadata once per flush

## Why

The previous watch-mode slice already detected changed paths, but it threw that
detail away and rebuilt the full folder on every refresh. That was the main
remaining gap called out in the earlier watch-mode note.

## What Changed

- added a small `removeFileIndex(...)` helper in `storage.ts`
- switched `watchFolder(...)` flushes from full `indexFolder(...)` calls to
  path-by-path updates against the existing database
- preserved fresh diagnostics/meta updates by running one final
  `finalizeIndex(...)` after the changed-path batch
- expanded engine behavior coverage to prove:
  - modified files trigger a one-file fast refresh
  - deleted files are removed from the index without a full rebuild

## Verification

- `pnpm --filter @playground/ai-context-engine type-check`
- `pnpm --filter @playground/ai-context-engine test`

## Remaining Gap

Watch mode still uses a polling snapshot pass to discover file changes. This
change only removed the expensive full-folder rebuild step after detection.
