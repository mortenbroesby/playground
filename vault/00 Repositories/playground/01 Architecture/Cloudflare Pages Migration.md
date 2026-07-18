---
id: "mem-20260718-cloudflare-pages-migration"
type: "architecture-record"
repo_slug: "playground"
title: "Cloudflare Pages Migration"
status: "proposed"
created: "2026-07-18"
updated: "2026-07-18"
owner: "morten"
summary: "Proposed migration of the public host from Vercel to Cloudflare Pages, with a Pages Function replacing the Spotify Node function."
tags:
  - "type/architecture"
  - "repo/playground"
  - "deployment"
  - "cloudflare"
keywords:
  - "cloudflare pages"
  - "vercel migration"
  - "vite"
  - "spotify"
  - "pages function"
links:
  parents: []
  children: []
  related:
    - "mem-20260429-spotify-now-playing-boundary"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2027-01-18"
  expires_after: null
  keep: true
related_paths:
  - "apps/host"
  - "apps/host/api/now-playing.ts"
  - "apps/host/src/server/now-playing.ts"
  - "docs/ideas/cloudflare-pages-migration-plan.md"
---

## Decision

Move the public host to Cloudflare Pages and treat the current `apps/host`
application as the intended production replacement for the legacy Vercel site.
The DNS zone already uses Cloudflare, so the migration changes the origin and
deployment workflow rather than the authoritative nameservers.

## Why

The repository already contains a Vite SPA that is suitable for Pages and a
Cloudflare-managed DNS zone. Moving the host keeps static delivery, custom
domain management, and the small server-side Spotify capability on one
platform.

The live Vercel hostname and the repository host currently differ in content
and visual design. This is therefore an explicit product cutover, not a
hosting-only replication exercise.

## Runtime Boundary

The existing Spotify boundary remains client-compatible:

- clients continue to request `GET /api/now-playing`;
- the response shape, idle fallback, recently-played behavior, and cache header
  remain unchanged;
- a Pages Function receives Spotify credentials through `context.env`;
- the implementation uses Web APIs instead of Node-only `Buffer` behavior.

The existing Vercel entrypoint remains the source of the current deployment
until the migration plan is completed. This record does not change the current
runtime by itself.

## Delivery Constraints

- Build the host from the monorepo root with
  `pnpm --filter @playground/host build` and publish `apps/host/dist`.
- Route only `/api/*` through Pages Functions; keep the rest of the Vite SPA
  static so direct links continue to use Pages SPA fallback behavior.
- Store Spotify credentials as Cloudflare Pages secrets, never in tracked files.
- Keep Vercel operational until custom-domain, route, and endpoint validation
  passes in production.

## Follow-up

The executable checklist is maintained in
[[../../../../docs/ideas/cloudflare-pages-migration-plan|Cloudflare Pages Migration Plan]].
When the migration is complete, update this note to `accepted` and replace the
Vercel deployment detail in [[Spotify Now Playing Boundary]].
