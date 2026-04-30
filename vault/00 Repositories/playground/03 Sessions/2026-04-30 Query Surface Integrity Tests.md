---
id: "mem-20260430-query-surface-integrity-tests"
type: "session"
repo_slug: "playground"
title: "Query Surface Integrity Tests"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Added direct interface tests for rag:query and MCP memory_search so integrity metadata and integrity-mode controls are validated at the outer query surface."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "rag:query"
  - "mcp"
  - "testing"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-integrity-mode-query-controls"
    - "mem-20260430-integrity-aware-query-surface"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-14"
  expires_after: "2026-10-27"
  keep: false
branch: "feat/agent-facing-rag-rebuild-foundation"
touched_paths:
  - "tools/obsidian-memory/src/rag-mcp-server.mjs"
  - "tools/obsidian-memory/tests/query-surface.test.mjs"
---

## Goal

Validate integrity-aware query behavior at the actual CLI and MCP interfaces,
not only inside retrieval-core tests.

## Actions taken

- added a temp-index CLI test for `rag:query` JSON output
- added a temp-index JSON-RPC test for MCP `memory_search`
- added an env override for the MCP server index root so surface tests can run
  against isolated fixtures
- verified both integrity metadata and integrity-mode controls at the outer
  response layer

## Tests run

- `node --test ./tools/obsidian-memory/tests/query-surface.test.mjs`
- `pnpm --filter @playground/obsidian-memory test:retrieval`

## Findings

- the MCP server only needed a small index-root override to become directly
  testable without touching the live repo index
- interface tests catch issues that core retrieval tests cannot, especially
  parameter threading and formatted output expectations

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next thin slice should likely add the same kind of direct interface
coverage for `memory_context` or `memory_unfold`, or tighten query-surface
schemas around integrity-related options and defaults.
