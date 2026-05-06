# Agent Skills Tool

`@playground/agent-skills` holds the TypeScript implementation for repo-owned
skill discovery, ranking, routing, and metadata checks.

## Available entrypoints

- `src/cli.ts` (`skills` command surface)
- `src/hooks/skills-metadata-hook.ts` (pre-commit / pre-push registry guard)
- `src/skills-smoke.test.ts` (command and policy smoke checks)
- `scripts/skills.mjs` (CLI command shim)
- `scripts/skills-smoke.mjs` (smoke entrypoint)
- `scripts/skills-metadata-hook.mjs` (metadata hook wrapper)

## Runtime notes

- Command surface is now exposed as package run targets so callers can stay in
  one place (`pnpm --filter @playground/agent-skills run ...`).
- The package is strict TypeScript and is compiled to `dist/` for runtime via
  `pnpm --filter @playground/agent-skills run build`.
- Runtime shims and smoke checks execute compiled `dist/` artifacts (no `--experimental-*` node flags).
- Search is metadata-first by default. Source-body fallback is explicit through
  `--content`.
- `skills:search` now uses MiniSearch as the only supported search engine.
  Routing and search both use the same MiniSearch-oriented retrieval surface.
- Query normalization and repo-specific synonym expansion are shared across the
  runtime so retrieval tuning stays consistent.

## Local commands

- From package:
  - `pnpm --filter @playground/agent-skills run agent-skills -- list`
  - `pnpm --filter @playground/agent-skills run agent-skills -- search workflow`
  - `pnpm --filter @playground/agent-skills run agent-skills -- search --content ".finalMessage()"`
  - `pnpm --filter @playground/agent-skills run agent-skills -- route "fix bug"`
  - `pnpm --filter @playground/agent-skills run skills:smoke`
  - `pnpm --filter @playground/agent-skills run skills:bench`
  - `pnpm --filter @playground/agent-skills run skills:metadata-hook -- --auto-range`
