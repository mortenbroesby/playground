# Turborepo Monorepo Pivot — Design Spec

**Date:** 2026-04-05
**Status:** Approved

## Overview

Transform the `playground` repo from a Claude Code plugin marketplace into a **pnpm + Turborepo monorepo playground** that showcases multi-agent Claude Code workflows. The pivot demonstrates Option A orchestration: one orchestrator spawns parallel sub-agents in VS Code, each owning an isolated workspace.

---

## Repository Architecture

```
playground/
├── apps/
│   └── claude-agents/          # existing plugin marketplace content (moved)
│       ├── plugins/
│       ├── docs/
│       ├── tools/
│       ├── CLAUDE.md
│       └── README.md           # app-level README for plugin marketplace
├── packages/
│   ├── config/                 # shared tooling configs
│   │   ├── eslint/
│   │   │   ├── base.js
│   │   │   └── package.json
│   │   ├── tsconfig/
│   │   │   ├── base.json
│   │   │   ├── nextjs.json
│   │   │   └── package.json
│   │   └── package.json
│   └── ui/                     # shared React component library
│       ├── src/
│       │   ├── components/
│       │   │   └── index.ts
│       │   └── index.ts
│       ├── tsconfig.json       # extends packages/config/tsconfig/base.json
│       └── package.json
├── turbo.json                  # pipeline: build, lint, type-check, dev
├── pnpm-workspace.yaml         # globs: apps/*, packages/*
├── package.json                # root — devDeps: turbo, typescript, prettier
├── .gitignore                  # updated: node_modules, .turbo, dist
└── README.md                   # pivoted: playground identity + multi-agent story
```

---

## Workspace Definitions

### `apps/claude-agents`
- Existing plugin marketplace content moved wholesale
- Gets its own `package.json` (`name: "@playground/claude-agents"`)
- Keeps its `CLAUDE.md` and existing `README.md` (updated to reflect app context)
- No build pipeline — markdown only, no turbo tasks

### `packages/config`
- `@playground/config` — zero-dependency, provides shareable configs
- Sub-packages: `eslint-config` and `tsconfig`
- ESLint base: flat config format, TypeScript-aware
- TSConfig base: strict mode, ESM, `"composite": true` for project references

### `packages/ui`
- `@playground/ui` — shared React component library skeleton
- Extends `@playground/config/tsconfig`
- Exports a single `Button` component as proof-of-concept
- Build: `tsc --build`

---

## Agent Orchestration Plan

Three waves of parallel sub-agents, dispatched by the main orchestrator thread:

### Wave 1 — Fully parallel (no dependencies)

| Agent | File Ownership | Responsibility |
|---|---|---|
| `root-scaffolder` | `turbo.json`, `pnpm-workspace.yaml`, root `package.json`, `.gitignore` | Turborepo + pnpm workspace plumbing |
| `config-builder` | `packages/config/**` | ESLint flat config + TSConfig base packages |
| `claude-agents-mover` | `apps/claude-agents/**` | Move existing content, write app-level `package.json` + `README.md` |

### Wave 2 — Unblocks after Wave 1

| Agent | File Ownership | Dependency | Responsibility |
|---|---|---|---|
| `ui-builder` | `packages/ui/**` | `config-builder` done | Component library skeleton using shared tsconfig |

### Wave 3 — Final synthesis

| Agent | File Ownership | Dependency | Responsibility |
|---|---|---|---|
| `readme-writer` | `/README.md` | All waves done | Root README: playground identity, multi-agent showcase narrative, workspace index |

**Strict file ownership:** No two agents touch the same file. Merge conflicts are architecturally impossible.

---

## Root README Pivot

The new root `README.md` tells this story:

1. **What this is** — a monorepo playground for experimenting with multi-agent Claude Code workflows
2. **How it was built** — parallel agents scaffolded each workspace simultaneously (with a diagram)
3. **What's inside** — workspace index linking to each app/package README
4. **How to use it** — `pnpm install`, `pnpm turbo build`, adding new workspaces

---

## Turbo Pipeline

```json
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "lint": {},
    "type-check": { "dependsOn": ["^build"] },
    "dev": { "persistent": true, "cache": false }
  }
}
```

---

## Success Criteria

- `pnpm install` works from root with no errors
- `pnpm turbo build` resolves workspace dependency order correctly
- All existing plugin content is intact under `apps/claude-agents/`
- Root README clearly communicates the playground identity
- The implementation itself demonstrates multi-agent parallel execution
