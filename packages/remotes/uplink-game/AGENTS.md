# AGENTS.md

This file provides guidance to coding agents working in `packages/remotes/uplink-game/`.

## Scope Guidelines

- Follow the repository root `AGENTS.md` first, then this file for uplink game work.
- Do not edit generated output in `dist/` or `.turbo/`.
- Keep changes scoped to the game remote's exported surface and game implementation.

## Structure

- `src/index.ts` - package export surface
- `src/mount.ts` - host-facing mount entrypoint
- `src/game/scenes/` - Phaser scene implementations

## Commands

- `pnpm --filter @playground/uplink-game build`
- `pnpm --filter @playground/uplink-game type-check`

## Verification Guidance

- Scene or gameplay changes: run `build` and `type-check`.
- Changes to the exported API or mount surface: also run `pnpm --filter @playground/host type-check`.

## Architecture Notes

- This workspace is an injected remote consumed by the host.
- Keep the exported surface small and stable.
- Prefer containing gameplay details inside `src/game/scenes/` rather than leaking them into host code.
