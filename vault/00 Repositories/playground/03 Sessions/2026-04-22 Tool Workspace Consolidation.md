# Tool Workspace Consolidation

## Summary

Moved the code-context and repo-memory tooling into explicit `tools/*` workspaces so
they can own their scripts, dependencies, and docs without floating entrypoints at
repo root or under `packages/`.

## What Changed

- moved `packages/ai-context-engine` to `tools/ai-context-engine`
- folded `packages/ai-context-engine-bench` into
  `tools/ai-context-engine/bench`
- created `tools/obsidian-memory` for Obsidian/RAG scripts and tests
- moved `tools/agent-setup-check.mjs` to `scripts/agent-setup-check.mjs`
- updated root `package.json` scripts and workspace globs for the new layout
- refreshed path references in specs, tasks, and tool docs

## Why

- `ai-context-engine` is a tool, not a shared runtime package
- the benchmark harness belongs with the engine it measures
- Obsidian memory scripts should live under one package with their own
  `package.json`
- root `scripts/` should hold generic repo scripts such as agent setup checks

## Verification

- `pnpm --filter @playground/obsidian-memory test:retrieval`
- `pnpm rag:verify`
- `pnpm rag:query --query 'Who owns routing and page composition?' --limit 2 --budget 300`
- `pnpm --filter @playground/ai-context-engine type-check`
- `pnpm --filter @playground/ai-context-engine test`
- `pnpm run bench:small` from `tools/ai-context-engine`
- `pnpm agents:check`
- `pnpm exec markdownlint-cli2 tools/ai-context-engine/README.md tools/ai-context-engine/bench/README.md tools/obsidian-memory/README.md`
