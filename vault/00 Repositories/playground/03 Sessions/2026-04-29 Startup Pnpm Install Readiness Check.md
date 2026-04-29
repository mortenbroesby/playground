---
id: "mem-20260429-startup-pnpm-install-readiness-check"
type: "session"
repo_slug: "playground"
title: "Startup Pnpm Install Readiness Check"
status: "active"
created: "2026-04-29"
updated: "2026-04-29"
owner: "agent"
summary: "The session-start hook now checks whether `pnpm install` appears to have been run before trying to bootstrap repo tooling."
tags: []
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-13"
  expires_after: "2026-10-26"
  keep: false
---

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
