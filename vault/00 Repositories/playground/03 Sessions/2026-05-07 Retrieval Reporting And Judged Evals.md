---
id: "mem-20260507-retrieval-reporting-and-judged-evals"
type: "session"
repo_slug: "playground"
title: "Retrieval Reporting And Judged Evals"
status: "active"
created: "2026-05-07"
updated: "2026-05-07"
owner: "agent"
summary: "Added `rag:report` and `rag:evals` command surfaces in `tools/obsidian-memory` to summarize weak-vs-strong retrieval usage and run a small judged retrieval suite, with CLI coverage tests for both."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "retrieval"
  - "evals"
  - "observability"
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
  - "tools/obsidian-memory/package.json"
  - "tools/obsidian-memory/src/rag-report.mjs"
  - "tools/obsidian-memory/src/rag-retrieval-evals.mjs"
  - "tools/obsidian-memory/tests/rag-report.test.mjs"
  - "tools/obsidian-memory/tests/rag-retrieval-evals.test.mjs"
---

## Goal

Add thin command surfaces that make retrieval quality easier to inspect and
guard:

- summarize search/unfold event logs into reviewable weak-use and strong-use
  buckets
- run a small judged retrieval suite against representative retrieval modes

## Actions taken

- added `rag:report` to bucket weak-only queries, lower-rank strong uses, and
  vector-only false positives from retrieval event logs
- added `rag:evals` to exercise representative retrieval cases across default
  and quality retrieval modes
- wired both commands into `tools/obsidian-memory/package.json`
- added CLI-focused tests for both commands

## Tests run

- `pnpm --filter @playground/obsidian-memory run rag:test`
- `pnpm knowledge:check`

## Findings

- retrieval observability is now easier to review without manually inspecting
  raw JSONL events
- a small judged suite is enough to assert intended ranking behavior for the
  seeded retrieval fixtures in this slice

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next slice can expand the judged eval corpus or add more reporting buckets
if real retrieval-event reviews show repeated failure patterns worth tracking.
