# Mobile-first polish — Option A design

**Date:** 2026-04-08
**Scope:** `apps/host` navigation + `packages/remotes/uplink-game` touch fix
**Approach:** Surgical — minimum changes to fix the two real problems

## Problem statement

Two surfaces have genuine mobile issues:

1. **Navigation** — `Sidebar` is always rendered. On mobile it is 96px wide (25% of a 375px screen), showing only truncated labels with no metadata. There is no way to collapse it.
2. **Game canvas** — touching the game canvas to interact with nodes also triggers page scroll, making the game unplayable on touch devices.

Host pages and the todo remote are already using mobile-first Tailwind patterns and need no changes.

## Design

### 1. Mobile navigation — hamburger drawer

**Behaviour:**
- Below `md` (768px): sidebar is hidden, a hamburger button (`≡`) appears in the header.
- Tapping the button opens a full-height slide-in drawer from the left.
- Drawer contains the same five `NavLink` entries rendered with the existing terminal styles.
- Drawer closes on: route navigation, tap outside the drawer, or `Escape` key.
- At `md` and above: sidebar renders as before, hamburger button is hidden.

**Files:**

| File | Change |
|---|---|
| `apps/host/src/components/sidebar.tsx` | Add `hidden md:flex` (or equivalent) to the aside element |
| `apps/host/src/components/header.tsx` | Add hamburger button, visible only below `md` |
| `apps/host/src/components/mobile-drawer.tsx` | New component — slide-in overlay, reuses `NAV_APPS` and existing nav styles |

`MobileDrawer` is self-contained. `App.tsx` renders `Header` and `Sidebar` as direct siblings, so `isDrawerOpen` state is lifted into `App.tsx` and passed as props — no context needed.

**Aesthetic:** matches the existing terminal panel style — dark background, `border-border/80`, same `NavLink` active/inactive classes. No new design tokens.

### 2. Game canvas — touch-action fix

**Behaviour:**
- Touching the game canvas no longer scrolls the page.
- Existing tap-to-interact on nodes and tool buttons works on touch devices (Phaser maps touch to `pointerdown` natively — no scene changes needed).
- Multi-touch pointer tracking is enabled.

**Files:**

| File | Change |
|---|---|
| `apps/host/src/components/game-workspace.tsx` | Add `touch-action: none` (inline style or Tailwind `[touch-action:none]`) to the canvas wrapper div |
| `packages/remotes/uplink-game/src/mount.ts` | Add `input: { activePointers: 2 }` to the Phaser config object |

### 3. Out of scope

- Host page layout changes (already mobile-first)
- Todo remote changes (already responsive)
- Viewport meta tag (set by Vite by default)
- Touch visual feedback (tap ripple, etc.) — see Option B in `docs/ideas/mobile-future.md`
- Game visibility gate below a minimum width — see Option C in `docs/ideas/mobile-future.md`

## Verification

- `pnpm --filter @playground/host lint`
- `pnpm --filter @playground/host type-check`
- `pnpm --filter @playground/host test`
- `pnpm --filter @playground/uplink-game type-check`
- Manual check: open on a 375px viewport, confirm sidebar hidden, drawer opens and navigates, game tappable without page scroll
