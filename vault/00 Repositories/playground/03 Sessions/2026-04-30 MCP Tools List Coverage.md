---
id: "mem-20260430-mcp-tools-list-coverage"
type: "session"
repo_slug: "playground"
title: "MCP Tools List Coverage"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Added end-to-end MCP discovery-contract coverage for `tools/list`, asserting the exposed tool names, required fields, and integrity-mode enums match the live server surface."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "mcp"
  - "tools/list"
  - "schema"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-mcp-context-fallback-coverage"
    - "mem-20260430-mcp-context-and-unfold-coverage"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-14"
  expires_after: "2026-10-27"
  keep: false
branch: "feat/agent-facing-rag-rebuild-foundation"
touched_paths:
  - "tools/obsidian-memory/tests/query-surface.test.mjs"
---

## Goal

Cover the MCP discovery layer so the public schema contract is tested alongside
runtime behavior.

## Actions taken

- added a live `tools/list` RPC assertion against the MCP server
- verified the exposed tool names remain `memory_search`, `memory_unfold`, and
  `memory_context`
- asserted `memory_search` keeps `query` required and advertises the expected
  integrity-mode enum values
- asserted `memory_unfold` and `memory_context` keep the expected schema
  properties and reject additional fields

## Tests run

- `node --test ./tools/obsidian-memory/tests/query-surface.test.mjs`
- `pnpm --filter @playground/obsidian-memory test:retrieval`
- `pnpm knowledge:check`

## Findings

- the discovery schema already matched the runtime surface; the missing piece
  was direct contract coverage
- keeping this test in the same MCP surface file avoids drifting between
  discovery and runtime expectations

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next thin slice should likely move from contract coverage to governance
surface coverage, for example adding direct tests around `rag:doctor` JSON
grouping or `rag:verify` error output under broken-index conditions.
