---
type: repo-session
repo: playground
date: 2026-04-27
started_at: 2026-04-27 16:20
branch: astrograph-ai-engine-refactor
summary: Landed the Phase 7 `.specs/performance-deps.md` slice in `tools/ai-context-engine`: `@parcel/watcher`-backed watch subscription preference with explicit fallback reporting and backend normalization tests.
keywords:
  - ai-context-engine
  - astrograph
  - parcel-watcher
  - watch mode
  - diagnostics
  - performance
  - fallback
  - tests
touched_paths:
  - tools/ai-context-engine/package.json
  - tools/ai-context-engine/README.md
  - tools/ai-context-engine/src/index.ts
  - tools/ai-context-engine/src/storage.ts
  - tools/ai-context-engine/src/types.ts
  - tools/ai-context-engine/src/watch-backend.ts
  - tools/ai-context-engine/tests/engine-behavior.test.ts
  - tools/ai-context-engine/tests/engine-contract.test.ts
  - tools/ai-context-engine/tests/mutation-smoke.watch.test.ts
  - tools/ai-context-engine/tests/watch-backend.test.ts
  - pnpm-lock.yaml
tags:
  - type/session
  - repo/playground
---

# AI Context Engine Parcel Watch Backend

## Summary

This session lands the next `.specs/performance-deps.md` slice for Astrograph by
introducing a dedicated watch-backend abstraction that prefers
`@parcel/watcher`, falls back to `fs.watch`, and still preserves the existing
polling safety net.

The goal was to improve the long-running watch path without entangling it with
the larger optional worker-pool work from the later `piscina` phase.

## What Changed

- added `@parcel/watcher` as a runtime dependency for `tools/ai-context-engine`
- introduced `src/watch-backend.ts` as the watch subscription abstraction
- normalized Parcel and `fs.watch` event paths back to repo-relative form
- filtered repo-internal and out-of-root watch events before they reach the
  engine
- switched `watchFolder` to subscribe through the backend abstraction instead
  of opening `fs.watch` directly
- retained the polling sweep logic as the correctness path for refreshes
- added `watch.backend` to persisted watch diagnostics so callers can see
  whether Astrograph is using `parcel`, `node-fs-watch`, or `polling`
- added focused normalization coverage in `tests/watch-backend.test.ts`
- extended live watch assertions to verify the backend field is present in
  diagnostics

## Verification

- `pnpm --filter @astrograph/astrograph type-check`
- `pnpm --filter @astrograph/astrograph test -- tests/watch-backend.test.ts`
- `pnpm exec vitest run tests/engine-behavior.test.ts -t "supports debounced watch mode with changed-file fast refresh"`
- `pnpm exec vitest run tests/mutation-smoke.watch.test.ts`

The full `tests/engine-behavior.test.ts` file still has an unrelated
long-running tail in this sandbox, so verification for this slice stayed
focused on the exact watch behavior it changed.
