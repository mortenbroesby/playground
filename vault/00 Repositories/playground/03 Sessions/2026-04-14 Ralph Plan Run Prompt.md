---
id: "mem-20260414-ralph-plan-run-prompt"
type: "session"
repo_slug: "playground"
title: "Ralph Plan Run Prompt"
status: "done"
created: "2026-04-14"
updated: "2026-04-14"
owner: "agent"
summary: "Updated the Ralph planning prompt so plan mode asks whether to run the loop after generating the plan."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "ralph"
  - "planning"
  - "workflow"
  - "prompts"
  - "agents"
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
started_at: "2026-04-14 23:15"
touched_paths:
  - ".agents/skills/ralph-plan/SKILL.md"
  - ".agents/commands/ralph-plan.md"
---

## Outcome

Updated the shared Ralph planning surfaces so they no longer end at "here is
the command."

The finalized planning flow should now:

- emit the completed Ralph command
- emit the matching `pnpm ralph:loop -- ...` invocation when possible
- ask the user whether they want to run the loop now

## Why

The previous prompt made plan mode stop too early. For an opt-in runner, the
next useful step is an explicit handoff question about executing the loop.

## Notes

- This keeps Ralph opt-in.
- The change is prompt-level behavior, not automation.
