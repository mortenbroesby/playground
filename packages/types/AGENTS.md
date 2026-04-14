# AGENTS.md

This file provides guidance to coding agents working in `packages/types/`.

## Scope Guidelines

- Follow the repository root `AGENTS.md` first, then this file for shared
  contract work.
- Do not edit generated output in `dist/` or `.turbo/`.
- Keep changes scoped to shared types and host-to-workspace contracts.

## Structure

- `src/index.ts` - shared type exports

## Commands

- `pnpm --filter @playground/types build`
- `pnpm --filter @playground/types lint`
- `pnpm --filter @playground/types type-check`

## Verification Guidance

- Type-only changes: run `lint` and `type-check`.
- Export-surface changes: also run `build` and the affected consumer checks.

## Architecture Notes

- Keep contracts narrow and explicit.
- Avoid leaking app-local implementation details into shared types.
