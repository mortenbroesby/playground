# Cloudflare Pages Migration Plan

Plan for moving `morten.broesby.dk` from its current Vercel deployment to
Cloudflare Pages while launching the current `apps/host` personal-site
experience.

## Outcome

- `morten.broesby.dk` serves the current host application from Cloudflare Pages.
- The Vite SPA continues to resolve direct public and playground routes.
- `/api/now-playing` continues to provide the same Spotify response contract.
- Production secrets live in Cloudflare Pages, never in the repository.
- Vercel remains available until Cloudflare production validation succeeds.

## Current State

- The DNS zone is already managed by Cloudflare.
- The live hostname currently responds through Vercel.
- The repository host is a Vite SPA in `apps/host`; it is the intended
  replacement experience, not a byte-for-byte copy of the legacy live site.
- Spotify now-playing currently uses a Vercel Node.js function and three
  server-only Spotify credentials.

## Implementation Plan

1. Move the now-playing entrypoint into a Pages Function at
   `apps/host/functions/api/now-playing.ts`.
   - Read Spotify credentials from `context.env`.
   - Preserve `GET /api/now-playing`, the existing JSON response shape, idle
     fallback, error behavior, and `Cache-Control: public, max-age=30`.
   - Replace the Node `Buffer` authorization helper with a Web API-compatible
     implementation so the Function does not require Node compatibility.
   - Keep the shared Spotify normalization logic in the host workspace.

2. Configure Pages for the monorepo from its repository root.
   - Build command: `pnpm --filter @playground/host build`.
   - Build output directory: `apps/host/dist`.
   - Pin the Node and pnpm versions to the repository requirements before the
     first production deployment.
   - Add a Pages Functions routing configuration that invokes Functions only
     for `/api/*`, leaving all other requests on the static SPA path.

3. Remove Vercel-specific runtime coupling after the Pages preview passes.
   - Replace Vercel Analytics and Speed Insights with Cloudflare Web Analytics.
   - Remove `apps/host/vercel.json` and the Vercel function entrypoint.
   - Update the host README and the Uses-page deployment references to name
     Cloudflare Pages.

4. Set Cloudflare Pages production secrets manually.
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `SPOTIFY_REFRESH_TOKEN`
   - Configure the same values for preview only when Spotify behavior needs
     preview verification.

5. Cut over the custom hostname only after preview validation.
   - Create the Pages project from `mortenbroesby/playground`.
   - Attach `morten.broesby.dk` in the Pages custom-domain settings.
   - Update the existing Cloudflare DNS record to the Pages target.
   - Keep the Vercel deployment available for rollback until post-cutover
     checks pass.

## Acceptance Checks

- The host build, type-check, and existing Spotify tests pass.
- A Pages preview serves `/`, `/about`, `/writing`, `/uses`, and
  `/playground/*` on direct navigation and refresh.
- `/api/now-playing` returns an idle state with missing credentials and a
  normalized playing or recently-played response with valid credentials.
- Production HTTPS is active for `morten.broesby.dk`; page metadata, static
  assets, and the now-playing widget work on the custom domain.
- Cloudflare Web Analytics receives production traffic and Vercel can be
  removed without losing a required runtime capability.

## Rollback

Before retiring Vercel, restore the hostname's previous Vercel DNS target if
the Pages custom domain, SPA routing, or Spotify endpoint fails production
validation. Do not delete the Vercel project until the Cloudflare deployment is
stable.

## Related Context

- [Host migration checklist](./host-migration-checklist.md)
- [Spotify now-playing boundary](../../vault/00%20Repositories/playground/01%20Architecture/Spotify%20Now%20Playing%20Boundary.md)
- [Cloudflare Pages migration architecture record](../../vault/00%20Repositories/playground/01%20Architecture/Cloudflare%20Pages%20Migration.md)
