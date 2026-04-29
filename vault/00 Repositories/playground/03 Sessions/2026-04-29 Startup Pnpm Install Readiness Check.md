# Startup Pnpm Install Readiness Check

## Summary

The session-start hook now checks whether `pnpm install` appears to have been
run before trying to bootstrap repo tooling.

## What Changed

- `.agents/hooks/session-start.mjs` now checks for:
  - `node_modules/`
  - `node_modules/.bin/astrograph`
  - `tools/obsidian-memory/node_modules/`
- If those install artifacts are missing, startup context now tells the agent
  to run `pnpm install`.
- The hook also skips Astrograph watch and observability bootstrap when the
  install is incomplete, instead of attempting a broken startup path.

## Why

Codex currently depends on both Astrograph and Obsidian-related local
dependencies. Without `pnpm install`, the repo can look superficially valid
while key tooling is unusable.

## Verification

- `node --check .agents/hooks/session-start.mjs`
- `pnpm agents:check`
- `pnpm lint:md`
