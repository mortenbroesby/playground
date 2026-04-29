# Dynamic Skills Loader Design

**Date:** 2026-04-29
**Status:** Archived

## Superseded

This document described an OpenSkills-based design centered on:

- `.agents/skills` as the canonical skill store
- runtime-specific `*/skills` symlinks
- `AGENTS.md` as the managed discovery catalog

That design is no longer active.

## Current Direction

The repo now uses a direct root-level `.skills/` model:

- repo-owned skills live only in `.skills/`
- runtime-specific skill directories are not used
- `AGENTS.md` stays thin
- skill discovery is command-first and on-demand:
  - `pnpm skills:list`
  - `pnpm skills:search <query>`
  - `pnpm skills:read <skill-name>`

## Why It Was Replaced

The earlier OpenSkills-plus-symlink model was not on-demand enough. It still
treated skills as adapter-managed infrastructure and encouraged `AGENTS.md` to
act as a catalog. The current design keeps startup context small and makes full
skill content explicit and pull-based.

## Historical Value

Keep this file only as a short record of the discarded direction and why the
repo moved away from it.
