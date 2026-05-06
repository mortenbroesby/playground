# Agent Skills Tool

`@playground/agent-skills` holds the TypeScript implementation for repo-owned
skill discovery, ranking, routing, and metadata checks.

## Available entrypoints

- `src/cli.ts` (`skills` command surface)
- `src/hooks/skills-metadata-hook.ts` (pre-commit / pre-push registry guard)
- `tests/skills-smoke.test.ts` (command and policy smoke checks)

## Runtime notes

- Root scripts in `scripts/` are intentionally tiny shims to keep existing
  command names stable.
- The package is strict TypeScript and can be executed through `node --experimental-strip-types`
  or built into `dist/` with `pnpm --filter @playground/agent-skills run build`.

## Local commands

- `pnpm --filter @playground/agent-skills run cli -- list`
- `pnpm --filter @playground/agent-skills run cli -- search workflow`
- `pnpm --filter @playground/agent-skills run smoke`
- `pnpm --filter @playground/agent-skills run metadata-hook -- --auto-range`

