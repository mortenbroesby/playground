---
id: "mem-20260430-status-suggestion-acceptance-flow"
type: "session"
repo_slug: "playground"
title: "Status Suggestion Acceptance Flow"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Added an explicit acceptance flow for blocked status suggestions in `rag:fix-frontmatter`, including targeted status-review selection, guarded apply-time acceptance, CLI vault overrides, and end-to-end remediation tests."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "frontmatter"
  - "status"
  - "acceptance"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-status-review-remediation-path"
    - "mem-20260430-doctor-status-review-backlog"
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

Turn blocked status suggestions into a deliberate remediation flow instead of a
manual file-edit step.

## Actions taken

- added `--status-review-only` filtering to frontmatter remediation
- added guarded `--accept-suggested-status` support that only works with
  `--apply`
- added `--vault` support to the CLI so the remediation flow is testable end to
  end against fixtures
- extended the helper output with remediation-mode flags
- added direct CLI tests for both the guardrail and the accept flow

## Tests run

- `node --test ./tools/obsidian-memory/tests/rag-fix-frontmatter.test.mjs ./tools/obsidian-memory/tests/rag-governance.test.mjs`
- `pnpm --filter @playground/obsidian-memory test:retrieval`
- `pnpm knowledge:check`

## Findings

- backlog visibility alone was not enough; the migration workflow needed a
  narrow, explicit apply path for status-review notes
- CLI vault override support is now paying off across both governance and
  remediation surfaces

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next thin slice should likely improve suggestion quality itself, for
example surfacing rationale and alternative candidate statuses when a suggested
status is blocked for review.
