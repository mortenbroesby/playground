# AGENTS.md

This file provides guidance to coding agents working in `apps/broesby/`.

## Scope Guidelines

- Follow the repository root `AGENTS.md` first, then this file for Broesby work.
- Do not edit generated output in `dist/`.
- Keep changes scoped to the standalone family site app and its local tests.

## Structure

- `src/App.tsx` - top-level app composition
- `src/main.tsx` - browser bootstrap
- `src/styles.css` - app-local styling
- `tests/` - Broesby integration and unit coverage

## Commands

- `pnpm --filter @playground/broesby build`
- `pnpm --filter @playground/broesby type-check`
- `pnpm --filter @playground/broesby test`

## Verification Guidance

- UI changes: run `test` and `type-check`.
- Vite or entrypoint changes: also run `build`.

## Architecture Notes

- This workspace is a standalone private family site, separate from `apps/host`.
- Keep early slices lightweight and easy to extend as later tasks add the gate flow and persistence.
