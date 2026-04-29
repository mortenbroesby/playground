---
id: "mem-20260422-ai-context-engine-watch-batch-ignore-checks"
type: "session"
repo_slug: "playground"
title: "AI Context Engine Watch Batch Ignore Checks"
status: archived
created: "2026-04-22"
updated: "2026-04-22"
owner: "agent"
summary: "Batched `git check-ignore` resolution for `ai-context-engine` file discovery and watch scans so supported-file scans no longer spawn one Git process per candidate path."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "ai-context-engine"
  - "watch"
  - "gitignore"
  - "performance"
  - "git"
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-06"
  expires_after: "2026-10-19"
  keep: false
branch: "main"
started_at: "2026-04-22 00:03"
touched_paths:
  - "packages/ai-context-engine/src/storage.ts"
---

## Summary

Changed supported-file discovery and watch-state scanning to resolve ignore
status in batches through `git check-ignore --stdin -z -v -n` instead of
spawning a separate Git process for each candidate file.

This compounds with the prior metadata-only watch scan slice: the watch poller
now avoids both whole-file hashing and per-file Git ignore subprocess overhead
in its steady-state path.

## What Changed

- added a supported-file candidate scanner that walks the tree without per-file
  ignore checks
- added a batch ignore resolver using `git check-ignore --stdin`
- switched `listSupportedFiles` to batch ignore filtering
- switched watch-state snapshot building to the same batch ignore filtering

## Verification

- `git check-ignore -h` was used locally to confirm the supported batch flags
- `pnpm --filter @playground/ai-context-engine type-check`
- `pnpm --filter @playground/ai-context-engine test -- --run tests/engine-behavior.test.ts tests/mutation-smoke.watch.test.ts tests/interface.test.ts`

## Notes

This is still a polling design, so directory walking remains part of the
runtime cost. The remaining obvious optimization space is avoiding full tree
walks when directory structure and mtimes have not changed, but the Git ignore
cost is now amortized to one subprocess per scan instead of one per file.
