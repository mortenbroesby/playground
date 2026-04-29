---
id: "mem-20260414-opt-in-ralph-runner"
type: "session"
repo_slug: "playground"
title: "Opt-In Ralph Runner"
status: archived
created: "2026-04-14"
updated: "2026-04-14"
owner: "agent"
summary: "Added a separate opt-in Ralph runner inspired by snarktank/ralph without replacing the existing planning skill."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "ralph"
  - "codex"
  - "claude"
  - "automation"
  - "prd"
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-04-28"
  expires_after: "2026-10-11"
  keep: false
started_at: "2026-04-14 22:25"
touched_paths:
  - "scripts/ralph/init.mjs"
  - "scripts/ralph/loop.mjs"
  - "scripts/ralph/prompt.md"
  - "package.json"
  - "docs/ralph-runner.md"
  - "docs/README.md"
---

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
