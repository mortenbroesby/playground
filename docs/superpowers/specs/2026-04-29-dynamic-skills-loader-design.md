# OpenSkills Adoption For Repo Skills

**Date:** 2026-04-29
**Status:** Proposed
**Scope:** repo-level agent workflow, `AGENTS.md`, `.agents/skills`,
agent-facing symlinked skill paths, OpenSkills adoption and adaptation

## Decision

Adopt [OpenSkills](https://github.com/numman-ali/openskills) as the base skill
loader for this repo instead of building a bespoke dynamic loader from scratch.

The repo should add only the thinnest project-specific adaptation needed to
preserve its current skill contract:

- `.agents/skills` remains the canonical repo-owned skill store
- `.claude/skills`, `.codex/skills`, `.github/skills`, and `.opencode/skills`
  remain symlinked to `.agents/skills`
- `AGENTS.md` remains the repo discovery surface for progressive disclosure

## Why This Direction

OpenSkills already provides the lifecycle this repo needs:

- install from GitHub, local paths, and private git URLs
- list installed skills
- read a skill on demand
- sync `AGENTS.md`
- update and remove installed skills
- keep the `SKILL.md` format compatible with Claude-style skills

That means the remaining work is not a new loader. It is integration work:
aligning OpenSkills with this repo's canonical `.agents/skills` layout and
existing multi-agent symlink policy.

## Problem

This repo currently assumes skills already exist on disk and are shared through
a fixed filesystem layout:

- `.agents/skills` is the repo-owned canonical skill directory
- `.claude/skills`, `.codex/skills`, `.github/skills`, and `.opencode/skills`
  are symlinked to that directory
- `scripts/agent-setup-check.mjs` enforces the directory and symlink contract

That setup works for checked-in first-party skills, but external skill install
and sync are still manual. The repo lacks a standard flow to:

1. install third-party skills
2. refresh them later
3. expose them consistently in `AGENTS.md`
4. keep repo-owned skills and installed skills from colliding silently

## Objective

Integrate OpenSkills into this repo so skill installation and progressive
disclosure work out of the box without changing the current `.agents/skills`
plus symlink contract.

## Design Goals

- Use OpenSkills rather than reimplementing its core lifecycle.
- Preserve `.agents/skills` as the canonical project skill store.
- Keep current symlink-based multi-agent compatibility intact.
- Preserve progressive disclosure through `AGENTS.md` plus on-demand `read`.
- Make third-party installs explicit and reversible.
- Protect checked-in first-party repo skills from accidental overwrite or
  removal.
- Keep repo usage `pnpm`-native even if OpenSkills is invoked under the hood.

## Non-Goals

- Replacing the current symlink layout with runtime-specific skill stores
- Building a new standalone skill loader for general reuse
- Building an MCP server for skills
- Changing the `SKILL.md` format
- Solving global cross-repo skill management in v1

## Proposed Integration Model

The repo adopts OpenSkills in one of two ways:

1. prefer thin wrapper scripts that call OpenSkills with repo-specific paths
2. fork or vendor only if OpenSkills cannot cleanly target `.agents/skills`
   and this repo's sync rules

The default assumption should be wrappers first, fork second.

## Repo UX

Expose repo-native commands through `pnpm` scripts.

### Install

```bash
pnpm skills:install <source>
```

Examples:

```bash
pnpm skills:install anthropics/skills
pnpm skills:install git@github.com:org/private-skills.git
pnpm skills:install ./local-skills/my-skill
```

Behavior:

- installs via OpenSkills
- targets the repo's canonical skill directory, not a runtime-specific default
- rejects collisions with protected first-party skills unless an explicit
  override path is defined
- leaves agent-facing symlinks unchanged

### Read

```bash
pnpm skills:read <skill-name>
```

Behavior:

- resolves the installed skill by name
- prints the `SKILL.md` body and base directory for bundled resources
- preserves progressive disclosure
- this on-demand read path is a definition-of-done requirement, not an optional
  convenience

### List

```bash
pnpm skills:list
```

Behavior:

- shows installed skill names
- shows whether the skill is repo-owned or externally installed
- shows provenance when OpenSkills metadata supports it

### Sync

```bash
pnpm skills:sync
```

Behavior:

- updates the managed skills block in `AGENTS.md`
- keeps surrounding repo instructions untouched
- points agents to `pnpm skills:read <skill-name>` as the preferred load path

### Update

```bash
pnpm skills:update [skill-name...]
```

Behavior:

- refreshes third-party skills with tracked sources
- does not rewrite protected repo-owned skills

### Remove

```bash
pnpm skills:remove <skill-name...>
```

Behavior:

- removes third-party installed skills
- refuses to delete checked-in first-party skills by default

## Canonical Storage

`.agents/skills` remains the only canonical project skill store.

This repo should not switch to `.claude/skills` or `.agent/skills` as the
canonical source of truth because:

- `scripts/agent-setup-check.mjs` already enforces `.agents/skills`
- multiple agent-facing directories already symlink to that location
- the repo's contract is broader than Claude compatibility alone

If OpenSkills cannot target `.agents/skills` directly, the repo should add a
small adapter layer rather than changing the storage contract.

## AGENTS.md Sync Model

`AGENTS.md` should continue to expose a managed skills block for discovery.

The exact block format can stay OpenSkills-compatible as long as repo-owned
instructions around it remain intact.

Requirements:

- only the managed block is rewritten
- surrounding repo-specific instructions remain untouched
- checked-in and installed skills both appear if present
- the usage text should prefer `pnpm skills:read <skill-name>` unless there is
  a strong reason to expose raw `npx openskills read`

## Protection Rules

The repo has first-party skills checked into `.agents/skills` today. Adopting
OpenSkills should not make those easier to overwrite accidentally.

Minimum protection rules:

- distinguish repo-owned checked-in skills from third-party installed skills
- reject name collisions by default
- refuse removal of checked-in skills by default
- make forceful replacement an explicit operator action

These protections can be implemented in wrapper scripts if OpenSkills does not
already expose the exact policy needed.

## Implementation Options

### Option A: Thin Wrapper Around OpenSkills

Add repo scripts such as:

- `scripts/skills/install.mjs`
- `scripts/skills/read.mjs`
- `scripts/skills/list.mjs`
- `scripts/skills/sync.mjs`

Those scripts would:

- call OpenSkills
- normalize paths to `.agents/skills`
- layer in first-party protection rules
- keep the repo's `pnpm` command surface stable

This is the preferred first slice.

### Option B: Fork Or Vendor OpenSkills

Use this only if wrapper-based integration cannot cleanly support:

- `.agents/skills` as the canonical store
- managed-block-only `AGENTS.md` sync
- checked-in skill protection

Forking should be a last resort because it turns a simple integration into a
maintenance surface.

## Recommended First Slice

Build the smallest end-to-end integration slice:

1. prove OpenSkills can install into or be adapted to `.agents/skills`
2. add repo-native `pnpm skills:install`, `skills:read`, `skills:list`, and
   `skills:sync`
3. preserve existing symlink behavior unchanged
4. document how first-party checked-in skills are protected
5. verify `AGENTS.md` sync works without rewriting unrelated repo instructions

Defer `update`, `remove`, and fork decisions until the adapter path is proven.

## Open Questions

1. Can stock OpenSkills target `.agents/skills` directly, or is a wrapper
   mandatory?
2. Does OpenSkills already provide enough provenance metadata to distinguish
   repo-owned skills from installed third-party skills cleanly?
3. Can OpenSkills sync only a managed block inside `AGENTS.md`, or will the
   repo need a post-processing step?
4. Should installed third-party skills be committed to this repo by default, or
   treated as local workspace state unless explicitly promoted?
5. If first-party and third-party skills share the same directory, what is the
   simplest durable way to mark ownership?

## Acceptance Criteria

- The repo uses OpenSkills as the base skill lifecycle instead of a bespoke
  loader.
- `.agents/skills` remains the canonical skill store.
- Existing agent-facing symlinks continue to work unchanged.
- `AGENTS.md` exposes installed skills through a managed discovery block.
- Agents can load skills on demand with `pnpm skills:read <skill-name>`, and
  that path is verified as part of the integration rather than deferred.
- Checked-in first-party skills and third-party installed skills can coexist
  without silent overwrite or accidental removal.

## Verification

Manual checks for the first integration slice:

```bash
pnpm skills:install anthropics/skills
pnpm skills:list
pnpm skills:read skill-creator
pnpm skills:sync
pnpm agents:check
pnpm lint:md
```

Expected outcomes:

- skills resolve through `.agents/skills`
- symlinked agent paths still point to the canonical skill store
- `AGENTS.md` contains the managed available-skills block
- repo-owned instructions in `AGENTS.md` remain intact
- setup checks and markdown lint pass
