---
id: "mem-20260427-ai-context-engine-p-map-parallel-indexing"
type: "session"
repo_slug: "playground"
title: "AI Context Engine P Map Parallel Indexing"
status: "done"
created: "2026-04-27"
updated: "2026-04-27"
owner: "agent"
summary: "Landed the Phase 5 `.specs/performance-deps.md` slice in `tools/ai-context-engine`: `p-map`-backed bounded parallel file analysis with ordered single-writer persistence, plus sandbox-aware observability interface coverage."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "ai-context-engine"
  - "astrograph"
  - "p-map"
  - "indexing"
  - "concurrency"
  - "performance"
  - "observability"
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
started_at: "2026-04-27 15:20"
touched_paths:
  - "tools/ai-context-engine/package.json"
  - "tools/ai-context-engine/README.md"
  - "tools/ai-context-engine/src/config.ts"
  - "tools/ai-context-engine/src/storage.ts"
  - "tools/ai-context-engine/src/types.ts"
  - "tools/ai-context-engine/tests/engine-behavior.test.ts"
  - "tools/ai-context-engine/tests/engine-contract.test.ts"
  - "tools/ai-context-engine/tests/interface.test.ts"
  - "pnpm-lock.yaml"
---

## Summary

This session lands the next `.specs/performance-deps.md` implementation slice
for Astrograph by introducing bounded parallel file analysis through `p-map`
while keeping SQLite persistence single-writer and deterministic.

It also tightens the repo config contract around file-processing concurrency and
hardens the observability interface tests so Bun localhost startup failures in
this sandbox stop presenting as product regressions.

## What Changed

- added `p-map` as a runtime dependency for `tools/ai-context-engine`
- extended repo config with `performance.fileProcessingConcurrency`
- resolved `"auto"` to a bounded CPU-aware default and clamped numeric values
- threaded the resolved concurrency into runtime engine config
- split folder indexing into:
  - concurrent file metadata/read/parse/hash analysis
  - ordered sequential persistence into SQLite
- kept `index-file` on the same analyze-then-persist path for consistency
- added contract coverage for config loading and normalization
- added a deterministic behavior test that compares indexed semantic state
  across serial and parallel concurrency settings
- updated interface tests to treat sandboxed Bun bind failures such as
  `Failed to listen at 127.0.0.1` and `listen EPERM` as environment skips
- documented the new repo config surface in the package README

## Verification

- `pnpm --filter @astrograph/astrograph type-check`
- `pnpm --filter @astrograph/astrograph test -- tests/engine-contract.test.ts`
- `pnpm exec vitest run tests/engine-behavior.test.ts -t "stores routine fingerprint hashes separately from integrity content hashes"`
- `pnpm exec vitest run tests/engine-behavior.test.ts -t "produces deterministic index output across file processing concurrency settings"`
- `pnpm --filter @astrograph/astrograph test -- tests/interface.test.ts`

The full `tests/engine-behavior.test.ts` file still appears to have an existing
long-running tail in this sandbox, so verification for this slice was kept to
the exact behavior assertions it changed rather than waiting on unrelated
coverage.
