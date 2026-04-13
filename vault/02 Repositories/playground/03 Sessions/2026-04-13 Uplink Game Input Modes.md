# 2026-04-13 — Uplink Game Input Modes

## Summary

Implemented a persistent input mode setting (`mouse` vs `keyboard`) for the Uplink mini-game and split the hack loop to support both play styles.

## Changes

- `NetworkMapScene` now lets players toggle input mode from the start screen and persists it via `localStorage`.
- `HackScene` behavior is mode-specific:
  - `mouse`: click a tool to execute it with an auto-completing tween (no typing).
  - `keyboard`: tool 1 starts automatically; typing completes tools sequentially with increased pressure (faster decay + extra trace pressure).

## Files

- `packages/remotes/uplink-game/src/game/scenes/NetworkMapScene.ts`
- `packages/remotes/uplink-game/src/game/scenes/HackScene.ts`

