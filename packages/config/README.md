# @playground/config

Shared config umbrella for reusable workspace tooling presets.

## Packages

- `@playground/eslint-config` exposes the shared base ESLint config from
  `packages/config/eslint/base.js`
- `@playground/tsconfig` exposes the shared TypeScript presets from
  `packages/config/tsconfig/*.json`

## Commands

This workspace is config-only, so verification runs through consumers instead of
package-local scripts.

- `pnpm --filter @playground/host type-check`
- `pnpm --filter @playground/host lint`
- `pnpm --filter @playground/todo-app type-check`
- `pnpm --filter @playground/todo-app lint`

## Notes

- Keep preset changes narrow and compatible across consuming workspaces.
- Update the matching workspace docs when setup expectations change.
