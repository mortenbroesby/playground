# Dynamic Skills Loader

**Date:** 2026-04-29
**Status:** Proposed
**Scope:** repo-level agent workflow, skill install/sync/read flows, `AGENTS.md`, `.agents/skills`, agent-facing symlinked skill paths

## Problem

This repo assumes skills already exist on disk and are shared through a fixed
filesystem layout:

- `.agents/skills` is the repo-owned canonical skill directory
- `.claude/skills`, `.codex/skills`, `.github/skills`, and `.opencode/skills`
  are symlinked to that directory
- `scripts/agent-setup-check.mjs` enforces the directory and symlink contract

That setup works for checked-in skills, but it does not provide a repo-native
way to:

1. Install skills from GitHub, local paths, or private git sources
2. Track where installed skills came from
3. List, update, or remove installed skills safely
4. Generate a durable `AGENTS.md` block that advertises installed skills
5. Keep progressive disclosure intact by loading skill contents only on demand

The result is a static skill system. Adding external skills remains manual and
inconsistent across agents.

## Objective

Add a repo-native dynamic skill loader that brings OpenSkills-style install and
read behavior to this repo without replacing the current `.agents/skills`
ownership model.

## Design Goals

- Preserve `.agents/skills` as the single canonical project skill store.
- Keep current symlink-based multi-agent compatibility intact.
- Support skill installation from:
  - GitHub repositories
  - local filesystem paths
  - git URLs, including private repos when local auth is already configured
- Support progressive disclosure:
  - agents see skill metadata in `AGENTS.md`
  - full `SKILL.md` content is loaded only when explicitly requested
- Keep installed-skill provenance explicit so `update` and `remove` are safe.
- Keep the format Claude-compatible enough that existing `SKILL.md` assets still
  work.

## Non-Goals

- Replacing the current shared symlink layout with runtime-specific stores
- Building an MCP server for skills
- Supporting arbitrary remote registries beyond git/GitHub/local path in the
  first slice
- Executing skill scripts automatically during install
- Solving global cross-repo skill management in v1

## Proposed UX

The repo exposes a small CLI through `pnpm` scripts.

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

- resolves the source
- discovers one or more skill folders containing `SKILL.md`
- copies or syncs selected skills into `.agents/skills/<skill-name>/`
- writes provenance to a repo manifest
- leaves agent-facing symlinks unchanged

### Read

```bash
pnpm skills:read <skill-name>
```

Behavior:

- resolves the installed skill by name
- prints the `SKILL.md` body and base directory for bundled resources
- does not mutate installation state

### List

```bash
pnpm skills:list
```

Behavior:

- shows installed skill names
- shows source/provenance
- shows whether the skill is local, git, or GitHub-backed

### Update

```bash
pnpm skills:update [skill-name...]
```

Behavior:

- refreshes installed skills that have tracked sources
- skips purely local copied skills unless a refresh strategy is defined

### Remove

```bash
pnpm skills:remove <skill-name...>
```

Behavior:

- removes selected installed skills from `.agents/skills`
- removes corresponding manifest entries
- leaves checked-in first-party skills protected unless `--force` is passed

### Sync

```bash
pnpm skills:sync
```

Behavior:

- rewrites a managed block in `AGENTS.md`
- lists installed skills with name and description only
- includes usage guidance for `pnpm skills:read <skill-name>`

## Files And Ownership

| Path | Responsibility |
|------|----------------|
| `.agents/skills/` | Canonical installed skill folders |
| `.agents/skills/manifest.json` | Skill provenance, install metadata, sync state |
| `AGENTS.md` | Managed “available skills” block for discovery |
| `scripts/agent-setup-check.mjs` | Continues enforcing required dirs and symlinks |
| `scripts/skills/*.mjs` or `tools/skills-loader/*` | CLI implementation |
| `package.json` | `skills:*` scripts |

## Architecture

### Canonical Storage

All installed project skills live under `.agents/skills`.

This avoids changing the current repo contract and ensures existing symlinks
continue to expose the same set of skills to Claude, Codex, GitHub, and
OpenCode-facing paths.

### Provenance Manifest

Add a manifest file:

