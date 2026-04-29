---
id: "mem-20260427-ai-context-engine-ripgrep-text-fallback"
type: "session"
repo_slug: "playground"
title: "AI Context Engine Ripgrep Text Fallback"
status: archived
created: "2026-04-27"
updated: "2026-04-27"
owner: "agent"
summary: "Landed the first Phase 8 `.specs/performance-deps.md` slice in `tools/ai-context-engine`: ripgrep-backed live-disk text fallback for missing or stale indexes."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "ai-context-engine"
  - "astrograph"
  - "ripgrep"
  - "live search"
  - "fallback"
  - "stale index"
  - "missing index"
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
started_at: "2026-04-27 17:55"
touched_paths:
  - "tools/ai-context-engine/package.json"
  - "tools/ai-context-engine/README.md"
  - "tools/ai-context-engine/src/live-search.ts"
  - "tools/ai-context-engine/src/storage.ts"
  - "tools/ai-context-engine/src/types.ts"
  - "tools/ai-context-engine/tests/live-search.test.ts"
  - "tools/ai-context-engine/tests/engine-behavior.test.ts"
  - "tools/ai-context-engine/tests/engine-contract.test.ts"
  - "pnpm-lock.yaml"
---

## Summary

This session lands the first thin Phase 8 slice from
`.specs/performance-deps.md`.

Astrograph now has a ripgrep-backed live-disk fallback for text-style discovery
when the local index is missing or marked stale. The initial integration is
intentionally narrow: it covers `searchText()` and `query_code` discover-mode
text matches, while normal indexed retrieval remains the default when the index
is fresh.

## What Changed

- added `@vscode/ripgrep` as a runtime dependency
- introduced `src/live-search.ts` as the direct ripgrep adapter
- used fixed-string ripgrep search with direct process arguments instead of
  shell strings
- enforced repo-root path normalization, match limits, and output-byte limits
- labeled fallback matches as:
  - `source: "live_disk_match"`
  - `reason: "ripgrep_fallback"`
- taught `searchText()` to use the live fallback when the index is missing or
  stale
- taught `query_code` discover mode to return live text matches when
  `includeTextMatches` is requested and the index is missing or stale
- added direct adapter coverage for special characters, match limits, and
  truncation
- added behavior coverage for missing-index and stale-index fallback flows

## Verification

- `pnpm --filter @astrograph/astrograph type-check`
- `pnpm --filter @astrograph/astrograph test -- tests/live-search.test.ts`
- `pnpm exec vitest run tests/engine-behavior.test.ts -t "falls back to live-disk text search when the index is missing|falls back to live-disk text search when index metadata is stale"`
