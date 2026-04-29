---
title: AI Context Engine Ranking Weights Config
date: 2026-04-27
project: playground
---

Phase 6 config follow-up for Astrograph ranking.

Goal:

- expose repo-configured symbol ranking weights without splitting search and ranked-context behavior

Landed:

- added `ranking` to `astrograph.config.json`
- introduced explicit default weights for exact-name, prefix, contains, signature, summary, file path, token, and exported-symbol bonuses
- threaded resolved ranking weights into engine config
- applied the shared weights to both `searchSymbols()` and ranked-context seed selection
- added contract coverage for ranking config normalization and behavior coverage proving repo config can change candidate ordering

Why:

- the spec called for ranking-weight config support
- the scoring seam already existed in one shared symbol scorer, so config belongs there rather than in a second ranking path
