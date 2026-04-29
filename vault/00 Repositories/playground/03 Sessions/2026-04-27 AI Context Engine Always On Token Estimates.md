---
id: "mem-20260427-ai-context-engine-always-on-token-estimates"
type: "session"
repo_slug: "playground"
title: "AI Context Engine Always On Token Estimates"
status: "done"
created: "2026-04-27"
updated: "2026-04-27"
owner: "agent"
summary: "Stop emitting MCP observability events without token estimates."
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

Stop emitting MCP observability events without token estimates.

## Landed

- made MCP tool completion events always include `tokenEstimate`
- use a zero-savings mirror baseline when no stronger comparison is available
- applied the same fallback policy to failed MCP tool events
- tightened interface coverage so direct `query_code` discover events prove the
  estimate is present in `events.jsonl`
- updated the observability UI copy so missing estimates read as a legacy-event
  condition rather than an expected product state

## Why It Matters

Observability should not imply that estimates are optional. Even when a tool has
no richer baseline, a mirror estimate still makes the event measurable and
keeps aggregate views consistent.
