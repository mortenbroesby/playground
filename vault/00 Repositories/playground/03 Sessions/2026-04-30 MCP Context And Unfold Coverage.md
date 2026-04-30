---
id: "mem-20260430-mcp-context-and-unfold-coverage"
type: "session"
repo_slug: "playground"
title: "MCP Context And Unfold Coverage"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Added end-to-end MCP coverage for `memory_context` and `memory_unfold`, including canonical repo-home context output, integrity surfacing, file-plus-heading resolution, and stable missing-target errors."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "mcp"
  - "memory_context"
  - "memory_unfold"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-query-surface-integrity-tests"
    - "mem-20260430-rag-verify-mode-split"
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

Close the remaining public MCP retrieval-surface gaps so agent-facing memory
flows are covered beyond `memory_search`.

## Actions taken

- expanded the query-surface fixture to include canonical repo-home chunks
- added MCP coverage for `memory_context` in compact and full modes
- asserted integrity warnings are surfaced through repo-home context output
- added `memory_unfold` coverage for exact `source_path` resolution
- added `memory_unfold` coverage for `source_file` plus `heading` resolution
- added a stable missing-target error assertion for `memory_unfold`

## Tests run

- `node --test ./tools/obsidian-memory/tests/query-surface.test.mjs`
- `pnpm --filter @playground/obsidian-memory test:retrieval`
- `pnpm knowledge:check`

## Findings

- the MCP surface already had the right behavior; the main gap was fixture
  coverage for canonical repo-home headings and unfold lookups
- note-level validation state flows cleanly through `memory_context` because
  repo-home chunks inherit warning status from the registry row

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next thin slice should likely cover MCP `tools/list` schema assertions or
the fallback path where `memory_context` drops to search when canonical
repo-home headings are missing, since the main happy-path retrieval surfaces
are now covered end to end.
