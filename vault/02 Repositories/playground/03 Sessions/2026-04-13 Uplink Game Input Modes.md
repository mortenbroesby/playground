# 2026-04-13 — Uplink Game Input Modes

## Summary

Implemented a persistent input mode setting (`mouse` vs `keyboard`) for the Uplink mini-game and split the hack loop to support both play styles.

## Changes

- `NetworkMapScene` now lets players toggle input mode from the start screen and persists it via `localStorage`.
- Added a `Difficulty` setting (`easy` / `medium` / `hard`) persisted via `localStorage` and configurable from a start-screen settings overlay.
- Input mode selection (mouse vs keyboard) is now also available in the settings overlay.
- Fullscreen is now only toggled intentionally from the settings menu (removed in-game fullscreen hotkeys/buttons and the dblclick toggle); mobile uses a full-window fallback when Fullscreen API is unavailable.
- `HackScene` behavior is mode-specific:
  - `mouse`: click a tool to execute it with an auto-completing tween (no typing).
  - `keyboard`: tool 1 starts automatically; typing the prompted physical key or tapping the matching on-screen key grid completes tools with difficulty-scaled pressure (targets, decay, and trace pressure).

## Follow-up Fix

- Restored physical keyboard progression for keyboard mode by routing Q/W/E/R/A/S/D/F/Z/X/C/V keydown events through the same tool-progress path as the on-screen key grid.
- Updated the active tool prompt from `[TAP: X]` to `[TYPE: X]` so the expected input is clearer while the on-screen grid remains clickable.
- Removed wrong-letter punishment: pressing a valid non-target key now still advances normally and no longer adds trace; the prompted key remains a bonus.

## Files

- `packages/remotes/uplink-game/src/game/scenes/NetworkMapScene.ts`
- `packages/remotes/uplink-game/src/game/scenes/HackScene.ts`
