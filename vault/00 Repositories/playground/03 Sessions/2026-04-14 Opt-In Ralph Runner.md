---
type: repo-session
repo: playground
date: 2026-04-14
started_at: 2026-04-14 22:25
summary: Added a separate opt-in Ralph runner inspired by snarktank/ralph without replacing the existing planning skill.
keywords:
  - ralph
  - codex
  - claude
  - automation
  - prd
touched_paths:
  - scripts/ralph/init.mjs
  - scripts/ralph/loop.mjs
  - scripts/ralph/prompt.md
  - package.json
  - docs/ralph-runner.md
  - docs/README.md
tags:
  - type/session
  - repo/playground
---

# Opt-In Ralph Runner

## Outcome

Added a separate autonomous Ralph runner under `scripts/ralph/` while keeping
the existing `ralph-plan` shared command and skill intact.

The runner manages:

- `prd.json`
- `progress.txt`
- prompt generation for the next pending story
- optional execution via `codex`, `claude`, or a custom command

## Key Differences From `snarktank/ralph`

- opt-in script, not a replacement for the repo's planning prompt
- no plugin scaffolding
- no dangerous bypass flags
- no automatic branch switching
- no automatic commits unless `--auto-commit` is passed
- continues to rely on repo-native rules, docs, hooks, and memory

## Commands

- `pnpm ralph:init`
- `pnpm ralph:loop`
