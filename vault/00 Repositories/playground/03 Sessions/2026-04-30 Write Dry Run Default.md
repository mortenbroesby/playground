---
id: "mem-20260430-write-dry-run-default"
type: "session"
repo_slug: "playground"
title: "Write Dry Run Default"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Changed `rag:write` to default to dry-run preview mode, requiring explicit `--apply` for mutations, and added direct CLI coverage for preview, apply, and duplicate-blocking behavior."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "write"
  - "dry-run"
  - "cli"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-verify-failure-surface-coverage"
    - "mem-20260430-doctor-cli-coverage"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-14"
  expires_after: "2026-10-27"
  keep: false
branch: "feat/agent-facing-rag-rebuild-foundation"
touched_paths:
  - "tools/obsidian-memory/src/rag-write.mjs"
  - "tools/obsidian-memory/tests/rag-write.test.mjs"
---

## Goal

Align `rag:write` with the ADR decision that source-note mutations must be
previewable first, with explicit opt-in for actual writes.

## Actions taken

- changed `rag:write` to default to dry-run preview mode
- added `--apply` as the explicit mutation switch
- added `--vault` and `--index-root` support so the write CLI can be tested
  against fixtures
- exported write arg parsing and execution helpers for direct test coverage
- added CLI tests for preview mode, apply mode, and duplicate write blocking

## Tests run

- `node --test ./tools/obsidian-memory/tests/rag-write.test.mjs`
- `pnpm --filter @playground/obsidian-memory test:retrieval`
- `pnpm knowledge:check`

## Findings

- the main policy gap was only at the CLI boundary; the underlying target-path,
  templating, and duplicate-detection logic already fit the safer workflow
- fixture path overrides make the write command testable without depending on
  the live vault or index

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next thin slice should likely stay in the write/migration lane, for example
softening heuristic duplicate matches from hard failures to warnings/proposals,
while keeping exact duplicate IDs as the only objective hard stop.
