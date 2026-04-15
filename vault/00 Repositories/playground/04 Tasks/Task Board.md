---
type: repo-tasks
repo: playground
status: active
summary: Canonical kanban-style task board for the playground repo.
keywords:
  - tasks
  - kanban
  - backlog
  - ready
  - in progress
  - done
related_paths:
  - KANBAN.md
  - BRAINDUMP.md
tags:
  - type/tasks
  - repo/playground
---

# Task Board

Canonical task board for `playground`.

Raw and half-formed ideas belong in [BRAINDUMP.md](/Users/macbook/personal/playground/BRAINDUMP.md).
The canonical tasks now live as markdown files under
[04 Tasks/tasks](</Users/macbook/personal/playground/vault/00 Repositories/playground/04 Tasks/tasks>).
This note describes the board model rather than duplicating the task list.

## Scales

Priority scale:

- `P0` critical next architectural move
- `P1` important near-term follow-up
- `P2` useful next-wave improvement
- `P3` later or exploratory

Lane model:

- `Backlog` useful work worth keeping visible, but not shaped for execution yet
- `Ready` clearly-scoped work that can be picked up next
- `In Progress` work that is actively being executed now
- `Done` work that already landed

AI appetite scale:

- `0%` manual or coordination-heavy work where AI should stay narrow
- `100%` work an agent can drive almost end-to-end with light review
