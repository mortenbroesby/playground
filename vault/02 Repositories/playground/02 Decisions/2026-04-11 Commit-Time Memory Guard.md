---
type: repo-decision
repo: playground
decision_id: DEC-2026-04-11-memory-guard
status: accepted
decided_on: 2026-04-11
summary: Large or structural commits must stage a repo memory note so durable agent memory is not skipped by habit.
keywords:
  - memory guard
  - pre-commit
  - knowledge check
  - obsidian-memory
related_paths:
  - scripts/check-knowledge-reminder.mjs
  - .husky/pre-commit
  - AGENTS.md
tags:
  - type/decision
  - repo/playground
---

# Commit-Time Memory Guard

Large and structural code or configuration changes are easy to ship without updating durable repo
memory. That leaves future agents dependent on source archaeology instead of explicit decisions.

The pre-commit hook now runs `pnpm knowledge:check`. For larger staged changes, the check requires a
staged note under `vault/02 Repositories/` before commit. The note can be a decision, session,
architecture note, or open question, but it must live in the repo-brain vault path so `pnpm
rag:index` can include it in the `obsidian-memory` corpus.

Intentional exceptions can use `SKIP_MEMORY_CHECK=1 git commit ...`, but the default workflow should
make memory capture the path of least resistance.
