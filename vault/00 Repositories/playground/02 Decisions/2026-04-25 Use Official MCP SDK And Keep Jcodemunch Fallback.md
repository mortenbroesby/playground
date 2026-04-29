---
id: "mem-20260425-use-official-mcp-sdk-and-keep-jcodemunch-fallback"
type: "architecture-record"
repo_slug: "playground"
title: "Use Official MCP SDK And Keep Jcodemunch Fallback"
status: "accepted"
created: "2026-04-25"
updated: "2026-04-29"
owner: "morten"
summary: "Use the official MCP SDK for repo-local MCP servers and keep `jcodemunch` available as the fallback code-navigation path when the primary engine is unavailable."
tags:
  - "type/decision"
  - "repo/playground"
keywords:
  - "mcp"
  - "sdk"
  - "jcodemunch"
  - "fallback"
links:
  parents: []
  children: []
  related:
    - "mem-20260425-mcp-startup-hardening-jcodemunch-fallback"
    - "mem-20260411-jcodemunch-codex-setup"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-10-26"
  expires_after: null
  keep: true
decided_on: "2026-04-25"
decision_id: "DEC-2026-04-25-official-mcp-sdk-jcodemunch-fallback"
related_paths:
  - "tools/ai-context-engine"
  - "AGENTS.md"
  - ".codex/config.toml"
---

Repo-local MCP servers should use the official MCP SDK rather than hand-rolled
stdio protocol loops.

For code navigation, the primary engine may evolve, but `jcodemunch` remains
the checked-in fallback path when that primary path is unavailable or broken.

This keeps the protocol surface aligned with the upstream SDK and preserves a
practical escape hatch for local navigation work.
