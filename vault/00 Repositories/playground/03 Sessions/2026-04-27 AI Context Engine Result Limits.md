---
title: AI Context Engine Result Limits
date: 2026-04-27
project: playground
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
