---
date: 2026-04-27
project: playground
branch: astrograph-ai-engine-refactor
area: tools/ai-context-engine
---

# AI Context Engine Always On Token Estimates

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
