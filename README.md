<![CDATA[# playground

<p align="center">
  <img src="https://img.shields.io/badge/turborepo-2.x-EF4444?style=flat-square&logo=turborepo&logoColor=white" alt="Turborepo" />
  <img src="https://img.shields.io/badge/pnpm-9.x-F69220?style=flat-square&logo=pnpm&logoColor=white" alt="pnpm" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node-24_LTS-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/license-MIT-brightgreen?style=flat-square" alt="MIT License" />
  <img src="https://img.shields.io/github/last-commit/mortenbroesby/playground?style=flat-square&logo=github" alt="Last Commit" />
</p>

<p align="center">
  A monorepo playground for experimenting with <strong>multi-agent Claude Code workflows</strong>.<br/>
  Built with pnpm workspaces + Turborepo — scaffolded by parallel AI agents working simultaneously in VS Code.
</p>

---

## What's inside

| Workspace | Package | Description |
|:---|:---|:---|
| [`apps/claude-agents`](apps/claude-agents/README.md) | `@playground/claude-agents` | Claude Code plugin marketplace — 75 plugins, 182 agents, 147 skills |
| [`packages/ui`](packages/ui) | `@playground/ui` | Shared React component library |
| [`packages/config`](packages/config) | `@playground/config` | Shared ESLint + TSConfig packages |

## Quick start

```bash
# 1. Install pnpm (if needed)
npm install -g pnpm@9

# 2. Install all workspace dependencies
pnpm install

# 3. Build everything (Turborepo resolves dependency order automatically)
pnpm turbo build
```

Other commands:

```bash
pnpm turbo type-check   # TypeScript across all packages
pnpm turbo lint         # ESLint across all packages
pnpm turbo dev          # Start all dev servers in parallel
```

## How this was built

Rather than working sequentially, this repo was assembled by a Claude Code **orchestrator** that dispatched parallel sub-agents — each owning a strict file boundary with zero overlap:

```
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

Each agent ran as an independent sub-process in VS Code — visible, parallel, coordinated. No agent touched another's files.

## Adding a workspace

```bash
# New app
mkdir apps/my-app && cd apps/my-app && pnpm init

# New package
mkdir packages/my-package && cd packages/my-package && pnpm init
```

Extend shared configs in the new `package.json`:

```json
{
  "devDependencies": {
    "@playground/tsconfig": "workspace:*",
    "@playground/eslint-config": "workspace:*"
  }
}
```

## Plugin marketplace

The `apps/claude-agents` workspace ships a full Claude Code plugin marketplace:

- **75 focused plugins** — single-purpose, minimal token footprint
- **182 specialized agents** — domain experts across architecture, languages, infra, security
- **147 agent skills** — progressive disclosure knowledge packages
- **95 commands** — scaffolding, security scanning, test automation

```bash
/plugin marketplace add wshobson/agents
/plugin install python-development
```

→ [Full marketplace docs](apps/claude-agents/README.md)

## Stack

| Tool | Version | Purpose |
|:---|:---|:---|
| [Turborepo](https://turbo.build) | 2.x | Build orchestration + caching |
| [pnpm](https://pnpm.io) | 9.x | Fast, disk-efficient package management |
| [TypeScript](https://www.typescriptlang.org) | 5.7 | Type safety across all workspaces |
| [Node.js](https://nodejs.org) | 24 LTS | Runtime |

## License

MIT — see [LICENSE](LICENSE)
]]>
