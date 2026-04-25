---
type: session-note
repo: playground
date: 2026-04-25
summary: Hardened ai-context-engine MCP startup by removing backend work from handshake time and restored jcodemunch as the repo-local fallback navigation MCP.
tags:
  - type/session
  - repo/playground
  - ai-context-engine
  - jcodemunch
  - mcp
---

# MCP Startup Hardening And Jcodemunch Fallback

## What changed

- changed the `ai-context-engine` wrapper to prefer source files in the
  workspace and only fall back to built `dist/` artifacts for packaged installs
- changed the MCP server to lazy-load the engine module on tool execution
  instead of during `initialize` and `tools/list`
- added an interface test that asserts MCP startup stays free of backend stderr
  side effects before the first tool call
- restored a repo-local `jcodemunch` MCP server entry in `.codex/config.toml`
  as the fallback navigation path if `ai-context-engine` fails to load
- updated repo guidance and code-navigation guard messaging to point agents at
  `jcodemunch` before broad shell-based exploration when the primary engine is
  unavailable
- included the current root `package.json` `ctrl:daemon` adjustment in the same
  commit because the user requested committing all pending changes

## Why

The startup timeout warning was only the surface symptom. The immediate startup
path was doing extra work and could emit backend-related stderr before the MCP
server had even finished its handshake path. At the same time, the repo no
longer had a checked-in fallback MCP configuration after the earlier
ai-context-engine adoption work.

This slice makes MCP startup lighter and more predictable while reintroducing a
practical fallback path for code navigation when the primary engine is
unavailable.

## Verification

- `pnpm --filter @playground/ai-context-engine test -- --run tests/interface.test.ts`
- manual stdio MCP repro for `initialize` plus `tools/list` against
  `tools/ai-context-engine/scripts/ai-context-engine.mjs mcp`
