---
id: "mem-20260507-session-heading-rerank-tuning"
type: "session"
repo_slug: "playground"
title: "Session Heading Rerank Tuning"
status: "active"
created: "2026-05-07"
updated: "2026-05-07"
owner: "agent"
summary: "Adjusted typed RAG fused reranking so same-note session `Goal` sections stop outranking more operational `Findings` and `Next handoff` sections for observed retrieval-quality false-positive diagnostics."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "obsidian-memory"
  - "retrieval"
  - "fusion"
  - "session"
  - "handoff"
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-21"
  expires_after: "2026-11-03"
  keep: false
branch: "feat/obsidian-rag-retrieval-spec"
touched_paths:
  - "tools/obsidian-memory/src/obsidian-rag.mjs"
  - "tools/obsidian-memory/tests/obsidian-rag.test.mjs"
---

## Goal

Turn Ralph `STORY-3` into a real retrieval-quality fix by preventing broad
same-note session `Goal` sections from beating more actionable `Findings` and
`Next handoff` sections for the observed false-positive diagnostic query shape.

## Actions taken

- added a focused regression corpus in
  `tools/obsidian-memory/tests/obsidian-rag.test.mjs` that reproduces the
  same-note session-section ordering problem
- adjusted `rerankFusedCandidates` in
  `tools/obsidian-memory/src/obsidian-rag.mjs` to apply a small heading-role
  rerank only when multiple chunks from the same session note compete
- penalized generic `Goal` sections while boosting `Findings` and
  `Next handoff`
- verified the live diagnostic query now ranks `Next handoff` and `Findings`
  above the same note's `Goal` section

## Tests run

- `node --test tools/obsidian-memory/tests/obsidian-rag.test.mjs`
- `node --test tools/obsidian-memory/tests/rag-index.test.mjs`
- `node --test --test-name-pattern "memory_search surfaces integrity warnings in full-detail MCP output|memory_unfold resolves by source_path and by source_file plus heading|logs weak and strong retrieval use signals|rag:query reports retrieval mode and widens the quality candidate pool" tools/obsidian-memory/tests/query-surface.test.mjs`
- `pnpm --filter @playground/obsidian-memory rag:evals`

## Findings

- the earlier Ralph evidence was enough to justify a narrow rerank fix once the
  user explicitly asked to elevate and fix instead of waiting for more organic
  event volume
- the bad ranking pattern was local to duplicate same-note session sections, so
  a fused rerank adjustment was safer than retuning lexical scoring or fusion
  weights globally
- after the change, the live `STORY-3` diagnostic query no longer surfaces the
  session `Goal` chunk above the same note's `Findings` and `Next handoff`

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

If future retrieval-event reports show a different false-positive pattern, add
another focused judged case before changing broader fusion weights or semantic
promotion again.
