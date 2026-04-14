---
type: repo-architecture
repo: playground
status: active
summary: Verification should start at the changed workspace and broaden only when contracts, shared packages, or public behavior are affected.
keywords:
  - verification
  - tests
  - type-check
  - integration tests
  - markdown lint
related_paths:
  - apps/host/tests
  - packages/remotes/todo-app/tests/integration
  - package.json
  - AGENTS.md
tags:
  - type/architecture
  - repo/playground
---

# Verification Map

## Narrow Checks

For host-only route, layout, UI, metadata, or API helper work, start with:

- `pnpm --filter @playground/host test`
- `pnpm --filter @playground/host type-check`
- `pnpm --filter @playground/host lint`

For todo remote work, use the todo workspace checks:

- `pnpm --filter @playground/todo-app test`
- `pnpm --filter @playground/todo-app test:integration`
- `pnpm --filter @playground/todo-app type-check`
- `pnpm --filter @playground/todo-app lint`

For uplink game work, use:

- `pnpm --filter @playground/uplink-game build`
- `pnpm --filter @playground/uplink-game type-check`

## Broader Checks

Run broader Turbo checks when changes cross workspace boundaries, touch shared contracts, affect
shared tooling, or alter package wiring:

- `pnpm turbo type-check`
- `pnpm turbo lint`
- `pnpm turbo build`

Docs and vault notes are covered by `pnpm lint:md`. The pre-commit `pnpm knowledge:check` guard
exists to make sure large or structural commits also carry durable repo memory.
