---
id: "audit-skill-loading-for-token-overhead"
type: "todo"
repo_slug: "playground"
title: "Audit skill loading for token overhead"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "morten"
summary: "The repo-owned `.skills` surface is large; ensure the routing and loading paths do not preload broad skills or large references unless they are explicitly needed."
tags: []
keywords:
  - "skills"
  - "tokens"
  - "routing"
  - "startup"
links:
  parents: []
  children: []
  related:
    - "mem-20260429-root-skills-architecture"
    - "mem-20260429-use-root-skills-as-canonical-repo-owned-skills-store"
    - "mem-20260429-task-board"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-30"
  expires_after: null
  keep: false
ai_appetite: 80
priority: "P2"
source: "token-cost audit of startup surfaces."
---

## Why

On-demand skills are the right architecture, but they only stay cheap if the
loading path stays narrow and deliberate.

## Outcome

Skill routing that loads one primary skill by default and avoids broad,
incidental loading of large skill or reference trees.
