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

Define the target architecture and migration boundaries for moving repo-owned
skills out of startup-loaded adapter surfaces and into a truly on-demand root
`.skills` model.

## Decision

Repo-owned first-party skills should move to a root `.skills/` directory.

Startup-facing surfaces such as `AGENTS.md`, `CLAUDE.md`, `.agents/skills/`,
and runtime adapter directories should stop being the source of truth for
repo-owned skill content. They should provide only thin routing context.

The catalog should move from startup-loaded markdown to a command-first
discovery surface. The durable target is:

- `pnpm skills:list`
- `pnpm skills:search`
- `pnpm skills:read <skill-name>`

The full `SKILL.md` body should load only when an agent or human explicitly
reads a skill.

## Why Change

The current model mixes two roles into startup-loaded surfaces:

- bootstrap and routing guidance
- the skill catalog and sometimes the skill source itself

That creates avoidable startup weight and makes repo-owned skills look like
always-loaded instructions instead of optional on-demand context.

The repo wants the opposite model:

- thin startup bootstrap
- command-first discovery
- explicit reads for full skill bodies

## Current State To Replace

Today the repo still assumes:

- `.agents/skills/` is the canonical repo-owned skill store
- `.claude/skills`, `.codex/skills`, `.github/skills`, and `.opencode/skills`
  are adapter paths tied to that store
- `AGENTS.md` can carry a large generated skills catalog
- `scripts/skills.mjs` and `scripts/agent-setup-check.mjs` enforce the
  adapter-centric layout

That shape is the baseline to migrate away from, not the desired end state.

## Target Boundaries

### Canonical first-party source

- Root `.skills/` becomes the only canonical checked-in home for repo-owned
  skills.
- Each skill keeps the existing folder contract:
  a skill directory with `SKILL.md` plus optional `references/`, `scripts/`,
  or `assets/`.
- Repo-owned skill names are owned by the repo and must not be silently
  replaced by external installs.

### Startup surfaces

- `AGENTS.md` stays a thin bootstrap.
- `CLAUDE.md` stays a thin runtime adapter.
- Startup docs may say where skills live and how to list, search, and read
  them.
- Startup docs should not embed the full repo skill catalog or full skill
  bodies.
- Routing heuristics belong in a small rule file, not in a long startup
  catalog.

### Adapter directories

- Runtime adapter directories are compatibility surfaces, not authoring homes.
- `.agents/skills/` should no longer be the source of truth for repo-owned
  skills after migration.
- If compatibility shims remain temporarily, they should stay thin and must not
  reintroduce duplicated skill bodies or large startup-loaded catalogs.

### Discovery and loading

- The command surface becomes the catalog.
- `list` and `search` answer discovery questions without loading every skill
  body into startup context.
- `read` loads one selected skill on demand.
- Repo-owned skill discovery should not depend on a generated `AGENTS.md`
  skills table.

### External skills

- External downloaded skills are not part of the checked-in `.skills/` source.
- They must stay clearly separated from repo-owned first-party skills.
- Their exact runtime path and lifecycle remain an explicit follow-up decision
  for `STORY-5`.

## Migration Invariants

- Keep the `SKILL.md` format unchanged.
- Keep the repo command surface `pnpm`-native.
- Do not require agents to load a large skill catalog at session start.
- Preserve a single obvious place to read a chosen skill on demand.
- Keep repo-owned and externally installed skills distinguishable.
- Avoid duplicating canonical skill content across startup adapters.

## Story Boundaries

### STORY-1

- Define this target architecture and its boundaries.
- Create the root `.skills/` landing zone.
- Do not move existing skills yet.
- Do not slim startup adapters yet.
- Do not finalize external skill storage yet.

### STORY-2

- Move repo-owned checked-in skills from `.agents/skills/` to `.skills/`.
- Update scripts and checks that still treat `.agents/skills/` as canonical.

### STORY-3

- Make discovery command-first and on-demand.
- Add or adapt the command surface so catalog discovery comes from commands,
  not startup docs.

### STORY-4

- Slim `AGENTS.md` and `CLAUDE.md`.
- Add a lightweight skill-routing rule instead of a startup-loaded catalog.

### STORY-5

- Decide where external downloaded skills live and how they relate to
  repo-owned `.skills/`.

## Non-Goals For This Story

- Finishing the runtime adapter migration
- Rewriting every existing skill path in one pass
- Solving global or user-level skill installation
- Designing a new skill file format
