# @playground/types

Shared TypeScript contracts for the host and mounted workspace surfaces.

## Current scope

The package currently exports the shared todo-domain `Todo` type from
`src/index.ts`.

## Commands

- `pnpm --filter @playground/types build`
- `pnpm --filter @playground/types lint`
- `pnpm --filter @playground/types type-check`

## Notes

- Keep shared contracts explicit and small.
- Avoid moving app-local implementation details into this package.
