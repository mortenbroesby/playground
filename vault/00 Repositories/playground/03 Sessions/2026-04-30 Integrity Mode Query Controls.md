---
id: "mem-20260430-integrity-mode-query-controls"
type: "session"
repo_slug: "playground"
title: "Integrity Mode Query Controls"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Added explicit query and MCP controls for how warning-scoped notes are handled, so callers can exclude them or prefer them instead of always using the default healthy-note bias."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "query"
  - "mcp"
  - "integrity-mode"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-integrity-aware-query-surface"
    - "mem-20260430-integrity-aware-retrieval-ranking"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-14"
  expires_after: "2026-10-27"
  keep: false
branch: "feat/agent-facing-rag-rebuild-foundation"
touched_paths:
  - "tools/obsidian-memory/src/obsidian-rag.mjs"
  - "tools/obsidian-memory/src/rag-query.mjs"
  - "tools/obsidian-memory/src/rag-mcp-server.mjs"
  - "tools/obsidian-memory/tests/obsidian-rag.test.mjs"
---

## Goal

Let query callers explicitly control whether warning-scoped notes are excluded,
preferred, or handled with the default healthy-note bias.

## Actions taken

- added `integrityMode` handling to typed retrieval filtering and scoring
- exposed `--integrity-mode` on `rag:query`
- exposed `integrity_mode` on the MCP `memory_search` input schema
- added focused retrieval tests for excluding and preferring warning-scoped
  notes

## Tests run

- `node --test ./tools/obsidian-memory/tests/obsidian-rag.test.mjs`
- `pnpm --filter @playground/obsidian-memory test:retrieval`

## Findings

- caller control fits cleanly as a narrow retrieval option because the ranking
  path already centralizes integrity handling
- `exclude-warning` is best implemented as a corpus filter, while
  `prefer-warning` is a scoring mode rather than a hard filter

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next thin slice should likely add CLI or MCP coverage tests around the new
integrity-mode parameters, since the retrieval core is now wired but the outer
surfaces are still mostly validated indirectly.
