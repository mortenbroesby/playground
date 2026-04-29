# Root Skills On Demand Migration

## Summary

The repo moved repo-owned skills out of `.agents/skills` into root `.skills/`
and removed runtime-specific `*/skills` adapters entirely.

## What Changed

- `AGENTS.md` was reduced to a thin bootstrap that points to
  `pnpm skills:list`, `pnpm skills:search`, and `pnpm skills:read`.
- `scripts/skills.mjs` now reads repo-owned skills directly from `.skills/`
  and no longer depends on OpenSkills or agent-facing skill symlinks.
- `scripts/agent-setup-check.mjs` now forbids `.claude/skills`,
  `.codex/skills`, `.github/skills`, and `.opencode/skills`.
- The legacy `.agents/skills/` tree and all runtime skill adapters were
  removed.
- Agent settings moved from `.agents/settings.json` to `.agents/settings.cjs`
  so hook-specific configuration can carry inline comments.

## Why

The earlier OpenSkills-plus-symlink model was not on-demand enough. It treated
skills as startup-visible infrastructure instead of explicit resources loaded
only when needed.

## Verification

- `node scripts/skills-smoke.mjs`
- `pnpm agents:check`
- `pnpm lint:md`
- `pnpm skills:list`
- `pnpm skills:search workflow`
- `pnpm skills:read engineering-workflow`
