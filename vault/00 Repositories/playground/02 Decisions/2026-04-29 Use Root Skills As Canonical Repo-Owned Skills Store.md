---
id: "mem-20260429-use-root-skills-as-canonical-repo-owned-skills-store"
type: "architecture-record"
repo_slug: "playground"
title: "Use Root Skills As Canonical Repo-Owned Skills Store"
status: "accepted"
created: "2026-04-29"
updated: "2026-05-06"
owner: "morten"
summary: "Use root `.skills/` as the canonical checked-in store for repo-owned skills, with a generated registry for discovery and thin startup adapters."
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
thin and should point to the registry-backed `pnpm skills:*` discovery surface
instead of repeating routing heuristics or catalog summaries.

`.skills/registry.generated.json` is the canonical machine-readable discovery
and routing artifact for repo-owned skills. `pnpm skills:list`,
`pnpm skills:search`, and `pnpm skills:route` should consume that registry;
`pnpm skills:read` remains the source-backed step that loads one chosen skill
body on demand.

The registry now also carries the catalog-policy layer:
`daily_driver`, `agent_benefit`, `catalog_group`, and `activation_mode`.
Those fields are the durable explanation for agent-first ordering and routing
biases; startup docs should describe the model, but the generated registry
remains the live catalog.

In practice this means:

- `pnpm skills:list` should default to the curated daily-driver surface
- `pnpm skills:list --all` should expose the broader checked-in catalog
- `pnpm skills:search` and `pnpm skills:route` should remain evidence-first,
  using catalog-policy metadata and lightweight recency only as secondary
  ranking inputs

The repo should not reintroduce duplicated skill bodies or runtime-specific
`*/skills` trees as authoring homes for checked-in skills.
