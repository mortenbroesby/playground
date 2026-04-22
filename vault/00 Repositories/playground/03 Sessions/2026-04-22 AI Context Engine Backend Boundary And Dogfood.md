# AI Context Engine Backend Boundary And Dogfood

## Summary

Introduced an internal index-backend boundary for `tools/ai-context-engine`
while keeping SQLite as the current implementation, and updated shared agent
workflow docs so the engine is the repo-owned default for code retrieval.

## What Changed

- added `src/index-backend.ts` to define the internal backend connection and
  statement contract
- added `src/sqlite-backend.ts` to hold the current SQLite implementation behind
  that contract
- rewired `src/storage.ts` to depend on the backend interface instead of direct
  `node:sqlite` types
- exposed `storageBackend` in diagnostics so the active backend is explicit in
  the runtime contract
- clarified in the README that repo-root `.ai-context-engine/` artifacts are
  runtime state, while package build output stays in
  `tools/ai-context-engine/dist/`
- updated shared agent docs to use `ai-context-engine` for code retrieval,
  `obsidian-memory` for durable repo memory, and `jcodemunch` as the deeper
  reference-style fallback

## Why

- SQLite still works for MVP, but it should be an internal backend, not the
  whole architecture
- repo-root engine artifacts need to stay explicit because they are what agents
  and humans can inspect across runs
- if we want to dogfood the engine, it has to appear in normal repo workflow
  guidance instead of living only as an optional local tool
- Obsidian memory solves a different problem and should remain separate from the
  code retrieval engine

## Verification

- `pnpm --filter @playground/ai-context-engine type-lint`
- `pnpm --filter @playground/ai-context-engine build`
- `pnpm --filter @playground/ai-context-engine test`
- `pnpm agents:check`
- `pnpm exec markdownlint-cli2 AGENTS.md .agents/rules/repo-workflow.md .agents/skills/context-engineering/SKILL.md .agents/skills/engineering-workflow/SKILL.md tools/ai-context-engine/README.md 'vault/00 Repositories/playground/03 Sessions/2026-04-22 AI Context Engine Backend Boundary And Dogfood.md'`
