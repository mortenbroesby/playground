---
type: repo-architecture
repo: playground
status: active
summary: Incremental plan to separate the personal and playground design systems while keeping shared primitives in place.
keywords:
  - design system migration
  - personal system
  - playground system
  - shared primitives
  - surface recipes
related_paths:
  - packages/ui/src
  - apps/host/src/ui
  - apps/host/src/application/layouts/public-layout.tsx
  - apps/host/src/application/layouts/playground-layout.tsx
tags:
  - type/architecture
  - repo/playground
---

# Design System Split Migration Plan

## Goal

Split the visual system into two surface-specific layers:

- `personal` for public-facing, editorial, calmer surfaces
- `playground` for denser, more terminal-like, more experimental surfaces

The goal is not to duplicate the entire component library. The goal is to move surface-specific
decisions out of scattered class strings and into named layers.

## Current Status

- Public pages now use a `PersonalPage` wrapper instead of the generic `PublicPage` name.
- Playground pages now use a `PlaygroundPage` wrapper instead of inline shell spacing.
- The split is still wrapper-first; `packages/ui` remains the shared primitive base.

## Non-Goal

Do not fork `packages/ui` into two copies just because the surfaces differ. Keep shared primitives
shared until there is a concrete reason to diverge.

## Phases

### Phase 1: Surface Inventory

- List the components, tokens, and layout chrome currently used by the personal shell.
- List the components, tokens, and layout chrome currently used by the playground shell.
- Mark each item as `shared`, `personal-only`, `playground-only`, or `candidate for wrapper`.

Success criterion:

- We can name the actual divergence instead of guessing at it.

### Phase 2: Surface Wrappers

- Introduce surface-specific wrapper components in `apps/host` for nav chrome, page chrome,
  footers, and metadata blocks.
- Keep the wrappers thin and composition-friendly.
- Move repeated class combinations into those wrappers.

Success criterion:

- Host code stops repeating surface-specific styling decisions inline.

### Phase 3: Theme/Token Split

- Split tokens only where the surfaces genuinely need different defaults.
- Keep the primitive token layer shared if both surfaces still agree on the base palette,
  typography, or spacing scale.
- Introduce surface token namespaces only after the wrapper layer proves insufficient.

Success criterion:

- Token divergence is explicit, minimal, and justified by actual usage.

### Phase 4: Package Boundaries

- If the divergence becomes large enough, consider separate `personal` and `playground` exports
  on top of the shared primitive base.
- Prefer package-level separation only after the migration proves the surfaces cannot stay neatly
  represented as shared primitives plus wrappers.

Success criterion:

- Package structure reflects the real UI split instead of preemptively guessing it.

## Initial Ownership Guess

- `packages/ui`: shared primitives only
- `apps/host/src/ui`: surface wrappers and chrome
- `apps/host/src/application/layouts`: shell-level composition and route-specific presentation

## Risks

- Splitting too early will duplicate logic and make visual consistency harder to manage.
- Splitting too late will keep the host full of ad hoc class strings and variant branches.
- The right boundary is likely wrapper-level first, token-level second, package-level last.

## Immediate Next Actions

- Inventory the host-facing UI surface and mark what is shared versus surface-specific.
- Extract more repeated chrome patterns into small wrapper components.
- Revisit tokens only after the wrapper pass shows real divergence.
