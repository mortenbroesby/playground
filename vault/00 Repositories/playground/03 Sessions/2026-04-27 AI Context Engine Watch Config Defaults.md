---
id: "mem-20260427-ai-context-engine-watch-config-defaults"
type: "session"
repo_slug: "playground"
title: "AI Context Engine Watch Config Defaults"
status: "done"
created: "2026-04-27"
updated: "2026-04-27"
owner: "agent"
summary: "Extended the Phase 7 watch slice in `tools/ai-context-engine` with repo-configurable watch backend selection and debounce defaults."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "ai-context-engine"
  - "astrograph"
  - "watch mode"
  - "parcel-watcher"
  - "config"
  - "debounce"
  - "diagnostics"
  - "performance"
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
started_at: "2026-04-27 16:50"
touched_paths:
  - "tools/ai-context-engine/package.json"
  - "tools/ai-context-engine/README.md"
  - "tools/ai-context-engine/src/config.ts"
  - "tools/ai-context-engine/src/index.ts"
  - "tools/ai-context-engine/src/storage.ts"
  - "tools/ai-context-engine/src/types.ts"
  - "tools/ai-context-engine/src/watch-backend.ts"
  - "tools/ai-context-engine/tests/engine-behavior.test.ts"
  - "tools/ai-context-engine/tests/engine-contract.test.ts"
---

## Summary

This session follows the `@parcel/watcher` backend landing with the next thin
configuration slice from `.specs/performance-deps.md`.

Astrograph now supports repo-local watch defaults for backend selection and
debounce timing, so watch sessions can prefer `parcel`, `node-fs-watch`, or
`polling` without each caller needing to pass those values manually.

## What Changed

- added `watch.backend` and `watch.debounceMs` to the repo config schema
- resolved safe defaults for watch config alongside existing performance config
- threaded watch defaults into `watchFolder()` when callers omit explicit
  options
- taught the watch-backend abstraction to respect explicit backend preference
  while preserving the fallback chain for `auto`
- kept polling as the fallback correctness path and as an explicit forced mode
- documented the repo config shape in the Astrograph README
- added contract coverage for watch config loading and default normalization
- added behavior coverage that proves repo-config watch defaults are used

## Verification

- `pnpm --filter @astrograph/astrograph type-check`
- `pnpm --filter @astrograph/astrograph test -- tests/engine-contract.test.ts tests/watch-backend.test.ts`
- `pnpm exec vitest run tests/engine-behavior.test.ts -t "supports debounced watch mode with changed-file fast refresh|uses repo-config watch defaults when explicit watch options are omitted"`
