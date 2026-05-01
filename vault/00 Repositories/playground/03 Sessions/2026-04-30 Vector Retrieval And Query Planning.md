---
id: "mem-20260430-vector-retrieval-and-query-planning"
type: "session"
repo_slug: "playground"
title: "Vector Retrieval And Query Planning"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Implemented deterministic local vector retrieval for typed memory, then split query classification from retrieval planning so the retrieval layer can explain archive and graph routing decisions."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "vector-retrieval"
  - "query-planning"
  - "ralph"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-rag-memory-schema-foundation"
    - "mem-20260430-rag-unresolved-link-enforcement"
    - "mem-20260430-registry-driven-diagnostics"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-14"
  expires_after: "2026-10-27"
  keep: false
branch: "feat/agent-facing-rag-rebuild-foundation"
touched_paths:
  - "tools/obsidian-memory/src/deterministic-embeddings.mjs"
  - "tools/obsidian-memory/src/obsidian-rag.mjs"
  - "tools/obsidian-memory/src/rag-index.ts"
  - "tools/obsidian-memory/src/rag-mcp-server.mjs"
  - "tools/obsidian-memory/src/rag-query.mjs"
  - "tools/obsidian-memory/tests/obsidian-rag.test.mjs"
  - "tools/obsidian-memory/tests/query-surface.test.mjs"
  - "tools/obsidian-memory/tests/rag-index.test.mjs"
---

## Goal

Close the first two remaining retrieval gaps in the agent-facing RAG rebuild:
replace the placeholder vector path with a real local vector source, then split
query classification from retrieval planning without breaking the current query
surfaces.

## Actions taken

- added deterministic local embeddings so `rag:index` emits usable vector data
  without external downloads or provider dependencies
- wired query-time vector retrieval into the typed memory search path as a
  distinct retrieval source with explicit availability and disabled-state
  explanations
- updated CLI and MCP query surfaces to surface vector availability metadata
- extracted a distinct `classifyMemoryQuery()` stage from the old heuristic
  planner
- reshaped `planMemoryQuery()` to carry explicit `classification`, `variants`,
  and `routing` state while preserving compatibility fields for existing callers
- made retrieval consume planner-owned expanded variants and route graph/archive
  decisions through explicit reasons instead of implicit scoring-only behavior

## Tests run

- `node --test ./tools/obsidian-memory/tests/obsidian-rag.test.mjs`
- `node --test ./tools/obsidian-memory/tests/query-surface.test.mjs`
- `node --test ./tools/obsidian-memory/tests/rag-index.test.mjs`
- `pnpm agents:check`
- `pnpm lint:md`

## Findings

- deterministic embeddings are enough to prove the vector retrieval seam and
  keep fixtures stable while the real provider-backed path remains deferred
- planner-owned routing flags make archive and graph behavior much easier to
  explain and test than implicit branching inside ranking
- keeping compatibility fields on the planner output avoided a much broader
  caller migration during the split

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next retrieval slice should likely parse Markdown links and Obsidian
wikilinks into the graph, or add a true lexical/vector/graph fusion stage now
that vector retrieval and planner separation exist.
