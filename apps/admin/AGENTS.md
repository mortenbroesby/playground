# AGENTS.md

This file provides guidance to coding agents working in `apps/admin/`.

## Scope Guidelines

- Follow the repository root `AGENTS.md` first, then this file for admin work.
- Do not edit generated output in `dist/`.
- Keep changes scoped to the admin board, its KANBAN parsing flow, and related
  tests.

## Structure

- `src/App.tsx` - app composition and top-level board rendering
- `src/lib/` - KANBAN parsing and view helpers
- `src/components/` - admin-specific UI
- `tests/` - board rendering and integration coverage

## Commands

- `pnpm --filter @playground/admin build`
- `pnpm --filter @playground/admin type-check`
- `pnpm --filter @playground/admin test`

## Verification Guidance

- UI or parsing changes: run `test` and `type-check`.
- Build tooling or Vite changes: also run `build`.

## Architecture Notes

- This workspace is a local admin surface, not part of the public host app.
- Keep KANBAN parsing logic explicit and easy to test.
