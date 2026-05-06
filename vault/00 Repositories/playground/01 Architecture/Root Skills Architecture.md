---
id: "mem-20260429-root-skills-architecture"
type: "architecture-record"
repo_slug: "playground"
title: "Root Skills Architecture"
status: "accepted"
created: "2026-04-29"
updated: "2026-05-06"
owner: "morten"
summary: "Root `.skills` is the canonical repo-owned skill store, with frontmatter-authored metadata feeding a generated registry for discovery, routing, source-backed reads, and thin startup bootstrap."
tags:
  - "type/architecture"
  - "repo/playground"
keywords:
  - "skills"
  - "on-demand"
  - "architecture"
  - "agents"
  - "startup"
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-10-26"
  expires_after: null
  keep: true
---

## Intent

Define the migration target for moving repo-owned skills into an on-demand root
`.skills` model.

## Decision

Repo-owned first-party skills should move to a root `.skills/` directory, and
startup-facing surfaces should stop being the source of truth for skill
content. `AGENTS.md`, `CLAUDE.md`, and runtime adapters should stay thin and
point to a registry-backed discovery surface. The generated registry owns
machine-readable discovery and routing for `list`, `search`, and `route`;
`read` stays source-backed and loads one chosen `SKILL.md` body on demand.

The machine-readable discovery layer should not be reconstructed from raw skill
prose on every command invocation. Instead, skill frontmatter should act as the
canonical metadata contract and feed `.skills/registry.generated.json`, the
deterministic generated registry artifact that command surfaces can consume.

## Why Change

The current model mixes bootstrap guidance with catalog content. The target
model is thin startup bootstrap, registry-backed discovery, and explicit
source-backed reads.

## Target Boundaries

- Root `.skills/` becomes the home for repo-owned skills.
- Each skill keeps the current contract: `SKILL.md` plus optional support files.
- `SKILL.md` frontmatter becomes the canonical metadata source for discovery and
  routing fields such as `name`, `description`, `tags`, `triggers`,
  `anti_triggers`, and `routing_weight`.
- `.skills/registry.generated.json` becomes the deterministic machine-readable
  registry artifact derived from that frontmatter.
- `AGENTS.md` and `CLAUDE.md` stay thin and should not embed the full catalog.
- Runtime adapter directories are compatibility surfaces, not authoring homes.
- `list`, `search`, and `route` should consume the generated registry rather
  than re-deriving metadata ad hoc from raw markdown prose; `read` still loads
  one chosen skill on demand from source.
- Routing heuristics should live in skill frontmatter, the generated registry,
  and `.agents/rules/skill-routing.md`, not in repeated startup-facing docs.
- External downloaded skills stay separate from repo-owned first-party skills.

## Migration Invariants

- Keep `SKILL.md` unchanged.
- Keep the `pnpm skills:*` surface thin and registry-backed.
- Do not require large startup catalogs.
- Preserve one obvious place to read a chosen skill.
- Keep repo-owned and external skills distinguishable.
- Avoid duplicated canonical content across adapters.
- Keep the generated registry deterministic and cheap to rebuild.

## Non-Goals For This Story

- Finishing the full adapter migration
- Rewriting every skill path in one pass
- Solving global or user-level installation
- Designing a new skill file format
