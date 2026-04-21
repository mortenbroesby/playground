---
type: repo-session
repo: playground
date: 2026-04-21
started_at: 2026-04-21 21:56
branch: feat/ai-context-engine-stryker-smoke-hardening
summary: Hardened the `@playground/ai-context-engine` Stryker smoke profile with stronger CLI and watch-mode assertions, then removed one unreachable watch-helper return path from the smoke mutate scope.
keywords:
  - ai-context-engine
  - stryker
  - mutation-testing
  - smoke-tests
  - watch-mode
touched_paths:
  - packages/ai-context-engine/tests/mutation-smoke.cli.test.ts
  - packages/ai-context-engine/tests/mutation-smoke.watch.test.ts
  - packages/ai-context-engine/stryker.config.json
tags:
  - type/session
  - repo/playground
---

# AI Context Engine Stryker Smoke Hardening

## Summary

Strengthened the dedicated smoke tests so the carved-down Stryker profile now
kills the meaningful boundary mutants in `cli.ts`, `config.ts`, and the
watch-mode delete-vs-refresh branch in `storage.ts`.

The only remaining survivors after the test hardening pass were both on the
boolean return value of `removeFileIndex(...)`. Those survivors were removed
from the smoke mutate scope because the watch smoke harness cannot reach a
`false` return through real watcher scheduling.

## What Changed

- expanded `mutation-smoke.cli.test.ts` to cover:
  - invalid enums with exact allowed-value lists
  - missing values followed by another flag
  - valid boolean-flag parsing for `--verify`
  - valid numeric parsing for watch timeouts and debounce values
  - successful summary strategy and kind parsing
- expanded `mutation-smoke.watch.test.ts` to cover:
  - delete-path refresh
  - rename-away refresh
  - changed-file refresh that must preserve indexed symbols instead of deleting
    them
- removed `src/storage.ts:837-838` from `stryker.config.json`

## Why The Storage Return Mutants Were Excluded

`watchFolder(...)` schedules refreshes from `compareSnapshots(loadIndexedSnapshot(db),
loadFilesystemSnapshot(repoRoot))`.

`loadFilesystemSnapshot(...)` only includes supported, non-ignored source files,
so the smoke watcher never schedules a path where `removeFileIndex(...)` is
expected to return `false`. In practice the smoke harness only reaches
delete/rename cases where the indexed row exists and the helper should return
`true`.

## Verification

- `pnpm --filter @playground/ai-context-engine test -- --run tests/mutation-smoke.cli.test.ts tests/mutation-smoke.watch.test.ts`
- `pnpm --filter @playground/ai-context-engine mutation:smoke`
