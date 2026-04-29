---
id: "mem-20260430-selective-context-routing-prototype-and-merge-parking"
type: "session"
repo_slug: "playground"
title: "Selective Context Routing Prototype And Merge Parking"
status: "archived"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Prototyped a lightweight selective-context router with `pnpm skills:route`, then parked the broader always-on rule slimming and skill-load audit so `feat/rag-refactor` can merge cleanly."
tags: []
keywords:
  - "skills"
  - "routing"
  - "tokens"
  - "merge"
links:
  parents: []
  children: []
  related:
    - "prototype-dynamic-grill-agent-for-selective-context-loading"
    - "slim-always-applied-agent-rules"
    - "audit-skill-loading-for-token-overhead"
    - "mem-20260429-root-skills-architecture"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-14"
  expires_after: "2026-10-27"
  keep: false
area: "agents"
branch: "feat/rag-refactor"
project: "playground"
---

## Goal

Reduce context-loading overhead without expanding the merge scope more than
necessary.

## Landed

- added `pnpm skills:route "<task>"` as a cheap state-machine classifier for
  selective skill and rule loading
- updated startup-facing docs so the route command is visible without bloating
  `AGENTS.md`
- aligned the shared engineering workflow skill with the `jcodemunch`-first
  retrieval policy

## Parked For Post-Merge

- `slim-always-applied-agent-rules`
- `audit-skill-loading-for-token-overhead`

## Notes

The parked `P2` work is intentionally deferred so the branch can merge without
pulling a larger startup-policy refactor into this PR.
