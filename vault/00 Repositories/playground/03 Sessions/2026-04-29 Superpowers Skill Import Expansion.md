# Superpowers Skill Import Expansion

## Summary

A large set of Superpowers-aligned skills and skill updates was staged into the
repo's root `.skills/` surface.

## What Changed

- Added new on-demand skills:
  - `brainstorming`
  - `systematic-debugging`
  - `writing-skills`
- Expanded `test-driven-development` with additional references and guidance.
- Updated several workflow and review skills to align better with the imported
  Superpowers operating model.
- Added cross-platform references under `using-superpowers/references/`,
  including Copilot and Gemini tool mappings.

## Why

The repo is moving toward a stronger on-demand skill system while keeping
`AGENTS.md` thin. Pulling these skills into `.skills/` makes the Superpowers
workflow available without returning to runtime-specific skill adapters.

## Verification To Run

- `pnpm skills:list`
- `pnpm skills:read using-superpowers`
- `pnpm skills:read brainstorming`
- `pnpm skills:read systematic-debugging`
- `pnpm agents:check`
- `pnpm lint:md`
