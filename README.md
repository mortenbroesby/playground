<p align="center">
  <img src="docs/logo.png" alt="playground" width="600" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/turborepo-2.x-EF4444?style=flat-square&logo=turborepo&logoColor=white" alt="Turborepo" />
  <img src="https://img.shields.io/badge/pnpm-9.x-F69220?style=flat-square&logo=pnpm&logoColor=white" alt="pnpm" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node-24_LTS-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/license-MIT-brightgreen?style=flat-square" alt="MIT License" />
  <img src="https://img.shields.io/github/last-commit/mortenbroesby/playground?style=flat-square&logo=github" alt="Last Commit" />
</p>

# playground

A monorepo for experimenting with multi-agent workflows, injected microfrontends, and the ongoing
personal-site direction for `@mortenbroesby`.

## Current state

The repo currently centers on one Vite host app with two clear modes:

- a calmer public-site shell for `/`, `/about`, `/writing`, and `/uses`
- a denser playground shell for `/playground`, `/playground/system`, `/playground/todo`, and `/playground/uplink`

The host now acts as the public personal site, with:

- a real home page at `/`
- MDX-backed writing posts under `/writing`
- a canonical `/uses` route, with `/uses/gear` kept as a legacy redirect
- shared page metadata and a unified public-page layout across the main public routes

The microfrontend boundary is still present, but it is intentionally narrower now:

- `todo-app` is the sole live injected remote and remains the main host-to-remote contract demo
- `uplink` is still part of the repo, but it now runs as a host-local playground surface instead of as the primary remote example

Current repo surfaces:

- [Host app](./apps/host) for the public site, playground shell, and route composition
- [Todo remote](./packages/remotes/todo-app) for the sole injected microfrontend example
- [Uplink game package](./packages/remotes/uplink-game) for the game surface that now plugs into the host-local playground flow
- [Shared UI](./packages/ui) for reusable React components
- [Shared types](./packages/types) for host and remote contracts
- [Shared config](./packages/config) for TypeScript and ESLint setup
- [`plugins/`](./plugins) for local plugin experiments and tooling content

## Contributing guidelines

- Use `pnpm` only for package management and scripts.
- Prefer small, workspace-scoped changes over broad repo edits.
- Treat the root README as the overview and keep evolving direction in `docs/`.
- Leave `docs/superpowers` alone unless the work is explicitly about that track.

## Monorepo

This repo uses:

- [pnpm workspaces](https://pnpm.io/workspaces) to split the codebase into focused packages
- [Turborepo](https://turbo.build/repo) to run and cache build, lint, test, and type-check tasks

## Getting started

```bash
corepack enable
pnpm install
pnpm turbo lint && pnpm lint:md
pnpm turbo type-check
```

Useful local commands:

```bash
pnpm turbo dev
pnpm dev:web
pnpm test
pnpm test:integration
```

## Documentation

The root README is the front door. The more detailed and more fluid thinking lives in `docs/`.

### Start here

- [Docs index](./docs/README.md) for the docs map
- [Obsidian repository brain](./docs/obsidian/README.md) for the vault bootstrap and note model used to keep structured repo memory
- [Roadmap](./docs/ideas/roadmap.md) for where the repo is now and the most believable next steps
- [Parking lot](./docs/ideas/parking-lot.md) for good ideas that are intentionally not active
- [Host README](./apps/host/README.md) for the current shell and microfrontend setup

### Planning tracks

- [`docs/ideas/`](./docs/ideas/) is the lightweight planning layer for current direction
- [`docs/superpowers/`](./docs/superpowers/) is a separate deeper planning and spec workstream

## Table of contents

### Development

- [Getting started](#getting-started)
- [Documentation](#documentation)
- [Commands](#commands)
- [Repository structure](#repository-structure)
- [Adding a workspace](#adding-a-workspace)
- [How this is structured](#how-this-is-structured)

### Planning

- [Roadmap](./docs/ideas/roadmap.md)
  - **TLDR**: The repo is strongest as a personal-site host plus one deliberate injected remote,
    with the next likely steps being stronger public-site structure, project surfaces, and better
    shared UI primitives.
- [Parking lot](./docs/ideas/parking-lot.md)
  - **TLDR**: Personal website refinements, a hacker-inspired UI pass, and possible realtime ideas
    are worth keeping around without treating them as immediate priorities.
- [Superpowers docs](./docs/superpowers/)
  - **TLDR**: This is a separate planning track and should be left alone unless the work is
    explicitly about Superpowers.

### Workspaces

- [Host app](./apps/host)
- [Host setup notes](./apps/host/README.md)
- [Todo remote](./packages/remotes/todo-app)
- [Shared UI](./packages/ui)
- [Shared types](./packages/types)
- [Shared config](./packages/config)

## Commands

| Command                 | Description                                                                   |
| :---------------------- | :---------------------------------------------------------------------------- |
| `pnpm turbo build`      | Build all packages in dependency order                                        |
| `pnpm turbo type-check` | TypeScript check across all workspaces                                        |
| `pnpm turbo lint`       | ESLint across all workspaces                                                  |
| `pnpm turbo dev`        | Start all dev servers in parallel                                             |
| `pnpm dev:web`          | Start the host app and open `/`                                               |
| `pnpm test`             | Run workspace tests through Turborepo                                         |
| `pnpm test:integration` | Run the todo remote integration test suite                                    |
| `pnpm lint:md`          | Lint root docs, workspace READMEs, and active planning docs with markdownlint |

## Repository structure

```text
apps/
  host/                   Vite host with public routes, playground routes, and page composition
packages/
  remotes/todo-app/       Injected todo microfrontend package
  remotes/uplink-game/    Uplink gameplay package used by the host playground route
  ui/                     Shared React components
  types/                  Shared host and remote contracts
  config/                 Shared TypeScript and ESLint configuration
docs/
  ideas/                  Lightweight roadmap and parking-lot notes
  superpowers/            Separate planning and spec workstream
plugins/                  Local plugin experiments and tooling content
```

## Adding a workspace

```bash
mkdir apps/my-app && cd apps/my-app && pnpm init
mkdir packages/my-package && cd packages/my-package && pnpm init
```

Add shared configs to the new workspace `package.json`:

```json
{
  "devDependencies": {
    "@playground/tsconfig": "workspace:*",
    "@playground/eslint-config": "workspace:*"
  }
}
```

## How this is structured

The repo is intentionally small right now:

- one deployable host app that now serves both the public personal site and the playground shell
- one injected remote that still proves the host-to-remote boundary without turning the repo into a remote zoo
- one host-local game surface that keeps the playground expressive without forcing every module through the same composition model
- shared UI, type, and config packages that keep experiments reusable
- docs that separate active direction from parked ideas and deeper planning tracks

That keeps the repo flexible enough to explore without collapsing into a pile of disconnected demos.

## License

MIT — see [LICENSE](./LICENSE)
