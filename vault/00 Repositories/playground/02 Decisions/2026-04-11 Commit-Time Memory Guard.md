---
id: "mem-20260411-commit-time-memory-guard"
type: "architecture-record"
repo_slug: "playground"
title: "Commit-Time Memory Guard"
status: "accepted"
created: "2026-04-11"
updated: "2026-04-11"
owner: "morten"
summary: "Large or structural commits must stage a repo memory note so durable agent memory is not skipped by habit."
tags:
  - "type/decision"
  - "repo/playground"
keywords:
  - "memory guard"
  - "pre-commit"
  - "knowledge check"
  - "obsidian-memory"
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-10-08"
  expires_after: null
  keep: true
decided_on: "2026-04-11"
decision_id: "DEC-2026-04-11-memory-guard"
related_paths:
  - "scripts/check-knowledge-reminder.mjs"
  - ".husky/pre-commit"
  - "AGENTS.md"
---

Large and structural code or configuration changes are easy to ship without updating durable repo
memory. That leaves future agents dependent on source archaeology instead of explicit decisions.

The pre-commit hook now runs `pnpm knowledge:check`. For larger staged changes, the check requires a
staged note under `vault/00 Repositories/` before commit. The note can be a decision, session,
architecture note, or open question, but it must live in the repo-brain vault path so `pnpm
rag:index` can include it in the `obsidian-memory` corpus.

Intentional exceptions can use `SKIP_MEMORY_CHECK=1 git commit ...`, but the
default workflow should make memory capture the path of least resistance.

When the guard requires a note, the agent should choose the note type with the
repo's memory note routing state machine:

- task note for unresolved follow-up work
- decision note for durable policy or workflow defaults
- architecture note for structural or source-of-truth changes
- session note for everything else worth preserving
