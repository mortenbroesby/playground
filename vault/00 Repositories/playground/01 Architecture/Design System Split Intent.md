---
type: repo-architecture
repo: playground
status: active
summary: The repo is intentionally moving toward separate personal and playground design systems while keeping a shared primitive base for now.
keywords:
  - design system
  - personal surface
  - playground surface
  - shared primitives
  - theme layers
related_paths:
  - packages/ui/src
  - apps/host/src/ui
  - apps/host/src/application/layouts/public-layout.tsx
  - apps/host/src/application/layouts/playground-layout.tsx
tags:
  - type/architecture
  - repo/playground
---

# Design System Split Intent

## Intent

The repo is not splitting the full UI library immediately, but it is intentionally moving toward
two surface-specific systems:

- a calmer personal-site system for editorial pages and public-facing shell chrome
- a denser playground system for lab pages, navigation metadata, and experimental surfaces

`packages/ui` remains the shared primitive layer for now. The split should happen at the surface
recipe level first, not by cloning every component into separate packages.

## Working Rule

Prefer shared primitives plus surface wrappers until the public and playground surfaces need
different tokens, spacing, or interaction patterns that can no longer be expressed cleanly through
props or local composition.

## Next Steps

- Move surface-specific chrome and layout variants out of ad hoc class strings and into named
  recipes or wrappers.
- Split tokens only when the personal and playground surfaces genuinely diverge.
- Keep the split incremental so the host stays maintainable while the visual languages separate.
