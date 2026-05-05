---
id: "mem-20260425-use-official-mcp-sdk-with-astrograph"
type: "architecture-record"
repo_slug: "playground"
title: "Use Official MCP SDK With Astrograph"
status: "accepted"
created: "2026-04-25"
updated: "2026-04-29"
owner: "morten"
summary: "Use the official MCP SDK for repo-local MCP servers and use Astrograph as the code-navigation path."
tags:
  - "type/decision"
  - "repo/playground"
keywords:
  - "mcp"
  - "sdk"
  - "astrograph"
  - "fallback"
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-10-26"
  expires_after: null
  keep: true
decided_on: "2026-04-25"
decision_id: "DEC-2026-04-25-official-mcp-sdk-astrograph"
related_paths:
  - "../astrograph"
  - "AGENTS.md"
  - ".codex/config.toml"
---

Repo-local MCP servers should use the official MCP SDK rather than hand-rolled
stdio protocol loops.

For code navigation, Astrograph is the checked-in path for this repo.

This keeps the protocol surface aligned with the upstream SDK and the repo's
active indexed-retrieval workflow.
