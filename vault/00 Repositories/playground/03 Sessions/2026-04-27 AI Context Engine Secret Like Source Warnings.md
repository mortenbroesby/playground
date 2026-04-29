---
title: AI Context Engine Secret Like Source Warnings
date: 2026-04-27
project: playground
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
