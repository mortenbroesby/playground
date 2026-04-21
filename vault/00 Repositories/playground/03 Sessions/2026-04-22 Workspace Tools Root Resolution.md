# Workspace Tools Root Resolution

## Summary

Installed `workspace-tools` and replaced brittle repo-root path climbing in root
scripts and Obsidian memory tooling with workspace-aware root discovery.

## What Changed

- added `workspace-tools`
- switched `scripts/agent-setup-check.mjs` to `findProjectRoot(..., "pnpm")`
- switched Obsidian memory scripts to `findProjectRoot(..., "pnpm")`
- switched the `ai-context-engine` CLI benchmark wrapper to
  `findProjectRoot(..., "pnpm")` instead of assuming fixed directory depth

## Why

The moved tool workspaces should not depend on `../..` assumptions to find the
repo root. The workspace manager already knows where the monorepo root is, so
that contract is safer than manual path math.

## Verification

- `pnpm agents:check`
- `pnpm rag:verify`
- `pnpm rag:query --query 'Who owns routing and page composition?' --limit 2 --budget 300`
- `pnpm --filter @playground/obsidian-memory test:retrieval`
- `pnpm --filter @playground/ai-context-engine test -- --run bench/tests/cli.test.ts`
