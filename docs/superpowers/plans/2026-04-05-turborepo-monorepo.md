# Turborepo Monorepo Pivot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the playground repo into a pnpm + Turborepo monorepo that showcases parallel multi-agent Claude Code workflows, with the existing plugin content moved to `apps/claude-agents` and shared `packages/config` and `packages/ui` workspaces.

**Architecture:** An orchestrator dispatches parallel sub-agents in three waves with strict file ownership boundaries — Wave 1 (root scaffolding + config + claude-agents move) runs fully in parallel, Wave 2 (ui package) unblocks after config is done, Wave 3 (README) synthesizes after everything completes.

**Tech Stack:** pnpm 9, Turborepo 2, TypeScript 5.4, React 18 (peer dep for ui package), Node 24

---

## File Map

**Created:**
- `turbo.json` — turbo pipeline config
- `pnpm-workspace.yaml` — workspace glob definitions
- `package.json` (root) — root package with turbo + ts devDeps
- `packages/config/package.json` — config umbrella package
- `packages/config/tsconfig/base.json` — shared strict TSConfig
- `packages/config/tsconfig/nextjs.json` — Next.js TSConfig extension
- `packages/config/tsconfig/package.json` — `@playground/tsconfig` package
- `packages/config/eslint/base.js` — shared ESLint flat config
- `packages/config/eslint/package.json` — `@playground/eslint-config` package
- `packages/ui/package.json` — `@playground/ui` package
- `packages/ui/tsconfig.json` — extends `@playground/tsconfig`
- `packages/ui/src/components/Button.tsx` — proof-of-concept component
- `packages/ui/src/index.ts` — package exports
- `apps/claude-agents/package.json` — `@playground/claude-agents` package
- `apps/claude-agents/README.md` — app-level README

**Moved:**
- `plugins/` → `apps/claude-agents/plugins/`
- `docs/` → `apps/claude-agents/docs/`
- `tools/` → `apps/claude-agents/tools/`
- `CLAUDE.md` → `apps/claude-agents/CLAUDE.md`
- `Makefile` → `apps/claude-agents/Makefile`

**Modified:**
- `README.md` (root) — full rewrite: playground identity + multi-agent story
- `.gitignore` — add `node_modules`, `.turbo`, `dist`

---

## Wave 1 — Dispatch these three tasks in parallel using `superpowers:dispatching-parallel-agents`

---

### Task 1: Root Monorepo Scaffolding

**Agent name:** `root-scaffolder`
**Files:**
- Create: `turbo.json`
- Create: `pnpm-workspace.yaml`
- Create: `package.json` (root)
- Modify: `.gitignore`

- [ ] **Step 1: Install pnpm globally**

```bash
npm install -g pnpm@9
pnpm --version
```
Expected: `9.x.x`

- [ ] **Step 2: Create root `package.json`**

Create `/Users/macbook/personal/playground/package.json`:

```json
{
  "name": "playground",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\" --ignore-path .gitignore"
  },
  "devDependencies": {
    "prettier": "^3.3.0",
    "turbo": "^2.3.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 3: Create `pnpm-workspace.yaml`**

Create `/Users/macbook/personal/playground/pnpm-workspace.yaml`:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 4: Create `turbo.json`**

Create `/Users/macbook/personal/playground/turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "lint": {},
    "type-check": {
      "dependsOn": ["^build"]
    },
    "dev": {
      "persistent": true,
      "cache": false
    }
  }
}
```

- [ ] **Step 5: Update `.gitignore`**

Read the existing `.gitignore` and append these lines at the bottom:

```
# Monorepo
node_modules/
.turbo/
dist/
*.tsbuildinfo
```

- [ ] **Step 6: Commit**

```bash
cd /Users/macbook/personal/playground
git add turbo.json pnpm-workspace.yaml package.json .gitignore
git commit -m "feat: add turborepo + pnpm workspace root scaffolding"
```

---

### Task 2: Shared Config Package

**Agent name:** `config-builder`
**Files:**
- Create: `packages/config/package.json`
- Create: `packages/config/tsconfig/package.json`
- Create: `packages/config/tsconfig/base.json`
- Create: `packages/config/tsconfig/nextjs.json`
- Create: `packages/config/eslint/package.json`
- Create: `packages/config/eslint/base.js`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p /Users/macbook/personal/playground/packages/config/tsconfig
mkdir -p /Users/macbook/personal/playground/packages/config/eslint
```

