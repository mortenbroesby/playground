---
id: "mem-20260429-host-routing-and-shells"
type: "architecture-record"
repo_slug: "playground"
title: "Host Routing and Shells"
status: "accepted"
created: "2026-04-29"
updated: "2026-04-29"
owner: "morten"
summary: "The host owns top-level routing and splits the product into a public personal-site shell and a denser playground shell."
tags:
  - "type/architecture"
  - "repo/playground"
keywords:
  - "host routing"
  - "public shell"
  - "playground shell"
  - "route ownership"
  - "redirects"
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
  - "apps/host/src/application/routes"
  - "apps/host/src/application/layouts/public-layout.tsx"
  - "apps/host/src/application/layouts/playground-layout.tsx"
  - "apps/host/src/application/App.tsx"
---

## Ownership

`apps/host/` owns browser routing, layout selection, page composition, and the split between the
public personal site and the playground lab.

The route tree is composed from three route modules:

- `PUBLIC_ROUTES` for `/`, `/about`, `/writing`, `/writing/:slug`, `/uses`, and public redirects.
- `PLAYGROUND_ROUTES` for `/playground`, `/playground/system`, `/playground/todo`, and
  `/playground/uplink`.
- `REDIRECT_ROUTES` for legacy top-level lab paths that now redirect into `/playground/*`.

`createAppRouter()` can create either a browser router or a memory router. Tests use the memory
router path to exercise routes without a browser history dependency.

## Shell Split

The public shell is intentionally calmer. `PublicLayout` owns the public header, main-site nav,
mobile drawer, footer, command menu, React Query provider, and Spotify now-playing widget.

The playground shell is denser and uses `AppShell` with playground-specific navigation, sidebar
metadata, route metadata, and a footer link back to the public site.

## Design Constraint

New top-level public pages should live under `PUBLIC_ROUTES` and use the public shell. Experimental
or lab surfaces should live under `PLAYGROUND_ROUTES` and use the playground shell. Avoid adding
new root-level lab routes; keep legacy aliases as redirects.
