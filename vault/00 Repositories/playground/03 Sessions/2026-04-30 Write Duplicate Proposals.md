---
id: "mem-20260430-write-duplicate-proposals"
type: "session"
repo_slug: "playground"
title: "Write Duplicate Proposals"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Changed write-duplicate handling so only exact title-plus-summary collisions hard-fail, while heuristic title-only or summary-only matches are surfaced as duplicate proposals in `rag:write` output."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "write"
  - "duplicates"
  - "heuristics"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-write-dry-run-default"
    - "mem-20260430-doctor-cli-coverage"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-14"
  expires_after: "2026-10-27"
  keep: false
branch: "feat/agent-facing-rag-rebuild-foundation"
touched_paths:
  - "tools/obsidian-memory/src/rag-governance.mjs"
  - "tools/obsidian-memory/src/rag-write.mjs"
  - "tools/obsidian-memory/tests/rag-governance.test.mjs"
  - "tools/obsidian-memory/tests/rag-write.test.mjs"
---

## Goal

Align write-duplicate enforcement with the ADR decision that heuristic matches
should warn or propose merges, while only objective conflicts hard-fail.

## Actions taken

- split write duplicate detection into `exact` and `heuristic` match classes
- made `rag:write` fail only on exact title-plus-summary collisions
- surfaced heuristic matches as `duplicate_proposals` in write output
- added tests for heuristic proposals and exact duplicate blocking

## Tests run

- `node --test ./tools/obsidian-memory/tests/rag-governance.test.mjs ./tools/obsidian-memory/tests/rag-write.test.mjs`
- `pnpm --filter @playground/obsidian-memory test:retrieval`
- `pnpm knowledge:check`

## Findings

- the previous hard-fail behavior was entirely a write-layer policy choice, not
  a deeper registry requirement
- returning duplicate proposals in the JSON output keeps agents moving without
  hiding potentially useful existing notes

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next thin slice should likely keep moving through the write/migration lane,
for example surfacing clearer merge/reuse guidance in duplicate proposals or
starting the migration-side `status` suggestion policy work.
