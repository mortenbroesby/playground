# @playground/ui

Shared React UI primitives, tokens, and theme assets for the workspace.

## What it contains

- reusable components such as `Button`, `Badge`, `Input`, `Panel`, and
  `MetricCard`
- design-system token metadata in `src/tokens.ts`
- shared theme styles exported as `@playground/ui/theme.css`

## Commands

- `pnpm --filter @playground/ui build`
- `pnpm --filter @playground/ui lint`
- `pnpm --filter @playground/ui type-check`

## Notes

- Keep this package host-agnostic.
- Prefer reusable primitives over app-specific composition.
