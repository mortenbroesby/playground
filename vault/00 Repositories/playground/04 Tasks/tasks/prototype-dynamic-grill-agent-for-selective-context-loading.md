---
id: "prototype-dynamic-grill-agent-for-selective-context-loading"
type: "todo"
repo_slug: "playground"
title: "Prototype dynamic grill agent for selective context loading"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "morten"
summary: "Explore a lightweight bootstrap or grill agent that decides which repo rules, references, and skills to load so the main agent only pays for task-relevant context."
tags: []
keywords:
  - "agents"
  - "tokens"
  - "skills"
  - "rules"
  - "routing"
  - "bootstrap"
links:
  parents: []
  children: []
  related:
    - "slim-always-applied-agent-rules"
    - "audit-skill-loading-for-token-overhead"
    - "mem-20260429-agent-rules"
    - "mem-20260429-root-skills-architecture"
    - "mem-20260429-task-board"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-30"
  expires_after: null
  keep: false
ai_appetite: 90
priority: "P1"
source: "follow-up idea from token-cost cleanup: use a routing or grill layer so agents load only the rules and skills they need."
---

## Why

Always-applied rules and broad skill discovery still create a startup tax even
after slimming the obvious hotspots.

## Outcome

A bootstrap decision layer that can classify the task, load one narrow default
rule set, and then selectively pull in only the skills or colder references
that the current task actually needs.

## Notes

- Start with a simple state machine or decision tree, not a heavyweight
  planner.
- Keep the bootstrap layer cheap enough that it saves more context than it
  costs.
- Define how it interacts with `AGENTS.md`, always-applied rules, and
  `pnpm skills:read`.
