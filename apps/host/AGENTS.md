# AGENTS.md

This file provides guidance to coding agents working in `apps/host/`.

## Scope Guidelines

- Follow the repository root `AGENTS.md` first, then this file for host-specific work.
- Do not edit generated output in `.next/`, `dist/`, or `.turbo/`.
- Keep host changes scoped to routing, page composition, and host-owned UI unless shared packages also need updates.

## Structure

- `src/routes.tsx` - route definitions
- `src/pages/` - route-level page components
- `src/components/` - host-specific UI and workspace wrappers
- `src/lib/` - host utilities and navigation config
- `tests/` - Vitest coverage for host routes and rendering helpers

## Commands

- `pnpm --filter @playground/host lint`
- `pnpm --filter @playground/host type-check`
- `pnpm --filter @playground/host test`

## Verification Guidance

- Route, layout, or host-only UI changes: run host `test` and `type-check`.
- Changes to remote mounting or host-to-remote integration: also run `pnpm --filter @playground/todo-app test:integration`.
- Changes to shared contracts or shared UI used by the host: run the relevant package checks in addition to host verification.

## Architecture Notes

- The host owns routing and overall page composition.
- The todo and uplink surfaces are mounted from workspace packages, not fetched from a remote URL.
- Keep integration boundaries explicit: host shell behavior here, remote-local behavior in the remote workspace.
