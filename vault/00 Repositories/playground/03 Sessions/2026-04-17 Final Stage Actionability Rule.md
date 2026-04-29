---
id: "mem-20260417-final-stage-actionability-rule"
type: "session"
repo_slug: "playground"
title: "Final Stage Actionability Rule"
status: archived
created: "2026-04-17"
updated: "2026-04-17"
owner: "agent"
summary: "Added an always-on final-stage workflow rule that tells agents to end on a concrete action or a textual y-or-Enter default instead of optional prose."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "workflow"
  - "agent rules"
  - "codex"
  - "approval"
  - "actionability"
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-01"
  expires_after: "2026-10-14"
  keep: false
started_at: "2026-04-17 19:40"
touched_paths:
  - ".agents/rules/repo-workflow.md"
---

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
