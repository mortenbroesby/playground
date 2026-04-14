# AGENTS.md

This file provides guidance to coding agents working in `packages/config/`.

## Scope Guidelines

- Follow the repository root `AGENTS.md` first, then this file for shared
  config work.
- Keep changes scoped to reusable TypeScript and ESLint presets.
- Treat config edits as structural changes and update docs or rules when setup
  expectations change.

## Structure

- `eslint/` - shared ESLint presets
- `tsconfig/` - shared TypeScript base configs

## Verification Guidance

- Config changes should be checked through the affected workspace `build`,
  `lint`, or `type-check` commands rather than through package-local scripts.
- Broaden verification to consuming workspaces when a preset change affects
  multiple packages.

## Architecture Notes

- This package publishes presets, not runtime behavior.
- Keep compatibility expectations explicit when changing shared tooling.
