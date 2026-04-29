---
id: "mem-20260414-ralph-loop-hardening"
type: "session"
repo_slug: "playground"
title: "Ralph Loop Hardening"
status: "done"
created: "2026-04-14"
updated: "2026-04-14"
owner: "agent"
summary: "Hardened the Ralph runner by ignoring local run artifacts and surfacing better failure breadcrumbs."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "ralph"
  - "workflow"
  - "gitignore"
  - "runner"
  - "diagnostics"
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
started_at: "2026-04-14 23:28"
touched_paths:
  - ".gitignore"
  - "scripts/ralph/loop.mjs"
---

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