- [ ] **Step 2: Create umbrella `packages/config/package.json`**

```json
{
  "name": "@playground/config",
  "version": "0.0.1",
  "private": true,
  "description": "Shared configuration packages for the playground monorepo"
}
```

- [ ] **Step 3: Create `packages/config/tsconfig/package.json`**

```json
{
  "name": "@playground/tsconfig",
  "version": "0.0.1",
  "private": true,
  "files": ["*.json"],
  "exports": {
    "./base.json": "./base.json",
    "./nextjs.json": "./nextjs.json"
  }
}
```

- [ ] **Step 4: Create `packages/config/tsconfig/base.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

- [ ] **Step 5: Create `packages/config/tsconfig/nextjs.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["ES2017", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "preserve",
    "allowJs": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "composite": false
  }
}
```

- [ ] **Step 6: Create `packages/config/eslint/package.json`**

```json
{
  "name": "@playground/eslint-config",
  "version": "0.0.1",
  "private": true,
  "main": "./base.js",
  "files": ["*.js"],
  "peerDependencies": {
    "eslint": ">=9.0.0"
  }
}
```

- [ ] **Step 7: Create `packages/config/eslint/base.js`**

```js
/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  {
    rules: {
      "no-unused-vars": "warn",
      "no-console": "warn",
    },
  },
];
```

- [ ] **Step 8: Commit**

```bash
cd /Users/macbook/personal/playground
git add packages/config/
git commit -m "feat: add @playground/tsconfig and @playground/eslint-config packages"
```

---

### Task 3: Move Claude Agents Content to `apps/claude-agents`

**Agent name:** `claude-agents-mover`
**Files:**
- Move: `plugins/` → `apps/claude-agents/plugins/`
- Move: `docs/` → `apps/claude-agents/docs/`
- Move: `tools/` → `apps/claude-agents/tools/`
- Move: `CLAUDE.md` → `apps/claude-agents/CLAUDE.md`
- Move: `Makefile` → `apps/claude-agents/Makefile`
- Create: `apps/claude-agents/package.json`
- Create: `apps/claude-agents/README.md`

- [ ] **Step 1: Create `apps/claude-agents` directory and move content**

```bash
mkdir -p /Users/macbook/personal/playground/apps/claude-agents
cd /Users/macbook/personal/playground

# Move directories
git mv plugins apps/claude-agents/plugins
git mv tools apps/claude-agents/tools
git mv CLAUDE.md apps/claude-agents/CLAUDE.md
git mv Makefile apps/claude-agents/Makefile

# Move docs (excluding the superpowers specs/plans we just created)
mkdir -p apps/claude-agents/docs
git mv docs/plugins.md apps/claude-agents/docs/plugins.md
git mv docs/agents.md apps/claude-agents/docs/agents.md
git mv docs/agent-skills.md apps/claude-agents/docs/agent-skills.md
git mv docs/usage.md apps/claude-agents/docs/usage.md
git mv docs/architecture.md apps/claude-agents/docs/architecture.md
git mv docs/plugin-eval.md apps/claude-agents/docs/plugin-eval.md
```

Note: `docs/superpowers/` stays at root — it belongs to the monorepo, not the claude-agents app.

- [ ] **Step 2: Create `apps/claude-agents/package.json`**

```json
{
  "name": "@playground/claude-agents",
  "version": "0.0.1",
  "private": true,
  "description": "Claude Code plugin marketplace — 75 focused plugins, 182 agents, 147 skills, 95 commands"
}
```

- [ ] **Step 3: Create `apps/claude-agents/README.md`**

```markdown
# claude-agents

