---
id: "mem-20260430-status-suggestion-migration-policy"
type: "session"
repo_slug: "playground"
title: "Status Suggestion Migration Policy"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Changed frontmatter migration so missing status is only auto-applied when inference is unambiguous; ambiguous cases now surface a suggested status and block apply until reviewed."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "migration"
  - "status"
  - "frontmatter"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-write-duplicate-proposals"
    - "mem-20260430-write-dry-run-default"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-14"
  expires_after: "2026-10-27"
  keep: false
branch: "feat/agent-facing-rag-rebuild-foundation"
touched_paths:
  - "tools/obsidian-memory/src/rag-governance.mjs"
  - "tools/obsidian-memory/tests/rag-governance.test.mjs"
---

## Goal

Align frontmatter migration with the ADR decision that missing status should be
suggested, not silently applied, unless inference is genuinely unambiguous.

## Actions taken

- added explicit unambiguous-status inference rules for safe cases like
  repo-home, reference/glossary, and repo session notes under `03 Sessions/`
- changed ambiguous missing-status cases to emit `suggest_status` plus
  `status_review_required`
- added `suggested_status` and `blocking_issues` to frontmatter-fix output
- prevented `fixFrontmatter --apply` from rewriting notes that still need
  status review

## Tests run

- `node --test ./tools/obsidian-memory/tests/rag-governance.test.mjs`
- `pnpm --filter @playground/obsidian-memory test:retrieval`
- `pnpm knowledge:check`

## Findings

- the existing session migration path can stay automatic without violating the
  policy, because that folder/type combination is sufficiently explicit
- the ambiguous spec case needed a new blocked-apply path rather than another
  defaulting heuristic

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next thin slice should likely keep improving migration ergonomics, for
example surfacing blocked-frontmatter notes more clearly in doctor or adding a
dedicated remediation command for status-review backlog.
