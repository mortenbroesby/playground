---
id: "mem-20260506-skills-execution-stack-tools-package"
type: "architecture-record"
repo_slug: "playground"
title: "Move Skills Execution Stack to tools/agent-skills"
status: "accepted"
created: "2026-05-06"
updated: "2026-05-06"
owner: "morten"
summary: "Migration from inline JS skill helpers to a dedicated TypeScript package, with repo scripts as thin shims to preserve command compatibility."
tags:
  - "type/architecture"
  - "repo/playground"
  - "skills"
  - "agent-tools"
keywords:
  - "tools/agent-skills"
  - "skills"
  - "registry"
  - "frontmatter"
  - "metadata-hook"
links:
  parents: []
  children: []
  related:
    - "mem-20260429-root-skills-architecture"
    - "mem-20260429-use-root-skills-as-canonical-repo-owned-skills-store"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-11-06"
  expires_after: null
  keep: true
---

## Intent

Consolidate skill metadata, registry, routing, and usage-cache logic into a dedicated
TypeScript package so runtime commands are easier to maintain and evolve while
repo-level script entrypoints remain stable.

## Decision

`tools/agent-skills` now owns the skill execution stack with explicit modules:

- `src/lib/skills-metadata.ts`
- `src/lib/skills-registry.ts`
- `src/lib/skills-routing.ts`
- `src/lib/skills-usage-cache.ts`
- `src/hooks/skills-metadata-hook.ts`

The repo script commands (`scripts/skills.mjs`, `scripts/skills-metadata-hook.mjs`,
`scripts/skills-smoke.mjs`) are thin compatibility shims that delegate to
`@playground/agent-skills`.

All frontmatter-heavy behavior stays in the package entrypoints and tests and no
longer relies on duplicated JS logic in `scripts/lib`.

## Migration Boundaries

- `scripts/lib/skills-metadata.mjs`, `skills-registry.mjs`,
  `skills-usage-cache.mjs` were removed from runtime maintenance and replaced by
  package-based TS modules.
- A dedicated package script surface was added for `type-check`, `build`, and `smoke`
  at `tools/agent-skills`.
- Hook wiring in `scripts/prepush-checks.mjs` was updated to call package-backed
  commands and preserve existing pre-push behavior.
- `package.json` and workspace lockfile were updated to include the new workspace
  package and its build/test dependencies.

## Why This Shift

The prior structure kept mutable skill runtime logic in repo scripts and separate JS
modules, making TS tooling, typed tests, and long-term refactors harder to
apply consistently. This migration creates a single executable package boundary
with explicit typed modules while keeping user-facing scripts unchanged.

## Invariants

- Keep script entrypoints as compatibility adapters rather than business-logic homes.
- Keep behavior stable for existing `pnpm skills:*` and hook paths.
- Keep the skills metadata contract source in frontmatter with generated runtime
  artifacts derived from it.
- Keep tests colocated with package modules and run through `pnpm --filter
  @playground/agent-skills`.
