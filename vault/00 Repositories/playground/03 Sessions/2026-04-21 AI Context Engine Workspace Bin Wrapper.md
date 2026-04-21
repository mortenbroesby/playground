---
type: repo-session
repo: playground
date: 2026-04-21
started_at: 2026-04-21 21:47
branch: feat/ai-context-engine-phase2-watch
summary: Added a workspace bin wrapper for `@playground/ai-context-engine`, documented the shorter invocation path, and aligned local Codex hook configuration in the repo.
keywords:
  - ai-context-engine
  - cli
  - workspace-bin
  - codex-hooks
  - pnpm
touched_paths:
  - package.json
  - .codex/config.toml
  - .codex/hooks.json
  - packages/ai-context-engine/package.json
  - packages/ai-context-engine/scripts/ai-context-engine.mjs
  - packages/ai-context-engine/tests/interface.test.ts
  - packages/ai-context-engine/README.md
tags:
  - type/session
  - repo/playground
---

# AI Context Engine Workspace Bin Wrapper

## Summary

Added a package-level `bin` entry for `@playground/ai-context-engine` so the
repo can invoke the engine through `pnpm exec ai-context-engine ...` instead of
always routing through filtered workspace scripts.

The same slice also checked in repo-local Codex hook configuration so the
shared jcodemunch-first guardrails and post-edit indexing policy are available
from the repo itself.

## What Changed

- added `packages/ai-context-engine/scripts/ai-context-engine.mjs` as a thin
  Node wrapper that forwards `cli` and `mcp` modes to the TypeScript entrypoints
- wired the package `bin` field and root workspace dependency so
  `pnpm exec ai-context-engine ...` resolves locally
- documented the shorter invocation path in the package README
- added interface coverage proving the wrapper can run `cli diagnostics`
- checked in `.codex/config.toml` and `.codex/hooks.json` changes for the repo's
  Codex hook setup

## Verification

- `pnpm exec ai-context-engine cli diagnostics --repo packages/ai-context-engine`
- `pnpm --filter @playground/ai-context-engine type-check`
- `pnpm --filter @playground/ai-context-engine test`

## Notes

This was a packaging and workflow slice, not a behavior change to the engine
itself. The main goal was to make the local interface shorter and keep the repo
hook policy explicit in version control.
