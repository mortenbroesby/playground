---
id: "reduce-session-start-hook-token-footprint"
type: "todo"
repo_slug: "playground"
title: "Reduce session-start hook token footprint"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "morten"
summary: "The session-start hook currently injects policy, git state, install readiness, and watch/observability status into every session; shrink it to the minimum useful default context."
tags: []
keywords:
  - "tokens"
  - "hooks"
  - "session-start"
  - "context"
links:
  parents: []
  children: []
  related:
    - "mem-20260429-agent-hooks"
    - "mem-20260429-task-board"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-30"
  expires_after: null
  keep: false
ai_appetite: 95
priority: "P1"
source: "token-cost audit of startup surfaces."
---

## Why

The session-start hook adds context on every session, so unnecessary lines here
are paid repeatedly even when they are irrelevant to the task.

## Outcome

A smaller default startup context that keeps only the minimum useful state and
surfaces extra diagnostics only when something is broken or explicitly needed.
