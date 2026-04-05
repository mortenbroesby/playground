<h1 align="center">
  playground
</h1>

<p align="center">
  <img src="https://img.shields.io/badge/turborepo-2.x-EF4444?style=flat-square&logo=turborepo&logoColor=white" alt="Turborepo" />
  <img src="https://img.shields.io/badge/pnpm-9.x-F69220?style=flat-square&logo=pnpm&logoColor=white" alt="pnpm" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node-24_LTS-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/license-MIT-brightgreen?style=flat-square" alt="MIT License" />
  <img src="https://img.shields.io/github/last-commit/mortenbroesby/playground?style=flat-square&logo=github" alt="Last Commit" />
</p>

A monorepo playground for experimenting with **multi-agent workflows** and a production-minded **micro frontend architecture demo**.

Apps and packages in this repo:

- [host](./apps/host) — Next.js orchestration shell for runtime micro frontend composition
- [todo-input](./apps/todo-input) — independently buildable todo-creation micro frontend
- [todo-list](./apps/todo-list) — independently buildable list interaction micro frontend
- [todo-stats](./apps/todo-stats) — independently buildable stats micro frontend
- [compendium](./apps/compendium) — workspace launchpad shell
- [claude-agents](./apps/claude-agents) — Claude Code plugin marketplace
- [types](./packages/types) — shared typed contracts/events used by host + remotes
- [ui](./packages/ui) — shared React component library
- [config](./packages/config) — shared ESLint + TypeScript configs

## Monorepo

This repo uses:

- [pnpm workspaces](https://pnpm.io/workspaces) — splits the codebase into focused packages
- [Turborepo](https://turbo.build/repo) — runs and caches tasks (build, lint, type-check) across packages in dependency order

## Getting Started

```bash
# Enable pnpm via Corepack if needed
corepack enable

# Install all workspace dependencies
pnpm install

# Build all packages
pnpm turbo build
```

## Micro frontend demo

The todo demo uses **Next.js as the host orchestrator** and runtime-loaded remote modules from independently owned apps:

- `apps/host` composes remote micro frontends and owns layout, routing, resilience, and shell UX.
- `apps/todo-input`, `apps/todo-list`, and `apps/todo-stats` each expose a minimal `mount` entrypoint consumed at runtime.
- `packages/types` defines the durable typed contract (`Todo`, bridge API, and domain events).

Run all dev servers:

```bash
pnpm dev
```

Or run only the micro frontend demo stack:

```bash
pnpm --filter @playground/host dev
pnpm --filter @playground/todo-input dev
pnpm --filter @playground/todo-list dev
pnpm --filter @playground/todo-stats dev
```

## Table of Contents

### Development

- [Adding a workspace](#adding-a-workspace)
  - **TLDR**: Create a directory under `apps/` or `packages/`, run `pnpm init`, and reference `@playground/tsconfig` and `@playground/eslint-config` as dev dependencies.
- [How this was built](#how-this-was-built)
  - **TLDR**: An orchestrator dispatched 5 parallel Claude sub-agents in 3 waves — each agent owned an isolated set of files with zero overlap. The entire monorepo was scaffolded without sequential bottlenecks.
- [Plugin marketplace](./apps/claude-agents/README.md)
  - **TLDR**: Install any of 75 focused Claude Code plugins via `/plugin install`. Each plugin loads only its own agents, skills, and commands — no unnecessary context overhead.

### Commands

| Command | Description |
|:---|:---|
| `pnpm turbo build` | Build all packages in dependency order |
| `pnpm turbo type-check` | TypeScript check across all workspaces |
| `pnpm turbo lint` | ESLint across all workspaces |
| `pnpm turbo dev` | Start all dev servers in parallel |
| `pnpm lint:md` | Lint workspace READMEs with markdownlint |

## Adding a workspace

```bash
# New app
mkdir apps/my-app && cd apps/my-app && pnpm init

# New package
mkdir packages/my-package && cd packages/my-package && pnpm init
```

Add shared configs to `package.json`:

```json
{
  "devDependencies": {
    "@playground/tsconfig": "workspace:*",
    "@playground/eslint-config": "workspace:*"
  }
}
```

## How this was built

An orchestrator dispatched parallel sub-agents — each owning a strict file boundary with zero overlap:

```text
Orchestrator
├── Wave 1 ─ parallel ──────────────────────────────────────────────┐
│   ├── root-scaffolder     turbo.json · pnpm-workspace.yaml        │
│   ├── config-builder      packages/config (tsconfig + eslint)     │
│   └── claude-agents-mover apps/claude-agents (plugin content)     │
│                                                                    │
├── Wave 2 ─ after Wave 1 ──────────────────────────────────────────┤
│   └── ui-builder          packages/ui (React component library)   │
│                                                                    │
└── Wave 3 ─ final ─────────────────────────────────────────────────┘
    └── readme-writer       README.md
```

Each agent ran as an independent sub-process in VS Code — visible, parallel, coordinated.

## License

MIT — see [LICENSE](LICENSE)
