---
id: "mem-20260430-retrieval-rank-fusion"
type: "session"
repo_slug: "playground"
title: "Retrieval Rank Fusion"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Split retrieval into explicit lexical, vector, and graph candidate sources and fused them with reciprocal-rank scoring while preserving lexical strength as a secondary anchor."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "rank-fusion"
  - "retrieval"
  - "graph"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-vector-retrieval-and-query-planning"
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
  - "tools/obsidian-memory/tests/obsidian-rag.test.mjs"
---

## Goal

Close the explicit fusion gap in the typed retrieval pipeline by separating
lexical, vector, and graph candidates and merging them through a real fusion
step instead of folding every source into one scorer.

## Actions taken

- split the retrieval pipeline into explicit lexical search, graph expansion,
  and vector search candidate sources
- fused candidates with reciprocal-rank scoring instead of relying on one
  monolithic boosted score
- preserved lexical strength as a secondary anchor in the final fused score so
  related graph hits do not outrank clearly better implementation/spec matches
- reduced graph seed selection to the top lexical seed so graph expansion still
  works in small corpora
- expanded retrieval score breakdowns to include graph rank and preserved
  lexical score components

## Tests run

- `node --test ./tools/obsidian-memory/tests/obsidian-rag.test.mjs`
- `node --test ./tools/obsidian-memory/tests/query-surface.test.mjs`

## Findings

- pure reciprocal-rank fusion is not enough by itself for this corpus because
  graph+vector agreement can outrank a stronger lexical implementation hit too
  easily
- graph expansion needs a very small seed set to remain meaningful in fixture
  corpora and narrow repos

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next retrieval slice should move note-type, status, recency, and integrity
preferences into a dedicated rerank stage that runs after fusion rather than
inside lexical scoring.
