---
id: "mem-20260427-2026-04-27-ai-context-engine-limits-config"
type: "session"
repo_slug: "playground"
title: "2026-04-27 AI Context Engine Limits Config"
status: "done"
created: "2026-04-27"
updated: "2026-04-27"
owner: "agent"
summary: "live-search fallback to repo-configurable caps"
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

- Scope: configuration follow-up from `.specs/performance-deps.md`
- Goal: add the spec-shaped `limits` block with safe defaults and wire the
  live-search fallback to repo-configurable caps

## Landed

- Added `limits` to `astrograph.config.json` resolution
- Added defaults for:
  - `maxFilesDiscovered`
  - `maxFileBytes`
  - `maxChildProcessOutputBytes`
  - `maxLiveSearchMatches`
- Wired ripgrep fallback to:
  - `limits.maxLiveSearchMatches`
  - `limits.maxChildProcessOutputBytes`
- Added contract coverage for default and custom limit resolution
- Added behavior coverage proving stale/missing-index ripgrep fallback respects
  repo-configured match caps

## Notes

- This slice only enforces the live-search-related limits today
- `maxFilesDiscovered` and `maxFileBytes` are now config-ready for future
  enforcement in discovery and file-read paths
