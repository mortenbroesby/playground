---
type: repo-architecture
repo: playground
status: archived
summary: Consolidated archive of approved design specs that were previously stored in `.specs/`.
keywords:
  - specs
  - architecture
  - archive
  - design
tags:
  - type/architecture
  - repo/playground
---

# Archived Specs

This note replaces the hidden `.specs/` folder as the durable home for approved
design specs. Keep the short version here and link to the implementation notes
or active architecture pages when you need details.

## Archived Specs

- `2026-04-05` Turborepo Monorepo Pivot
  - Outcome: the repo became the current pnpm + Turborepo playground with app/package workspaces.
  - Follow-up: current source of truth lives in the repo home and shared tooling notes.

- `2026-04-06` Microfrontend Cleanup
  - Outcome: the host ended up with a smaller app set and a single merged todo remote.
  - Follow-up: host routing and remote composition notes now capture the live architecture.

- `2026-04-08` Host Favicon and Icons
  - Outcome: the host gained favicon and app-icon assets.
  - Follow-up: the favicon and metadata notes now capture the implementation state.

- `2026-04-08` Basic SEO Head Metadata
  - Outcome: the host gained route-aware metadata with a shared head layer.
  - Follow-up: keep SEO-specific implementation details in the host architecture notes.

- `2026-04-08` Mobile-first Polish
  - Outcome: the host shell and Uplink touch handling were cleaned up for mobile use.
  - Follow-up: the current host pages and playground shell now reflect the shipped version.

- `2026-04-08` Uplink Rendering Sharpness
  - Outcome: the Uplink surface now has an explicit crisp rendering policy.
  - Follow-up: the implementation is tracked from the kanban and host/playground notes, not from this archive.

- `2026-04-09` Spotify Now-Playing
  - Outcome: the public shell gained the ambient now-playing widget and serverless proxy.
  - Follow-up: the host architecture notes capture the boundary and runtime details.

## Rule Of Thumb

If a spec has already shipped, keep the spec here as a compact archive and keep
the implementation details in the appropriate architecture or session note.
