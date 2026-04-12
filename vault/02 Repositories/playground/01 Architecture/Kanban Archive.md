---
type: repo-architecture
repo: playground
status: archived
summary: Archived done items from KANBAN.md that are no longer needed in the active board.
keywords:
  - kanban
  - archive
  - done
tags:
  - type/architecture
  - repo/playground
---

# Kanban Archive

Use this note for completed work that would otherwise make the active kanban
too long to scan.

## Archived Done Items

- Replace `uses/gear` with a cleaner canonical `/uses` structure
- Add `Writing` as a first-class section with seeded posts
- Move app surfaces under `/playground/*` with legacy redirects
- Keep the playground navigation limited to playground-only surfaces
- Add a dedicated path back to the main site from the playground
- Simplify the public shell and reduce hacker-theme bleed on public pages
- Move writing article pages into the editorial visual language instead of the playground language
- Rebuild the admin kanban board on Mantine and align it with the markdown workflow model
- Add a global CMD+K command menu for navigation and power actions

## Recent Archived Work

- Apply EFA layering to host app
- Add PageMetadata SEO to all playground routes
- Split host architecture into clearer route modules
- Introduce a content-domain layer for public pages
- Inline uplink-game and narrow MFE scope to todo-app only
- Import the legacy blog archive into the host writing system
- Add a proper favicon and basic app-icon set for the host
- Add baseline SEO metadata management with React head support
- Fix Uplink rendering sharpness on the playground route
- Add an MDX-based content system
- Turn `/` into a real home page instead of redirecting to `/about`
- Split the host into public and playground layouts

## Rule Of Thumb

When a done item no longer informs active planning, archive it here and keep
`KANBAN.md` focused on the current board.
