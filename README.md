# playground

A monorepo playground for experimenting with **multi-agent Claude Code workflows**.

Built with [pnpm](https://pnpm.io) workspaces + [Turborepo](https://turbo.build) — and scaffolded by parallel Claude agents working simultaneously in VS Code.

## How this was built

This repo was assembled using Claude Code's parallel sub-agent dispatch. Rather than one agent working sequentially, the orchestrator spawned multiple agents simultaneously — each owning an isolated workspace with zero file overlap:

```
Orchestrator
├── Wave 1 (parallel)
│   ├── root-scaffolder     → turbo.json, pnpm-workspace.yaml, root package.json
│   ├── config-builder      → packages/config (tsconfig + eslint)
│   └── claude-agents-mover → apps/claude-agents (existing plugin content)
├── Wave 2 (after Wave 1)
│   └── ui-builder          → packages/ui (React component library)
└── Wave 3 (final)
    └── readme-writer       → this file
```

Each agent ran as an independent sub-process in VS Code — visible, parallel, coordinated.

## Workspaces

| Workspace | Package | Description |
|---|---|---|
| [`apps/claude-agents`](apps/claude-agents/README.md) | `@playground/claude-agents` | Claude Code plugin marketplace — 75 plugins, 182 agents, 147 skills |
| [`packages/config`](packages/config) | `@playground/config` | Shared ESLint + TSConfig packages |
| [`packages/ui`](packages/ui) | `@playground/ui` | Shared React component library |

## Getting Started

```bash
# Install pnpm (if not already installed)
npm install -g pnpm@9

# Install dependencies across all workspaces
pnpm install

# Build all packages (respects dependency order via Turborepo)
pnpm turbo build

# Type-check everything
pnpm turbo type-check

# Lint everything
pnpm turbo lint
```

## Adding a New Workspace

```bash
# New app
mkdir apps/my-app && cd apps/my-app && pnpm init

# New package
mkdir packages/my-package && cd packages/my-package && pnpm init
```

Reference shared configs in the new workspace's `package.json`:

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

The `apps/claude-agents` workspace is a full Claude Code plugin marketplace with 75 focused plugins, 182 specialized agents, and 147 skills. See [apps/claude-agents/README.md](apps/claude-agents/README.md) for installation and usage.

## License

MIT
