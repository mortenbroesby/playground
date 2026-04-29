---
id: "slim-always-applied-agent-rules"
type: "todo"
repo_slug: "playground"
title: "Slim always-applied agent rules"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "morten"
summary: "The always-applied rules stack is useful but larger than necessary; move more material into cold references and keep the startup rule layer minimal."
tags: []
keywords:
  - "rules"
  - "tokens"
  - "startup"
  - "agents"
links:
  parents: []
  children: []
  related:
    - "mem-20260429-agent-rules"
    - "mem-20260429-task-board"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-30"
  expires_after: null
  keep: false
ai_appetite: 85
priority: "P2"
source: "token-cost audit of startup surfaces."
---

## Why

Rules that are always loaded should be shorter and more stable than references
or migration notes.

## Outcome

A compact always-applied rule layer with larger explanations moved into
optional reference files.
