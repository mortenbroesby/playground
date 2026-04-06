# Agent instructions (`playground`)

## Quick start

1. `pnpm install`
2. `pnpm turbo lint && pnpm lint:md`
3. `pnpm turbo type-check`

## Repo constraints

- Use `pnpm` only (no npm/yarn commands in docs, hooks, or scripts).
- Keep changes scoped to the relevant workspace.
- Prefer deterministic scripts over ad-hoc shell pipelines.
