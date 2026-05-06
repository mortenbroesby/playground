# Repo-Owned Skills

This directory is the canonical home for repo-owned first-party skills and their
generated registry.

## Registry-First Model

- Each repo-owned skill lives in `.skills/<skill-id>/SKILL.md`.
- `SKILL.md` frontmatter is the canonical machine-readable source for skill
  metadata.
- `.skills/registry.generated.json` is a deterministic artifact generated from
  that frontmatter.
- Runtime adapters and command surfaces should consume the registry or the same
  shared loader/helpers rather than re-deriving metadata from raw markdown prose.

## Required Frontmatter Contract

Start with this narrow metadata surface for repo-owned skills:

- `name`
- `description`
- `tags`
- `triggers`
- `anti_triggers`
- `routing_weight`

Contract notes:

- `name` and `description` are required.
- `tags`, `triggers`, and `anti_triggers` are optional string lists.
- `routing_weight` is optional and defaults to `1`.
- Unknown top-level frontmatter keys are rejected so metadata typos do not get
  silently dropped.
- Existing non-registry top-level keys are limited to `license`, `metadata`, and
  `model`.

Example:

```md
---
name: readme-authoring
description: Use when writing, restructuring, or reviewing a project README.
tags:
  - docs
  - onboarding
triggers:
  - improve the readme
  - rewrite setup docs
anti_triggers:
  - fix a runtime bug
routing_weight: 2
---
```

## Registry Artifact

The generated registry stores, per skill:

- skill id
- display name
- description
- source directory
- source `SKILL.md` path
- tags
- triggers
- anti-triggers
- routing weight

Rebuild it locally with:

```bash
node scripts/skills.mjs registry
```

Validate the checked-in artifact with:

```bash
node scripts/skills.mjs registry --check
```

## Current Scope

- The checked-in skill tree remains the source of truth.
- Full skill content stays out of startup-loaded adapter surfaces.
- `AGENTS.md` stays thin and points agents here for on-demand skill loading.
- External downloaded skills stay out of this checked-in directory.
