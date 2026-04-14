---
type: repo-session
repo: playground
date: 2026-04-14
started_at: 2026-04-14 23:20
summary: Hardened the admin task-board round-trip so vault metadata and non-lane sections are preserved.
keywords:
  - admin
  - task board
  - kanban
  - parser
  - metadata
touched_paths:
  - apps/admin/src/lib/kanban.ts
  - apps/admin/src/types.ts
  - apps/admin/tests/kanban.test.ts
  - apps/admin/src/lib/kanban-source.ts
  - apps/admin/src/App.tsx
  - apps/admin/tests/app.integration.test.tsx
  - apps/admin/package.json
  - apps/admin/vite.config.ts
tags:
  - type/session
  - repo/playground
---

# Admin Task Board Metadata Preservation

## Outcome

Adjusted the admin board parser and serializer so the vault task board no
longer loses data on save.

The admin flow now preserves:

- non-lane sections such as `## Scales`
- wrapped `Why`, `Outcome`, and `Source` text
- unknown task blocks such as `Scope`, `Constraints`, `Non-goals`, and
  `Brainfart`

## Why

Pointing the admin app at the canonical vault task board exposed a destructive
round-trip. The previous parser only modeled a subset of task fields and the
serializer rewrote the document into a reduced shape.

## Notes

- Existing task markdown is preserved through raw task blocks.
- Known editable fields still update when changed through the admin UI.
- Admin integration tests need a `15000` ms timeout in this environment.
