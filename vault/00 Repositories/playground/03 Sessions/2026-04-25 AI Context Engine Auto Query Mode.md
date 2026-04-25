---
type: session-note
repo: playground
date: 2026-04-25
summary: Added auto intent resolution to ai-context-engine query_code so CLI and MCP callers can omit explicit intent in common cases.
tags:
  - type/session
  - repo/playground
  - ai-context-engine
  - retrieval
---

# AI Context Engine Auto Query Mode

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
