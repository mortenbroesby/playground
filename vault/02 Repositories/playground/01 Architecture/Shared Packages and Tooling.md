---
type: repo-architecture
repo: playground
status: active
summary: Shared packages are intentionally thin: ui exports reusable components, types exports cross-workspace contracts, and config centralizes TypeScript and ESLint settings.
keywords:
  - shared packages
  - turborepo
  - pnpm workspaces
  - shared ui
  - shared types
  - shared config
related_paths:
  - packages/ui/src
  - packages/types/src/index.ts
  - packages/config
  - package.json
  - turbo.json
tags:
  - type/architecture
  - repo/playground
---

# Shared Packages and Tooling

## Workspace Shape

The repo is a `pnpm` and Turborepo monorepo. Root scripts delegate build, lint, test, and
type-check work to workspace scripts through Turbo where practical.

`turbo.json` keeps task wiring simple:

- `build` depends on upstream builds and emits `dist/**` plus `.next/**`.
- `test` and `type-check` depend on upstream builds.
- `dev` is persistent and uncached.

## Shared Packages

`packages/ui` exports reusable React UI primitives and tokens used by host and remote surfaces.

`packages/types` currently owns the shared `Todo` shape. Keep it narrow; only promote types here
when multiple workspaces genuinely need the contract.

`packages/config` owns shared TypeScript and ESLint configuration. New workspaces should reuse this
instead of copying local config by hand.

## Guardrails

Use `pnpm` only. Prefer workspace-local scripts for one-workspace changes, then broaden to Turbo
checks when a change touches shared packages, shared config, or cross-workspace behavior.
