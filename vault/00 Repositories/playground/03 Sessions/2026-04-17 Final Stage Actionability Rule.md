---
type: repo-session
repo: playground
date: 2026-04-17
started_at: 2026-04-17 19:40
summary: Added an always-on final-stage workflow rule that tells agents to end on a concrete action or a textual y-or-Enter default instead of optional prose.
keywords:
  - workflow
  - agent rules
  - codex
  - approval
  - actionability
touched_paths:
  - .agents/rules/repo-workflow.md
tags:
  - type/session
  - repo/playground
---

# Final Stage Actionability Rule

## Outcome

Added a repo workflow rule for the final stage of a task:

- do not end on soft optional phrasing
- prefer taking the next concrete action directly
- when confirmation is needed, use a textual `y` or `Enter` default for the
  recommended action
- keep one clear `n` escape hatch

## Why

The prior pattern of ending with "if you want, I can..." left too many turns
half-finished. The new rule makes the closing loop more operational and matches
the interaction pattern that actually works in this interface.
