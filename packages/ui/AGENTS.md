# AGENTS.md

This file provides guidance to coding agents working in `packages/ui/`.

## Scope Guidelines

- Follow the repository root `AGENTS.md` first, then this file for shared UI
  work.
- Do not edit generated output in `dist/` or `.turbo/`.
- Keep changes scoped to reusable UI primitives, tokens, and theme assets.

## Structure

- `src/index.ts` - package export surface
- `src/tokens.ts` - shared design tokens
- `src/theme.css` - shared theme styles

## Commands

- `pnpm --filter @playground/ui build`
- `pnpm --filter @playground/ui lint`
- `pnpm --filter @playground/ui type-check`

## Verification Guidance

- Token, theme, or export changes: run `lint` and `type-check`.
- Public API or build output changes: also run `build`.

## Architecture Notes

- Keep this package generic and host-agnostic.
- Prefer exporting stable primitives over app-specific styling decisions.
