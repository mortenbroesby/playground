---
id: "mem-20260429-root-skills-architecture"
type: "architecture-record"
repo_slug: "playground"
title: "Root Skills Architecture"
status: "proposed"
created: "2026-04-29"
updated: "2026-04-29"
owner: "morten"
summary: "Proposed root `.skills` architecture for repo-owned skills, with command-first discovery and thin startup routing."
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
content. `AGENTS.md`, `CLAUDE.md`, `.agents/skills/`, and runtime adapters
should stay thin and route users to a command-first discovery surface:

- `pnpm skills:list`
- `pnpm skills:search`
- `pnpm skills:read <skill-name>`

Load full `SKILL.md` bodies only on explicit read.

## Why Change

The current model mixes bootstrap guidance with catalog content. The target
model is thin startup bootstrap, command-first discovery, and explicit reads.

## Target Boundaries

- Root `.skills/` becomes the home for repo-owned skills.
- Each skill keeps the current contract: `SKILL.md` plus optional support files.
- `AGENTS.md` and `CLAUDE.md` stay thin and should not embed the full catalog.
- Runtime adapter directories are compatibility surfaces, not authoring homes.
- `list` and `search` handle discovery; `read` loads one chosen skill on demand.
- External downloaded skills stay separate from repo-owned first-party skills.

## Migration Invariants

- Keep `SKILL.md` unchanged.
- Keep the command surface `pnpm`-native.
- Do not require large startup catalogs.
- Preserve one obvious place to read a chosen skill.
- Keep repo-owned and external skills distinguishable.
- Avoid duplicated canonical content across adapters.

## Story Boundaries

- `STORY-1`: define the architecture and create the root `.skills/` landing zone.
- `STORY-2`: move repo-owned checked-in skills into `.skills/`.
- `STORY-3`: make discovery command-first and on-demand.
- `STORY-4`: slim startup docs and add lightweight routing rules.
- `STORY-5`: decide where external downloaded skills live.

## Non-Goals For This Story

- Finishing the full adapter migration
- Rewriting every skill path in one pass
- Solving global or user-level installation
- Designing a new skill file format
