---
id: "mem-20260414-task-board-task-file-migration"
type: "session"
repo_slug: "playground"
title: "Task Board Task File Migration"
status: "active"
created: "2026-04-14"
updated: "2026-04-14"
owner: "agent"
summary: "Split the vault task board into a lightweight board index plus per-task markdown notes, and updated the admin app to read and write that model."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "task board"
  - "admin"
  - "tasks"
  - "vault"
  - "markdown"
  - "migration"
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-04-28"
  expires_after: "2026-10-11"
  keep: false
started_at: "2026-04-14 23:29"
touched_paths:
  - "apps/admin/src/App.tsx"
  - "apps/admin/src/lib/kanban.ts"
  - "apps/admin/src/lib/kanban-source.ts"
  - "apps/admin/src/types.ts"
  - "apps/admin/tests/kanban.test.ts"
  - "apps/admin/tests/app.integration.test.tsx"
  - "apps/admin/vite.config.ts"
  - "vault/00 Repositories/playground/04 Tasks/Task Board.md"
  - "vault/00 Repositories/playground/04 Tasks/tasks/"
---

## Outcome

Moved the canonical task board to a safer two-layer model:

- `Task Board.md` now acts as the lane/index document
- each task lives in its own note under `04 Tasks/tasks/`
- the admin app reads and writes the board index plus linked task files through
  the dev API

## Why

The single-file board had already become richer than the admin parser contract.
Any UI save risked truncating multi-line task content or deleting non-lane
sections.

## Notes

- The board still owns lane placement, priority, and AI appetite.
- Task files now use frontmatter for structured metadata and own `Why`,
  `Outcome`, `Source`, and richer freeform details.
- New tasks created through the admin app receive a task note file on save.
