---
id: "mem-20260429-use-root-skills-as-canonical-repo-owned-skills-store"
type: "architecture-record"
repo_slug: "playground"
title: "Use Root Skills As Canonical Repo-Owned Skills Store"
status: "accepted"
created: "2026-04-29"
updated: "2026-04-29"
owner: "morten"
summary: "Use root `.skills/` as the canonical checked-in store for repo-owned skills and keep startup adapters thin and on-demand."
tags:
  - "type/decision"
  - "repo/playground"
keywords:
  - "skills"
  - ".skills"
  - "agents"
  - "on-demand"
links:
  parents: []
  children: []
  related:
    - "mem-20260429-root-skills-on-demand-migration"
    - "mem-20260429-root-skills-architecture"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-10-26"
  expires_after: null
  keep: true
decided_on: "2026-04-29"
decision_id: "DEC-2026-04-29-root-skills-canonical-store"
related_paths:
  - ".skills"
  - "AGENTS.md"
  - "scripts/skills.mjs"
  - "scripts/agent-setup-check.mjs"
---

Repo-owned skills live canonically in root `.skills/`.

Startup-facing surfaces such as `AGENTS.md` and runtime-specific adapters stay
thin and should route users toward command-first discovery like
`pnpm skills:list`, `pnpm skills:search`, and `pnpm skills:read`.

The repo should not reintroduce duplicated skill bodies or runtime-specific
`*/skills` trees as authoring homes for checked-in skills.
