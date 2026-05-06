---
id: "mem-20260506-skills-kiss-routing-catalog-simplification"
type: "architecture-record"
repo_slug: "playground"
title: "Skills KISS Routing and Catalog Simplification"
status: "accepted"
created: "2026-05-06"
updated: "2026-05-06"
owner: "morten"
summary: "The repo-owned skills system now uses a reduced `group + tier` policy model, deterministic routing without local usage warmth, a four-skill default core, and no separate human-authored skill-routing rule layer."
tags:
  - "type/architecture"
  - "repo/playground"
  - "skills"
  - "agent-tools"
  - "routing"
keywords:
  - "group"
  - "tier"
  - "skills"
  - "routing"
  - "catalog"
  - "using-superpowers"
links:
  parents: []
  children: []
  related:
    - "mem-20260506-skills-execution-stack-tools-package"
    - "mem-20260429-root-skills-architecture"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-11-06"
  expires_after: null
  keep: true
---

## Intent

Reduce the repo-owned skills system to a smaller, easier-to-reason-about shape
without losing the useful parts of routing and workflow steering.

## Decision

The live skills system now has these properties:

- checked-in skill metadata uses only `tags`, `triggers`, `anti_triggers`,
  `group`, and `tier`
- routing is deterministic and no longer depends on local usage warmth or a
  usage-cache file
- the default visible core is intentionally small
- duplicate or near-duplicate skills were removed instead of being left as
  catalog noise
- the old human-authored `.agents/rules/skill-routing.md` layer is removed;
  routing behavior now belongs in the runtime and generated metadata

The active `tier` values are:

- `daily`
- `normal`
- `quiet`
- `explicit`

The active default core is:

- `debugging-and-error-recovery`
- `engineering-workflow`
- `planning-and-task-breakdown`
- `verification-before-completion`

`using-superpowers` stays in the catalog, but as a support/bootstrap skill
rather than part of the daily visible core.

## Why Change

The prior shape had too many overlapping policy knobs and too many overlapping
skills:

- `daily_driver`
- `agent_benefit`
- `catalog_group`
- `activation_mode`
- usage warmth / recent-usage tie-breaks
- a separate `skill-routing.md` rule layer that had already drifted out of sync

That combination made it harder to understand why a skill surfaced and harder
to keep the routing story coherent.

## Structural Consequences

- `tools/agent-skills` is the runtime home for routing behavior.
- `.skills/.metadata/registry.metadata.json` is the checked-in policy source of
  truth.
- `.skills/.metadata/registry.generated.json` is the generated machine-readable
  routing artifact.
- `AGENTS.md` stays thin and points at `pnpm skills:*` commands rather than a
  hand-maintained routing note.
- `tools/agent-skills/AGENTS.md` is the closest scoped instruction file for the
  runtime package.

## Catalog Consequences

Removed duplicate skills:

- `systematic-debugging`
- `writing-plans`
- `webapp-testing`

Kept overlapping-but-useful skills only when they still represent a distinct
phase or tool surface.

## Invariants

- Keep routing policy in runtime code and registry metadata, not in duplicated
  human-facing rule documents.
- Keep the default visible set deliberately small.
- Prefer removing duplicate skills over maintaining a noisy catalog.
- Keep `dist/` generated and disposable.
- Rebuild the generated registry after metadata or inventory changes.
