---
id: "mem-20260430-status-review-remediation-path"
type: "session"
repo_slug: "playground"
title: "Status Review Remediation Path"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Added an explicit remediation flow for blocked status-review backlog in `rag:fix-frontmatter`, including `--status-review-only`, `--accept-suggested-status`, CLI vault override support, and end-to-end coverage."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "frontmatter"
  - "status-review"
  - "remediation"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-doctor-status-review-backlog"
    - "mem-20260430-status-suggestion-migration-policy"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-14"
  expires_after: "2026-10-27"
  keep: false
branch: "feat/agent-facing-rag-rebuild-foundation"
touched_paths:
  - "tools/obsidian-memory/src/rag-fix-frontmatter.mjs"
  - "tools/obsidian-memory/src/rag-governance.mjs"
  - "tools/obsidian-memory/tests/rag-fix-frontmatter.test.mjs"
  - "tools/obsidian-memory/tests/rag-governance.test.mjs"
---

## Goal

Turn blocked status-review backlog from a passive report into an explicit
operator workflow that can be targeted and applied deliberately.

## Actions taken

- added `--vault` support to `rag:fix-frontmatter` for fixture-driven CLI use
- added `--status-review-only` to target only blocked status-review notes
- added `--accept-suggested-status` as an explicit apply-time opt-in
- kept ambiguous status blocked by default unless that explicit acceptance is
  provided
- added direct CLI coverage for both the guardrail and the accept flow

## Tests run

- `node --test ./tools/obsidian-memory/tests/rag-fix-frontmatter.test.mjs ./tools/obsidian-memory/tests/rag-governance.test.mjs`
- `pnpm --filter @playground/obsidian-memory test:retrieval`
- `pnpm knowledge:check`

## Findings

- the missing piece after backlog surfacing was not more reporting but a
  deliberate narrow command path for resolving those blocked notes
- vault override support was necessary to make the CLI remediation flow
  testable end to end

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next thin slice should likely improve suggestion quality, for example
showing why a suggested status was chosen or surfacing candidate alternatives
when the suggestion is weak.
