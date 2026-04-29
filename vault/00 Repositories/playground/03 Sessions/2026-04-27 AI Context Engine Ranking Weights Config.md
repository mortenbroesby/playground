---
id: "mem-20260427-ai-context-engine-ranking-weights-config"
type: "session"
repo_slug: "playground"
title: "AI Context Engine Ranking Weights Config"
status: "done"
created: "2026-04-27"
updated: "2026-04-27"
owner: "agent"
summary: "Phase 6 config follow-up for Astrograph ranking."
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
