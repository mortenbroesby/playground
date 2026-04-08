# Uplink Rendering Sharpness

## Problem

The first active item in [`KANBAN.md`](/Users/macbook/personal/playground/KANBAN.md) is fixing Uplink rendering sharpness on the playground route.

Today the Uplink surface mounts through [`packages/remotes/uplink-game/src/mount.ts`](/Users/macbook/personal/playground/packages/remotes/uplink-game/src/mount.ts) with a plain Phaser `FIT` scale config and no explicit rendering sharpness policy. The host container in [`apps/host/src/components/game-workspace.tsx`](/Users/macbook/personal/playground/apps/host/src/components/game-workspace.tsx) provides layout and aspect ratio but no canvas-specific interpolation control.

The result is that the Uplink surface can read as accidentally blurry or stretched instead of intentionally retro.

## Current Implementation

- The host route is `/playground/uplink`, with `/game` redirecting there.
- The host mounts the remote through `mount(el: HTMLElement): () => void`.
- The remote creates a Phaser game with:
  - logical size `900x560`
  - `Phaser.Scale.FIT`
  - `Phaser.Scale.CENTER_BOTH`
  - no explicit `pixelArt`, `antialias`, or `roundPixels` policy
- The host wrapper uses a fixed `aspect-[900/560]` container and `w-full`.

## Goals

- Remove accidental blur and stretching on the Uplink surface.
- Preserve the retro Uplink feel rather than smoothing it into a generic polished game canvas.
- Keep the current host route structure and remote mount contract unchanged.
- Keep the implementation primarily inside the Uplink remote, with host styling only where needed to prevent browser interpolation blur.

## Non-Goals

- No route changes.
- No gameplay or scene-design changes.
- No CMD+K work.
- No signal mesh work.
- No pseudo-terminal mode.
- No broader playground visual retheme.

## Implementation Decisions

### Rendering policy

The fix should be treated as a rendering-quality correction, not a redesign.

Default rendering policy for the Phaser game:

- keep the logical game size at `900x560`
- keep `Phaser.Scale.FIT`
- keep `Phaser.Scale.CENTER_BOTH`
- set `pixelArt: true`
- set `antialias: false`
- set `roundPixels: true`

This is the default because the intended outcome is "retro pixel feel" instead of maximum smoothness.

### Ownership split

Remote responsibilities:

- [`packages/remotes/uplink-game/src/mount.ts`](/Users/macbook/personal/playground/packages/remotes/uplink-game/src/mount.ts) owns the rendering sharpness fix.
- If Phaser config alone is insufficient, any post-mount canvas adjustment should still happen inside the remote mount path.

Host responsibilities:

- [`apps/host/src/components/game-workspace.tsx`](/Users/macbook/personal/playground/apps/host/src/components/game-workspace.tsx) may add scoped styling for the mounted canvas or its wrapper if browser-side interpolation is still causing blur.
- The host must not absorb game-rendering logic.
- Any added CSS or classes must stay scoped to the Uplink container only.

### Constraints

- Do not change the exported API of `@playground/uplink-game`.
- `mount(el)` remains the only public interface.
- Do not change the surrounding Uplink content panels or page copy as part of this task.
- Do not change the route tree in [`apps/host/src/routes.tsx`](/Users/macbook/personal/playground/apps/host/src/routes.tsx).

## Definition Of Done

- Uplink no longer looks unintentionally blurry on standard desktop displays.
- Uplink still reads as retro and intentionally pixel-adjacent on higher-density displays.
- Resizing the host container does not introduce obvious browser-stretch smoothing.
- The host and remote public interfaces remain unchanged.

## Verification

Required checks:

- `pnpm --filter @playground/uplink-game type-check`
- `pnpm --filter @playground/uplink-game build`
- `pnpm --filter @playground/host type-check`

Manual verification in local dev on `/playground/uplink`:

- confirm the canvas looks crisp at default desktop width
- confirm text, edges, and line work do not look unintentionally smeared
- confirm resize does not introduce obvious blur
- confirm the surface still feels retro rather than glossy

Optional regression check:

- if host code changes are required, run `pnpm --filter @playground/host test`

## Risks And Follow-Ups

- If `FIT` scaling still produces visible browser interpolation blur after the Phaser config change, add a narrowly scoped host-side canvas style rather than widening the task.
- If the implementer discovers a concrete reason that `FIT` itself is the source of the blur, they may revise scale behavior, but only with a clear before/after justification.
- If crispness and smoothness conflict, choose retro crispness.
