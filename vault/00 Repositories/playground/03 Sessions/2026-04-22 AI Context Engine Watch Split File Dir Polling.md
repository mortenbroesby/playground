---
type: repo-session
repo: playground
date: 2026-04-22
started_at: 2026-04-22 00:11
branch: main
summary: Split `ai-context-engine` watch polling into direct stats for known files plus subtree rescans only when directory metadata changes, reducing steady-state scan scope further.
keywords:
  - ai-context-engine
  - watch
  - polling
  - performance
  - filesystem
touched_paths:
  - packages/ai-context-engine/src/storage.ts
tags:
  - type/session
  - repo/playground
---

# AI Context Engine Watch Split File Dir Polling

## Summary

Changed watch polling to treat content edits and tree-structure changes as
different classes of work.

Known files are now checked by direct `stat` calls, while recursive subtree
rescans only happen when directory metadata changes indicate adds, deletes, or
renames in that part of the tree.

## What Changed

- added tracked directory state alongside tracked file state
- added recursive directory-state snapshot helpers
- added a known-directory stat loader for cheap polling of existing directories
- changed watch polling to:
  - `stat` existing tracked files for content changes
  - compare known directory mtimes for structural changes
  - rescan only changed directory subtrees
- kept full tree snapshots out of the steady-state content-edit polling path

## Verification

- `pnpm --filter @playground/ai-context-engine type-check`
- `pnpm --filter @playground/ai-context-engine test -- --run tests/engine-behavior.test.ts tests/mutation-smoke.watch.test.ts tests/interface.test.ts`

## Notes

This compounds with the two prior watch slices:

- polling no longer hashes all file contents each cycle
- ignore checks are batched instead of per-file
- and now recursive subtree scans are avoided for ordinary content edits

The remaining work in this area would be more aggressive eventing or platform
watch integration rather than further squeezing the current polling model.
