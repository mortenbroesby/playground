# Copilot instructions for `playground`

## Monorepo expectations

- Use **pnpm** for all package management and script execution.
- Run workspace tasks through **Turborepo** (`pnpm turbo <task>`).
- Prefer small, package-scoped changes over repo-wide edits.

## Preferred commands

- Install deps: `pnpm install`
- Build all: `pnpm turbo build`
- Lint all: `pnpm turbo lint && pnpm lint:md`
- Type-check all: `pnpm turbo type-check`

## Code conventions

- Keep TypeScript strict and avoid `any` unless justified.
- Reuse shared config packages in `packages/config` when adding workspaces.
- Keep README updates concise and command-focused.
