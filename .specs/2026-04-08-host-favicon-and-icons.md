# Host Favicon And Icons

## Problem

The host currently ships with no explicit favicon or app-icon set in [`apps/host/index.html`](/Users/macbook/personal/playground/apps/host/index.html). The result is a generic browser icon in tabs, bookmarks, and pinned contexts, which makes the public site feel unfinished.

## Current Implementation

- The host entry document defines only:
  - charset
  - viewport
  - a static title
- Vite serves static files from [`apps/host/public`](/Users/macbook/personal/playground/apps/host/public).
- There is no current favicon, no apple touch icon, and no web manifest.

## Goal

Add a minimal but proper favicon and app-icon set for the host so browser tabs, bookmarks, and saved-site surfaces stop falling back to defaults.

## Non-Goals

- No logo redesign.
- No SEO metadata work beyond icon references.
- No route-aware head management.
- No PWA/offline behavior beyond a basic manifest if needed for icon wiring.

## Implementation Decisions

### Asset set

Add these files under `apps/host/public`:

- `favicon.ico`
- `favicon.svg`
- `apple-touch-icon.png`
- `site.webmanifest`

If a generated `192x192` or `512x512` icon pair is needed by the manifest, place them in the same folder and reference them from the manifest.

### Document wiring

Update [`apps/host/index.html`](/Users/macbook/personal/playground/apps/host/index.html) to include:

- `link rel="icon" href="/favicon.ico" sizes="any"`
- `link rel="icon" href="/favicon.svg" type="image/svg+xml"`
- `link rel="apple-touch-icon" href="/apple-touch-icon.png"`
- `link rel="manifest" href="/site.webmanifest"`
- `meta name="theme-color"` with a dark value aligned to the host background

### Visual direction

- Keep the favicon simple and readable at small sizes.
- Prefer a mark derived from the current personal-site identity, not the older dashboard/hacker-shell language.
- The icon should work on light and dark browser chrome without needing multiple themes in v1.

### Manifest scope

The manifest should stay minimal:

- `name`
- `short_name`
- `icons`
- `theme_color`
- `background_color`
- `display`

Choose `display: standalone` only as a neutral default for saved-site behavior. Do not treat this as a PWA project.

## Definition Of Done

- Browser tabs no longer show the generic default icon.
- The host serves favicon and icon assets from `apps/host/public`.
- `index.html` contains explicit icon references.
- The asset set is small and stable enough for later SEO/head work to build on.

## Verification

- `pnpm --filter @playground/host type-check`
- Manual browser check in local dev:
  - tab icon renders
  - icon survives reload
  - apple touch icon path resolves directly
  - manifest loads without a 404 in devtools network

## Risks And Follow-Ups

- The only likely blocker is not having a final icon asset; if that happens, use a temporary but intentional placeholder and keep the interface stable.
- A later branding pass may replace the artwork, but should not change filenames unless there is a strong reason.
