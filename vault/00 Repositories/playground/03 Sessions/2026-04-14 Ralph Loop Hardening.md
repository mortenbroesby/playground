---
type: repo-session
repo: playground
date: 2026-04-14
started_at: 2026-04-14 23:28
summary: Hardened the Ralph runner by ignoring local run artifacts and surfacing better failure breadcrumbs.
keywords:
  - ralph
  - workflow
  - gitignore
  - runner
  - diagnostics
touched_paths:
  - .gitignore
  - scripts/ralph/loop.mjs
tags:
  - type/session
  - repo/playground
---

# Ralph Loop Hardening

## Outcome

Improved the opt-in Ralph runner after real usage exposed avoidable friction.

Changes:

- ignore `.ralph/` by default so local loop runs do not pollute Git status
- print the `last-message` path up front
- print a clearer failure hint when the agent exits non-zero

## Why

The first full loop left untracked `.ralph/` artifacts in the worktree and made
it harder than necessary to find the useful output files when a run stalled or
failed.

## Notes

- This does not change Ralph execution semantics.
- The next larger step is the task-file model under `04 Tasks/`.
