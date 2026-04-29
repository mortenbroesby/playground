---
id: "mem-20260427-2026-04-27-ai-context-engine-profiling-tooling"
type: "session"
repo_slug: "playground"
title: "2026-04-27 AI Context Engine Profiling Tooling"
status: archived
created: "2026-04-27"
updated: "2026-04-27"
owner: "agent"
summary: "ad-hoc terminal commands"
tags: []
keywords: []
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
---

- Scope: Phase 10 from `.specs/performance-deps.md`
- Goal: make repeatable profiling available from package scripts instead of
  ad-hoc terminal commands

## Landed

- Added `clinic` and `0x` as Astrograph dev dependencies
- Added package scripts:
  - `profile:index:clinic`
  - `profile:query:clinic`
  - `profile:index:0x`
  - `profile:query:0x`
- Standardized artifact locations under `tools/ai-context-engine/.profiles/`
- Gitignored `.profiles/`
- Documented when to use Clinic vs 0x and how the existing perf scripts map to
  cold indexing, warm refresh, and `query_code`

## Notes

- `profile:index:*` runs `scripts/perf-index.mjs`, which already exercises cold
  index plus warm refresh paths in one run
- `profile:query:*` runs `scripts/perf-query.mjs` for `query_code` profiling
- This slice is intentionally tooling-only; it does not change retrieval or
  indexing behavior
