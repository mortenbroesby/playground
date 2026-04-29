---
id: "prototype-dynamic-grill-agent-for-selective-context-loading"
type: "todo"
repo_slug: "playground"
title: "Prototype dynamic grill agent for selective context loading"
status: "done"
created: "2026-04-30"
updated: "2026-04-30"
owner: "morten"
summary: "A lightweight `pnpm skills:route` classifier now recommends a narrow skill and rule set so the main agent only pays for task-relevant context."
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

A bootstrap decision layer now classifies a task, keeps `repo-workflow` plus
`skill-routing` as the hot baseline, and selectively recommends only the
additional skills and path-scoped rules the task actually needs.

## Landed

- added `pnpm skills:route "<task>"` as a cheap bootstrap classifier
- kept the implementation as a local state machine instead of a new always-on
  hook or agent
- left deeper rule-slimming and skill-load auditing for post-merge follow-up
