---
id: "mem-20260427-2026-04-27-ai-context-engine-observability-redaction"
type: "session"
repo_slug: "playground"
title: "2026-04-27 AI Context Engine Observability Redaction"
status: archived
created: "2026-04-27"
updated: "2026-04-27"
owner: "agent"
summary: "local debugging"
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
---

- Scope: Phase 6 privacy follow-up from `.specs/ai-engine-refactor.md`
- Goal: make observability payloads privacy-safe by default without breaking
  local debugging

## Landed

- Added `observability.redactSourceText` repo config with a default of `true`
- Redacted source-like event payload fields before persisting `events.jsonl`
- Always scrubbed obvious secret-shaped tokens even when source-text redaction is
  explicitly disabled
- Added focused event-sink coverage for default redaction and local opt-out

## Notes

- This slice only changes observability event persistence
- It does not yet add separate doctor warnings for secret-like source content
