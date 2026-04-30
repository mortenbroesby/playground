---
id: "mem-20260430-status-suggestion-rationale"
type: "session"
repo_slug: "playground"
title: "Status Suggestion Rationale"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Enriched blocked status suggestions with rationale and alternative candidates so frontmatter remediation output explains why a status was suggested instead of only emitting a bare value."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "status"
  - "rationale"
  - "migration"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-status-suggestion-acceptance-flow"
    - "mem-20260430-status-suggestion-migration-policy"
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

Make blocked status suggestions interpretable so operators can review and accept
them with less guesswork.

## Actions taken

- added `suggestedStatusReason` to the migration planner
- added `suggestedStatusAlternatives` for ambiguous status-review cases
- threaded `suggested_status_reason` and `suggested_status_alternatives`
  through frontmatter-fix output
- added assertions that ambiguous spec suggestions expose both rationale and
  alternative candidate statuses

## Tests run

- `node --test ./tools/obsidian-memory/tests/rag-governance.test.mjs ./tools/obsidian-memory/tests/rag-fix-frontmatter.test.mjs`
- `pnpm --filter @playground/obsidian-memory test:retrieval`
- `pnpm knowledge:check`

## Findings

- the blocked status-review flow is much easier to act on once the tool states
  both why it chose the default and what other statuses remain valid
- this stayed a pure data-shape improvement; no extra mutation policy was
  needed

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next thin slice should likely push the same explanation into doctor output
more explicitly, or start improving the suggestion heuristics themselves rather
than only explaining the current default.