Claude Code plugin marketplace — 75 focused plugins, 182 agents, 147 skills, 95 commands.

Part of the [playground monorepo](../../README.md).

## Overview

This workspace contains a comprehensive production-ready system of specialized AI agents,
agent skills, and commands organized into focused, single-purpose plugins for Claude Code.

- **75 Focused Plugins** — Granular, single-purpose plugins optimized for minimal token usage
- **182 Specialized Agents** — Domain experts across architecture, languages, infrastructure, quality
- **147 Agent Skills** — Modular knowledge packages with progressive disclosure
- **95 Commands** — Optimized utilities for scaffolding, security, testing, and infrastructure

## Quick Start

```bash
/plugin marketplace add wshobson/agents
/plugin install python-development
```

## Documentation

- [Plugin Reference](docs/plugins.md)
- [Agent Reference](docs/agents.md)
- [Agent Skills](docs/agent-skills.md)
- [Usage Guide](docs/usage.md)
- [Architecture](docs/architecture.md)
- [PluginEval](docs/plugin-eval.md)
```

- [ ] **Step 4: Commit**

```bash
cd /Users/macbook/personal/playground
git add apps/claude-agents/
git commit -m "feat: move claude-agents content into apps/claude-agents workspace"
```

---

## Wave 2 — Run after Wave 1 completes (requires `@playground/tsconfig`)

---

### Task 4: Shared UI Package

**Agent name:** `ui-builder`
**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/src/components/Button.tsx`
- Create: `packages/ui/src/index.ts`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p /Users/macbook/personal/playground/packages/ui/src/components
```

- [ ] **Step 2: Create `packages/ui/package.json`**

```json
{
  "name": "@playground/ui",
  "version": "0.0.1",
  "private": true,
  "description": "Shared React component library for the playground monorepo",
  "main": "./src/index.ts",
  "scripts": {
    "build": "tsc --build",
    "type-check": "tsc --noEmit",
    "lint": "eslint src/"
  },
  "devDependencies": {
    "@playground/eslint-config": "workspace:*",
    "@playground/tsconfig": "workspace:*",
    "@types/react": "^18.3.0",
    "typescript": "^5.7.0"
  },
  "peerDependencies": {
    "react": "^18.0.0"
  }
}
```

- [ ] **Step 3: Create `packages/ui/tsconfig.json`**

```json
{
  "extends": "@playground/tsconfig/base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Create `packages/ui/src/components/Button.tsx`**

```tsx
import type { ButtonHTMLAttributes } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

export function Button({
  variant = 'primary',
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      data-variant={variant}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 5: Create `packages/ui/src/index.ts`**

```ts
export { Button } from './components/Button'
export type { ButtonProps } from './components/Button'
```

- [ ] **Step 6: Commit**

```bash
cd /Users/macbook/personal/playground
git add packages/ui/
git commit -m "feat: add @playground/ui shared component library skeleton"
```

---

## Wave 3 — Run after all workspaces exist

---

### Task 5: Install Dependencies and Verify

**Agent name:** orchestrator (main thread)

- [ ] **Step 1: Install all workspace dependencies**

```bash
cd /Users/macbook/personal/playground
pnpm install
```

Expected: turbo installed, workspace symlinks created, no errors.

- [ ] **Step 2: Verify workspace resolution**

```bash
pnpm ls --depth 1
```

Expected output should list:
```
playground
├── @playground/claude-agents (apps/claude-agents)
├── @playground/config (packages/config)
├── @playground/tsconfig (packages/config/tsconfig)
├── @playground/eslint-config (packages/config/eslint)
└── @playground/ui (packages/ui)
```

- [ ] **Step 3: Run turbo build**

```bash
pnpm turbo build
```

Expected: `@playground/tsconfig` and `@playground/eslint-config` build first, then `@playground/ui` (which depends on them). `@playground/claude-agents` has no build task — skipped. No errors.

- [ ] **Step 4: Commit lockfile**

```bash
cd /Users/macbook/personal/playground
git add pnpm-lock.yaml
git commit -m "chore: add pnpm lockfile after workspace install"
```

---

### Task 6: Root README Rewrite

**Agent name:** `readme-writer`
**Files:**
- Modify: `README.md` (root) — full rewrite

- [ ] **Step 1: Rewrite root `README.md`**

Replace the entire contents of `/Users/macbook/personal/playground/README.md` with:

```markdown
# playground

A monorepo playground for experimenting with **multi-agent Claude Code workflows**.

Built with [pnpm](https://pnpm.io) workspaces + [Turborepo](https://turbo.build) — and scaffolded by parallel Claude agents working simultaneously in VS Code.

## How this was built

This repo was assembled using Claude Code's parallel sub-agent dispatch. Rather than one agent working sequentially, the orchestrator spawned multiple agents simultaneously — each owning an isolated workspace with zero file overlap:

```
Orchestrator
├── Wave 1 (parallel)
│   ├── root-scaffolder   → turbo.json, pnpm-workspace.yaml, root package.json
│   ├── config-builder    → packages/config (tsconfig + eslint)
│   └── claude-agents-mover → apps/claude-agents (existing plugin content)
├── Wave 2 (after Wave 1)
│   └── ui-builder        → packages/ui (component library)
└── Wave 3 (final)
    └── readme-writer     → this file
```

Each agent ran in its own VS Code terminal instance — visible, parallel, coordinated.

## Workspaces

| Workspace | Package | Description |
|---|---|---|
| `apps/claude-agents` | `@playground/claude-agents` | Claude Code plugin marketplace — 75 plugins, 182 agents, 147 skills |
| `packages/config` | `@playground/config` | Shared ESLint + TSConfig packages |
| `packages/ui` | `@playground/ui` | Shared React component library |

## Getting Started

```bash
# Install dependencies across all workspaces
pnpm install

# Build all packages (respects dependency order)
pnpm turbo build

# Type-check everything
pnpm turbo type-check

# Lint everything
pnpm turbo lint
```

## Adding a New App or Package

```bash
# New app
mkdir apps/my-app && cd apps/my-app
pnpm init

# New package
mkdir packages/my-package && cd packages/my-package
pnpm init
```

Then reference shared configs:
```json
{
  "devDependencies": {
    "@playground/tsconfig": "workspace:*",
    "@playground/eslint-config": "workspace:*"
  }
}
```

## Stack

- **Package manager:** pnpm 9
- **Build system:** Turborepo 2
- **Language:** TypeScript 5.7
- **Node:** 24 LTS

## Plugin Marketplace

The `apps/claude-agents` workspace is a full Claude Code plugin marketplace.
See [apps/claude-agents/README.md](apps/claude-agents/README.md) for installation and usage.

## License

MIT
```

- [ ] **Step 2: Commit**

```bash
cd /Users/macbook/personal/playground
git add README.md
git commit -m "docs: rewrite root README — pivot to playground monorepo identity"
```

---

## Final Verification

- [ ] **Check repo structure**

```bash
find /Users/macbook/personal/playground -maxdepth 3 \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "*/.turbo/*" \
  | sort
```

Expected: `apps/claude-agents/`, `packages/config/`, `packages/ui/` all present with correct contents.

- [ ] **Check existing plugin content is intact**

```bash
ls /Users/macbook/personal/playground/apps/claude-agents/plugins/ | head -10
```

Expected: existing plugin directories are all present.

- [ ] **Final commit summary**

```bash
cd /Users/macbook/personal/playground
git log --oneline -8
```

Should show 6+ commits from this session, each scoped to a single workspace.