```json
{
  "schemaVersion": 1,
  "skills": {
    "pdf": {
      "name": "pdf",
      "sourceType": "github",
      "source": "anthropics/skills",
      "sourceRef": "main",
      "installedAt": "2026-04-29T12:00:00.000Z",
      "installMode": "copy",
      "path": ".agents/skills/pdf"
    }
  }
}
```

Manifest responsibilities:

- map installed skill name to source
- record enough metadata to support update/remove/list
- prevent accidental overwrite collisions
- distinguish repo-owned checked-in skills from externally installed skills

### Skill Discovery

A valid install target is any folder containing a `SKILL.md` file.

Optional subfolders remain supported:

- `references/`
- `scripts/`
- `assets/`

No custom manifest file is required in v1 beyond the existing `SKILL.md`
frontmatter and folder layout.

### AGENTS.md Sync Model

`AGENTS.md` gains a managed block, not a full-file rewrite.

Example shape:

```md
<!-- SKILLS_TABLE_START -->
## Available Skills

Use `pnpm skills:read <skill-name>` to load one skill on demand.

- `pdf`: Comprehensive PDF manipulation toolkit...
- `skill-creator`: Guide for creating effective skills...
<!-- SKILLS_TABLE_END -->
```

Rules:

- only the managed block is rewritten
- surrounding repo-specific instructions remain untouched
- checked-in and installed skills both appear if present

### Read Contract

`skills:read` must print:

1. resolved skill name
2. absolute base directory
3. raw `SKILL.md` content

This keeps the loader simple and agent-friendly. The agent remains responsible
for loading any referenced files only when needed.

## Install Source Rules

### GitHub shorthand

- `owner/repo` clones to a temporary directory, then discovers skills

### Git URL

- cloned directly using the caller's configured git auth

### Local path

- reads directly from the path and copies the selected skill folder(s)

### Name collisions

- if a target name already exists and points to a different source, install
  fails unless `--force` or `--replace` is passed

## Safety Rules

- Install only copies files into `.agents/skills`; it does not execute bundled
  scripts.
- `skills:sync` only edits the managed `AGENTS.md` block.
- `skills:remove` refuses to delete repo-owned checked-in skills by default.
- Invalid `SKILL.md` files fail fast with a clear error.
- Generated output directories remain out of scope.

## Open Questions

1. Should externally installed skills be committed to the repo by default, or
   treated as local workspace state?
2. Should first-party repo skills and third-party installed skills live in the
   same directory, or should v2 split them into `.agents/skills/core/` and
   `.agents/skills/vendor/`?
3. Should `skills:install` support interactive selection when a source repo
   contains many skills, or should v1 require explicit names/flags?
4. Should sync output use simple markdown bullets or an XML-like block for
   closer Claude/OpenSkills compatibility?

## Recommended First Slice

Build the smallest end-to-end vertical slice:

1. `skills:install` for local paths and GitHub shorthand
2. `.agents/skills/manifest.json`
3. `skills:list`
4. `skills:read`
5. `skills:sync`
6. `agents:check` updated to require the manifest only once the feature ships

Defer `update`, `remove`, private git polish, and interactive prompts until the
core lifecycle is proven.

## Acceptance Criteria

- A skill source can be installed into `.agents/skills` with provenance
  recorded.
- Existing agent-facing symlinks continue to work unchanged.
- `AGENTS.md` exposes installed skills through a managed block without
  overwriting repo-specific instructions.
- Agents can load a skill on demand with `pnpm skills:read <name>`.
- Checked-in skills and installed skills can coexist without name ambiguity.
- The loader rejects invalid or conflicting installs with clear errors.

## Verification

Manual checks for implementation:

```bash
pnpm skills:install ./fixtures/example-skill
pnpm skills:list
pnpm skills:read example-skill
pnpm skills:sync
pnpm agents:check
pnpm lint:md
```

Expected outcomes:

- `.agents/skills/example-skill/` exists
- `.agents/skills/manifest.json` contains the install record
- `AGENTS.md` contains the managed available-skills block
- symlinked agent paths still resolve to the installed skill
- markdown lint and agent setup checks pass
