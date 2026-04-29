---
id: "mem-20260429-design-system-split-migration-plan"
type: "architecture-record"
repo_slug: "playground"
title: "Design System Split Migration Plan"
status: "accepted"
created: "2026-04-29"
updated: "2026-04-29"
owner: "morten"
summary: "Canonical design-system note for splitting the personal and playground surfaces while keeping shared primitives in place."
tags:
  - "type/architecture"
  - "repo/playground"
keywords:
  - "design system migration"
  - "personal system"
  - "playground system"
  - "shared primitives"
  - "surface recipes"
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
related_paths:
  - "packages/ui/src"
  - "apps/host/src/ui"
  - "apps/host/src/application/layouts/public-layout.tsx"
  - "apps/host/src/application/layouts/playground-layout.tsx"
---

## Goal

Split the visual system into two surface-specific layers:

- `personal` for public-facing, editorial, calmer surfaces
- `playground` for denser, more terminal-like, more experimental surfaces

Do not duplicate the component library. Move surface-specific decisions out of
scattered class strings and into named layers.

This note now replaces the earlier standalone intent note and serves as the
single source of truth for both the design direction and the migration plan.

## Current Status

- Public pages now use a `PersonalPage` wrapper.
- Playground pages now use a `PlaygroundPage` wrapper.
- The split is still wrapper-first; `packages/ui` remains the shared primitive base.

## Non-Goal

Do not fork `packages/ui` into two copies. Keep shared primitives shared until
there is a concrete reason to diverge.

## Plan

- Inventory personal and playground surfaces and mark each item as shared,
  surface-specific, or wrapper-candidate.
- Move repeated surface styling into thin host-side wrappers first.
- Split tokens only where wrapper-level separation is not enough.
- Consider separate `personal` and `playground` exports only if the wrapper
  and token layers no longer model the split cleanly.

## Risks

- Splitting too early duplicates logic.
- Splitting too late keeps the host full of ad hoc class strings.
- The right boundary is likely wrapper-level first, token-level second, package-level last.

## Immediate Next Actions

- Finish the host surface inventory.
- Extract more repeated chrome into wrapper components.
- Revisit tokens only after the wrapper pass shows real divergence.
