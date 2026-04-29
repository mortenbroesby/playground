---
id: "mem-20260427-ai-context-engine-result-limits"
type: "session"
repo_slug: "playground"
title: "AI Context Engine Result Limits"
status: archived
created: "2026-04-27"
updated: "2026-04-27"
owner: "agent"
summary: "Phase 6 config follow-up for Astrograph retrieval limits."
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
project: "playground"
---

Phase 6 config follow-up for Astrograph retrieval limits.

Goal:

- expose repo-configured result ceilings for indexed symbol and text retrieval

Landed:

- added `limits.maxSymbolResults` and `limits.maxTextResults` to `astrograph.config.json`
- threaded those limits through resolved engine config
- capped indexed `searchSymbols()` results even when callers request a higher explicit limit
- capped indexed `searchText()` results and discover-mode `query_code` text matches
- applied the same text ceiling to live ripgrep fallback together with `maxLiveSearchMatches`
- added contract coverage for config normalization and behavior coverage for indexed retrieval caps

Why:

- indexed text retrieval previously had no repo-configured ceiling
- explicit per-call symbol limits should not bypass repo-level safeguards
