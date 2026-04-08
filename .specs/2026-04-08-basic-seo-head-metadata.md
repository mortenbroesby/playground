# Basic SEO Head Metadata

## Problem

The host currently relies on a static `<title>` in [`apps/host/index.html`](/Users/macbook/personal/playground/apps/host/index.html) and has no route-aware metadata system. Public pages therefore lack page-specific titles, descriptions, canonical tags, and basic social metadata.

## Current Implementation

- There is no `react-helmet` or `react-helmet-async` dependency in [`apps/host/package.json`](/Users/macbook/personal/playground/apps/host/package.json).
- There is no current head-management component in `apps/host/src`.
- Public routes currently include:
  - `/`
  - `/about`
  - `/writing`
  - `/writing/:slug`
  - `/uses/gear`
- Writing posts already expose metadata through [`apps/host/src/content/writing.ts`](/Users/macbook/personal/playground/apps/host/src/content/writing.ts).
- The app is a Vite SPA, so this work is a baseline client-rendered SEO layer, not a full SSR strategy.

## Goal

Add a small shared metadata system for the public site so each public route can set titles and descriptions, and writing posts can set route-specific metadata from post content.

## Non-Goals

- No SSR migration.
- No sitemap generation in this task.
- No robots.txt tuning beyond what is necessary for stable metadata defaults.
- No playground-route SEO investment beyond sensible defaults.

## Implementation Decisions

### Head library

Use `react-helmet-async`, not `react-helmet`.

Reasons locked for implementation:

- it is the maintained React 18-safe choice
- it supports async-friendly provider usage
- it keeps the public API small for a Vite SPA

### Metadata architecture

Add a small metadata layer in the host with:

- one `HelmetProvider` at the app root
- one shared `Seo` component for page-level metadata
- one site metadata module that defines:
  - site name
  - default title
  - default description
  - default social image path
  - optional `siteUrl`

`siteUrl` should come from `import.meta.env.VITE_SITE_URL`. If it is missing, canonical and absolute OG URL tags should be omitted rather than guessed.

### Route coverage

Implement metadata for these public routes first:

- `/`
- `/about`
- `/writing`
- `/writing/:slug`
- `/uses/gear`

Playground routes may keep a simpler default title pattern in v1 and do not need rich metadata.

### Metadata shape

The shared `Seo` component should support:

- `title`
- `description`
- optional `pathname`
- optional `image`
- optional `type`
- optional `robots`

It should emit:

- `<title>`
- `meta name="description"`
- `link rel="canonical"` when `siteUrl` and `pathname` are both present
- `meta property="og:title"`
- `meta property="og:description"`
- `meta property="og:type"`
- `meta property="og:url"` when canonical can be formed
- `meta property="og:image"` when absolute image URL can be formed
- `meta name="twitter:card"` with `summary_large_image`
- `meta name="twitter:title"`
- `meta name="twitter:description"`
- `meta name="twitter:image"` when absolute image URL can be formed

### Content rules

- Home: personal front-door title and concise summary
- About: profile-oriented title and description
- Writing index: writing-focused title and description
- Writing post pages: use post `title` and `summary` from the MDX metadata
- Uses: practical tools/stack title and description
- Not found writing post: fallback title and noindex robots policy

### Title pattern

Use this title pattern:

- Home: `Morten Broesby-Olsen`
- Other public routes: `<Page Title> | Morten Broesby-Olsen`

## Definition Of Done

- Public routes no longer share one static document title.
- Public routes have route-aware descriptions.
- Writing posts derive metadata from their existing post metadata.
- Canonical and social URLs are emitted only when `VITE_SITE_URL` is configured.
- The metadata system is small enough to extend without adding per-page duplication.

## Verification

- install and type-check the new dependency usage
- `pnpm --filter @playground/host type-check`
- `pnpm --filter @playground/host test`
- Manual browser inspection on `/`, `/about`, `/writing`, and one writing post:
  - title updates on navigation
  - description tag updates per route
  - canonical appears only when `VITE_SITE_URL` is present
  - writing post title and summary appear in head tags

## Risks And Follow-Ups

- Because this is still a client-rendered Vite SPA, this is a baseline SEO improvement, not the final word on search indexing.
- If richer SEO later becomes important, the next step is prerendering or SSR, not piling more tags into the client.
- A future pass can add sitemap generation, robots.txt, and route-specific OG images once the base metadata layer is stable.
