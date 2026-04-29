---
id: "mem-20260425-ai-context-engine-auto-query-mode"
type: "session"
repo_slug: "playground"
title: "AI Context Engine Auto Query Mode"
status: archived
created: "2026-04-25"
updated: "2026-04-25"
owner: "agent"
summary: "Added auto intent resolution to ai-context-engine query_code so CLI and MCP callers can omit explicit intent in common cases."
tags:
  - "type/session"
  - "repo/playground"
  - "ai-context-engine"
  - "retrieval"
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-09"
  expires_after: "2026-10-22"
  keep: false
---

## What changed

- `query_code` now supports `auto` intent resolution in the engine library.
- CLI and MCP callers can omit `intent`; the validation layer defaults to
  `auto`.
- Auto mode resolves to:
  - `source` for explicit `filePath` or `symbolId`
  - `assemble` when a token budget or ranked-candidate request is present
  - `source` for explicit `symbolIds`
  - `discover` otherwise

## Why

The engine already had one umbrella retrieval surface, but callers still had to
pick the sub-mode manually. That made normal usage noisier than necessary and
kept the MCP contract more procedural than the repo wanted. Auto mode keeps the
single-surface contract while preserving the explicit intents for callers that
need precise control.
