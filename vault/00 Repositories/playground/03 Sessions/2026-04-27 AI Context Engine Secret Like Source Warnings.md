---
id: "mem-20260427-ai-context-engine-secret-like-source-warnings"
type: "session"
repo_slug: "playground"
title: "AI Context Engine Secret Like Source Warnings"
status: "done"
created: "2026-04-27"
updated: "2026-04-27"
owner: "agent"
summary: "Phase 6 privacy follow-up for Astrograph."
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

Phase 6 privacy follow-up for Astrograph.

Goal:

- surface obvious secret-like indexed source as non-blocking doctor warnings instead of stale-index failures

Landed:

- extracted shared secret-pattern detection into `src/privacy.ts`
- reused that detection for observability redaction and doctor-time indexed source scanning
- added `privacy.secretLikeFileCount` and sample file paths to doctor JSON output
- added warning and suggested-action text for indexed files that look like they contain secrets
- kept the signal advisory: privacy findings do not flip `staleStatus` or `indexStatus`

Why:

- secret-like content is a real operator concern
- treating it as drift would overload freshness semantics and make the signal noisy
