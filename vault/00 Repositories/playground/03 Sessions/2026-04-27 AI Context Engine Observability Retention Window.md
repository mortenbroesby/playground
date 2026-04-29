---
date: 2026-04-27
project: playground
branch: astrograph-ai-engine-refactor
area: tools/ai-context-engine
---

# AI Context Engine Observability Retention Window

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
