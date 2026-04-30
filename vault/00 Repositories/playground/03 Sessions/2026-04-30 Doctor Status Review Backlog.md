---
id: "mem-20260430-doctor-status-review-backlog"
type: "session"
repo_slug: "playground"
title: "Doctor Status Review Backlog"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Taught `rag:doctor` to surface blocked status-review backlog by folding frontmatter-fix dry-run results into doctor output, including explicit `status_review_required` entries and summary counts."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "doctor"
  - "status-review"
  - "migration"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-status-suggestion-migration-policy"
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
  - "tools/obsidian-memory/tests/rag-doctor.test.mjs"
---

## Goal

Make the new blocked status-review migration state visible in `rag:doctor`
instead of hiding it inside the frontmatter-fix planner.

## Actions taken

- taught doctor to run `fixFrontmatter` in dry-run mode as part of report
  assembly
- folded planner blocking issues into `cleanup_frontmatter_check`
- added explicit `status_review_required` entries and summary counts
- exposed the frontmatter-fix dry-run payload directly in doctor checks
- hardened `fixFrontmatter` so missing repo roots yield an empty dry-run report
  instead of crashing

## Tests run

- `node --test ./tools/obsidian-memory/tests/rag-doctor.test.mjs ./tools/obsidian-memory/tests/rag-governance.test.mjs`
- `pnpm --filter @playground/obsidian-memory test:retrieval`
- `pnpm knowledge:check`

## Findings

- registry artifacts alone cannot represent blocked migration suggestions; the
  doctor surface needed the planner dry run to see them
- making `fixFrontmatter` tolerant of absent repo roots keeps doctor fixtures
  and partially bootstrapped repos from failing for the wrong reason

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next thin slice should likely keep smoothing the migration workflow, for
example a targeted remediation command for status-review backlog or clearer
doctor output around which suggested status should be chosen.
