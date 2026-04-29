---
id: "mem-20260427-ai-context-engine-observability-retention-window"
type: "session"
repo_slug: "playground"
title: "AI Context Engine Observability Retention Window"
status: archived
created: "2026-04-27"
updated: "2026-04-27"
owner: "agent"
summary: "Keep local Astrograph observability history for a useful bounded window instead of letting `events.jsonl` grow forever."
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
area: "tools/ai-context-engine"
branch: "astrograph-ai-engine-refactor"
project: "playground"
---

## Goal

Keep local Astrograph observability history for a useful bounded window instead
of letting `events.jsonl` grow forever.

## Landed

- added `observability.retentionDays` to `astrograph.config.json`
- defaulted local event retention to `3` days
- pruned expired events during event writes so `events.jsonl` stays bounded
- kept the existing `/recent` API and `recentLimit` behavior unchanged
- added focused contract and event-sink coverage for the default and an explicit
  retention override

## Why It Matters

The observability log is operational history, not primary product data. A small
time-window default keeps recent debugging context available while preventing
unbounded local growth.
