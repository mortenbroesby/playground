---
id: "mem-20260430-integrity-aware-retrieval-ranking"
type: "session"
repo_slug: "playground"
title: "Integrity Aware Retrieval Ranking"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Updated typed retrieval to carry registry validation state through corpus normalization and apply a small ranking penalty plus explanation reason for warning-scoped notes."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "retrieval"
  - "ranking"
  - "integrity"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-registry-driven-diagnostics"
    - "mem-20260430-doctor-registry-integrity-adoption"
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

Make typed retrieval explicitly aware of note integrity so ranking and match
reasons reflect whether a candidate comes from a warning-scoped note.

## Actions taken

- threaded registry `validation_status` and `validation_issues` into typed
  corpus normalization
- added a small retrieval penalty for warning-scoped notes instead of filtering
  them out
- surfaced `integrity:warning` in match reasons so ranking explanations expose
  why a weaker note lost to a healthier peer
- added a focused retrieval test where two similarly relevant notes differ only
  by integrity health

## Tests run

- `node --test ./tools/obsidian-memory/tests/obsidian-rag.test.mjs`
- `pnpm --filter @playground/obsidian-memory test:retrieval`

## Findings

- a small penalty is enough to prefer healthier typed notes without hiding
  useful warning-scoped candidates from the result set
- explanation quality improves materially once integrity state is visible in
  `matchReasons`, because ranking no longer looks arbitrary in tie-like cases

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next thin slice should likely expose integrity-aware filtering or reasons in
the query/MCP response surface, since retrieval ranking now has the signal but
downstream callers may not present it explicitly.
