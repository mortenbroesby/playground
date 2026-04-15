---
type: repo-session
repo: playground
date: 2026-04-14
started_at: 2026-04-14 23:29
summary: Split the vault task board into a lightweight board index plus per-task markdown notes, and updated the admin app to read and write that model.
keywords:
  - task board
  - admin
  - tasks
  - vault
  - markdown
  - migration
touched_paths:
  - apps/admin/src/App.tsx
  - apps/admin/src/lib/kanban.ts
  - apps/admin/src/lib/kanban-source.ts
  - apps/admin/src/types.ts
  - apps/admin/tests/kanban.test.ts
  - apps/admin/tests/app.integration.test.tsx
  - apps/admin/vite.config.ts
  - vault/00 Repositories/playground/04 Tasks/Task Board.md
  - vault/00 Repositories/playground/04 Tasks/tasks/
tags:
  - type/session
  - repo/playground
---

# Task Board Task File Migration

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
