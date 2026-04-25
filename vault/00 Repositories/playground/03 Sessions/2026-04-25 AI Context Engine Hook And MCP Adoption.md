---
type: session-note
repo: playground
date: 2026-04-25
summary: Replaced active jcodemunch hook and MCP workflow references with ai-context-engine and added a small hook-side reindex adapter.
tags:
  - type/session
  - repo/playground
  - ai-context-engine
  - hooks
  - mcp
---

# AI Context Engine Hook And MCP Adoption

## What changed

- Renamed the active code-exploration guard to a generic `code-navigation-guard`
  and rewrote its guidance around `query_code`, structural outline tools, and
  `diagnostics`.
- Replaced the post-edit `jcodemunch-mcp index-file` hook with a small
  hook-local adapter that runs `ai-context-engine cli index-file`.
- Switched local Codex MCP wiring from `jcodemunch-mcp` to
  `tools/ai-context-engine/scripts/ai-context-engine.mjs mcp`.
- Updated active repo docs and skill guidance to treat `ai-context-engine` as
  the source navigation layer without a `jcodemunch` fallback path.

## Why

The repo had already contracted the MCP retrieval surface around `query_code`,
but active hook/runtime wiring still depended on `jcodemunch`. That left the
repo in a contradictory state: docs said one thing, hook behavior and local MCP
config assumed another. The adapter keeps post-edit indexing working while
removing `jcodemunch` from the expected navigation path.
