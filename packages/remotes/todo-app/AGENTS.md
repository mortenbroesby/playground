# AGENTS.md

This file provides guidance to coding agents working in `packages/remotes/todo-app/`.

## Scope Guidelines

- Follow the repository root `AGENTS.md` first, then this file for todo remote work.
- Do not edit generated output in `dist/` or `.turbo/`.
- Keep todo remote changes scoped to the remote's own UI, state, mount contract, and integration tests.

## Structure

- `src/mount.tsx` - host-facing mount entrypoint
- `src/contracts.ts` - remote contract types and shared event shapes
- `src/store.ts` - local todo state logic
- `src/components/` - remote UI
- `tests/integration/` - host-to-remote rendering and interaction coverage

## Commands

- `pnpm --filter @playground/todo-app build`
- `pnpm --filter @playground/todo-app lint`
- `pnpm --filter @playground/todo-app type-check`
- `pnpm --filter @playground/todo-app test`
- `pnpm --filter @playground/todo-app test:integration`

## Verification Guidance

- UI or state changes: run `test` and `type-check`.
- Mount contract, event shape, or host integration changes: run `test:integration` and `pnpm --filter @playground/host test`.
- Changes that touch shared contracts: also run `pnpm --filter @playground/types type-check`.

## Architecture Notes

- The remote is loaded by the host through a workspace import and mount contract.
- Keep host-facing APIs stable and explicit.
- Prefer verifying host interaction through the integration suite instead of relying on manual assumptions.
