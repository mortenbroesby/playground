---
id: "mem-20260430-integrity-aware-query-surface"
type: "session"
repo_slug: "playground"
title: "Integrity Aware Query Surface"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Exposed registry integrity metadata through retrieval candidates, assembled context items, and MCP chunk formatting so callers can see warning-scoped notes directly."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "query"
  - "mcp"
  - "integrity"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-integrity-aware-retrieval-ranking"
    - "mem-20260430-registry-driven-diagnostics"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-14"
  expires_after: "2026-10-27"
  keep: false
branch: "feat/agent-facing-rag-rebuild-foundation"
touched_paths:
  - "tools/obsidian-memory/src/obsidian-rag.mjs"
  - "tools/obsidian-memory/src/rag-mcp-server.mjs"
  - "tools/obsidian-memory/tests/obsidian-rag.test.mjs"
---

## Goal

Expose note integrity through the query-facing retrieval surface so downstream
callers can see when a result is warning-scoped instead of only inheriting a
ranking penalty.

## Actions taken

- added `validationStatus` and `validationIssues` to ranked typed retrieval
  candidates
- propagated integrity metadata into assembled context items and references
- updated MCP chunk formatting to print an integrity line for warning-scoped
  notes in compact and full responses
- added focused retrieval tests for candidate-level and context-level integrity
  propagation

## Tests run

- `node --test ./tools/obsidian-memory/tests/obsidian-rag.test.mjs`
- `pnpm --filter @playground/obsidian-memory test:retrieval`

## Findings

- carrying integrity through the candidate shape is enough for both CLI JSON
  output and MCP formatting without additional index reads
- a lightweight integrity line in MCP output gives callers usable explanation
  context without dumping raw registry rows into the response

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next thin slice should likely let callers explicitly filter or demote
warning-scoped notes through query/MCP inputs rather than always applying the
same built-in retrieval penalty.
