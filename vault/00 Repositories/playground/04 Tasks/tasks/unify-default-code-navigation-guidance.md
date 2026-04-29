---
id: "unify-default-code-navigation-guidance"
type: "todo"
repo_slug: "playground"
title: "Unify default code navigation guidance"
status: "done"
created: "2026-04-30"
updated: "2026-04-30"
owner: "morten"
summary: "Always-applied guidance now keeps `jcodemunch` as the single default code-navigation path and limits `ai-context-engine` to explicit fallback use."
tags: []
keywords:
  - "navigation"
  - "jcodemunch"
  - "ai-context-engine"
  - "agent guidance"
links:
  parents: []
  children: []
  related:
    - "mem-20260425-use-official-mcp-sdk-and-keep-jcodemunch-fallback"
    - "mem-20260429-task-board"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-30"
  expires_after: null
  keep: false
ai_appetite: 85
priority: "P1"
source: "token-cost audit of startup surfaces."
---

## Why

Conflicting default-navigation guidance causes repeated tool-selection
explanations and makes startup context larger than it needs to be.

## Outcome

One clear default code-navigation path, with fallback guidance only where it is
actually needed.
