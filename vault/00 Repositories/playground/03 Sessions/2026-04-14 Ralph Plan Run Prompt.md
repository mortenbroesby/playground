---
type: repo-session
repo: playground
date: 2026-04-14
started_at: 2026-04-14 23:15
summary: Updated the Ralph planning prompt so plan mode asks whether to run the loop after generating the plan.
keywords:
  - ralph
  - planning
  - workflow
  - prompts
  - agents
touched_paths:
  - .agents/skills/ralph-plan/SKILL.md
  - .agents/commands/ralph-plan.md
tags:
  - type/session
  - repo/playground
---

# Ralph Plan Run Prompt

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
