---
id: "mem-20260430-mcp-context-fallback-coverage"
type: "session"
repo_slug: "playground"
title: "MCP Context Fallback Coverage"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Added coverage for the `memory_context` fallback path so MCP context requests are tested both when canonical repo-home headings exist and when they degrade to search-style results."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "mcp"
  - "memory_context"
  - "fallback"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-mcp-context-and-unfold-coverage"
    - "mem-20260430-query-surface-integrity-tests"
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

Cover the degraded `memory_context` path so the MCP contract is tested both for
canonical repo-home context and for fallback search behavior.

## Actions taken

- parameterized the MCP fixture so repo-home chunks can be omitted cleanly
- added a `memory_context` test for the no-repo-home case
- asserted the fallback returns search-style compact results instead of repo
  context formatting
- kept the existing canonical repo-home and unfold coverage intact

## Tests run

- `node --test ./tools/obsidian-memory/tests/query-surface.test.mjs`
- `pnpm --filter @playground/obsidian-memory test:retrieval`
- `pnpm knowledge:check`

## Findings

- the existing fallback branch already behaves correctly; the missing piece was
  direct contract coverage
- using a fixture toggle is enough to exercise the degraded path without adding
  new implementation hooks

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next thin slice should likely cover MCP `tools/list` schema assertions so
the interface contract is tested at the discovery layer as well as at runtime
behavior.
