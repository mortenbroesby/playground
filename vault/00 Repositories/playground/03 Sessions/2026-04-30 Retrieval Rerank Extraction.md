---
id: "mem-20260430-retrieval-rerank-extraction"
type: "session"
repo_slug: "playground"
title: "Retrieval Rerank Extraction"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Extracted note-type, status, recency, archive, and integrity preferences into a distinct rerank stage after lexical/vector/graph fusion."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "rerank"
  - "retrieval"
  - "fusion"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-retrieval-rank-fusion"
    - "mem-20260430-inferred-graph-reference-edges"
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

Finish the retrieval-layer separation by moving ranking policy out of source
retrieval and into a distinct rerank stage that runs after lexical, vector, and
graph fusion.

## Actions taken

- moved note-type preference, status boosts, recency handling, archive routing,
  and integrity preference adjustments into a dedicated post-fusion rerank pass
- kept source fusion focused on lexical, vector, and graph candidate merging
  rather than policy weighting
- fixed graph expansion so it can expand across the filtered corpus instead of
  only lexical survivors
- broadened the degraded `memory_context` fallback query so it still returns
  compact search-style output when canonical repo-home headings are absent

## Tests run

- `node --test ./tools/obsidian-memory/tests/obsidian-rag.test.mjs`
- `node --test ./tools/obsidian-memory/tests/query-surface.test.mjs`

## Findings

- rerank policy is much easier to reason about when fusion and policy stay
  separate, especially for implementation vs architecture queries
- graph expansion has to operate on the filtered corpus, not the lexical set,
  or related notes without lexical hits never reach fusion at all

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next thin slice should extend the MCP surface with `memory.classify`,
`memory.propose_write`, and `memory.clean_dry_run` now that the retrieval core
is materially closer to the ADR shape.
