<p align="center">
  <img src="docs/logo.png" alt="playground" width="600" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/turborepo-2.x-EF4444?style=flat-square&logo=turborepo&logoColor=white" alt="Turborepo" />
  <img src="https://img.shields.io/badge/pnpm-9.x-F69220?style=flat-square&logo=pnpm&logoColor=white" alt="pnpm" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node-24.x-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/license-MIT-brightgreen?style=flat-square" alt="MIT License" />
  <img src="https://img.shields.io/github/last-commit/mortenbroesby/playground?style=flat-square&logo=github" alt="Last Commit" />
</p>

# playground

`playground` is a `pnpm` + Turborepo monorepo for three connected tracks:

- a real personal-site host
- a narrower but still intentional microfrontend composition seam
- local tooling for multi-agent code and memory workflows

The repo is opinionated by design: one host owns the main experience, one live remote still proves
the host-to-remote contract, and the supporting tooling is built inside the same workspace instead
of being treated as throwaway experiments.

## Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Security](#security)
- [How to Contribute](#how-to-contribute)
- [What's Next](#whats-next)
- [Documentation](#documentation)
- [License](#license)
- [Acknowledgements](#acknowledgements)
- [Author](#author)

## About

The current repo centers on a Vite host app with two route-level shells:

- a calmer public-site shell for `/`, `/about`, `/writing`, and `/uses`
- a denser playground shell for `/playground`, `/playground/system`, `/playground/todo`, and `/playground/uplink`

The microfrontend boundary is still present, but it is intentionally narrower now:

- `@playground/todo-app` is the sole live injected remote and the main mount-contract proof
- `@playground/uplink-game` stays in the repo as a host-local playground surface instead of the
  primary remote example

Alongside the product surfaces, the monorepo also wires local agent tooling:

- `@mortenbroesby/astrograph` from the sibling standalone repository for local
  indexed code retrieval
- `@playground/obsidian-memory` for repo-local architecture and decision memory

## Features

- Public-site host with shared layout, route composition, and MDX-backed writing
- Distinct playground routes that keep experiments separate from the public shell
- Workspace-mounted todo microfrontend with a deliberate host-to-remote contract
- Host-local game surface that avoids forcing every feature through the remote seam
- Shared UI, type, and config packages for reuse across workspaces
- Repo-local tooling for code indexing and Obsidian-backed memory retrieval
- Markdown, workflow, and agent documentation kept in-repo instead of scattered externally

## Tech Stack

- `pnpm` workspaces for package management
- `Turborepo` for task orchestration and caching
- `TypeScript` across apps, packages, and tools
- `React` + `Vite` for app surfaces
- `Vitest` for workspace tests
- `ESLint`, `Prettier`, and `markdownlint-cli2` for code and docs hygiene
- `SQLite` inside Astrograph for local symbol and file indexing
- `Obsidian` vault content plus local retrieval tooling for durable repo memory

## Architecture

At a high level, the repo is split into four layers:

1. `apps/host` owns the real user-facing shell, routing, page composition, and public-site
   experience.
2. `packages/remotes/*` holds domain-specific product surfaces that the host can mount or consume.
3. `packages/ui`, `packages/types`, and `packages/config` provide the shared primitives and
   contracts that keep the workspace consistent.
4. `tools/*` provides repo-owned agent infrastructure for durable memory;
   Astrograph is consumed from the sibling standalone repository.

Current route and package shape:

- `/` and the public routes live in the host
- `/playground/todo` mounts the todo remote from the workspace with a client-side dynamic import
- `/playground/uplink` uses the game package as a host-local surface
- the admin app exists as a separate workspace for visualizing the vault task board

## Project Structure

```text
apps/
  admin/                  Admin board for visualizing the vault task board
  host/                   Public site, playground shell, routes, and composition
packages/
  config/                 Shared TypeScript and ESLint presets
  remotes/
    todo-app/             Sole live injected microfrontend example
    uplink-game/          Host-local gameplay package used by the playground
  types/                  Shared contracts between host and feature packages
  ui/                     Shared React UI primitives
tools/
  obsidian-memory/        Repo-local memory indexing and retrieval tools
docs/
  ideas/                  Lightweight roadmap and parking-lot notes
  obsidian/               Vault bootstrap and memory-model documentation
  superpowers/            Separate deeper planning/spec track
vault/                    Durable repo notes, decisions, sessions, and tasks
```

## Getting Started

### Requirements

- Node `24.x` via [`.nvmrc`](./.nvmrc)
- `pnpm` `9.15.9` via the root `packageManager` field

### Install

```bash
corepack enable
nvm use
pnpm install
```

### Common Commands

```bash
pnpm dev:web
pnpm turbo dev
pnpm turbo type-check
pnpm turbo lint
pnpm test
pnpm test:integration
pnpm lint:md
```

### Verification Baseline

For a normal local sanity pass:

```bash
pnpm turbo type-check
pnpm turbo lint
pnpm test
```

For docs-only changes, `pnpm lint:md` is usually enough.

## Configuration

The main optional local configuration is the Spotify now-playing widget used by the host footer.

Create a local env file:

```bash
cp apps/host/.env.example apps/host/.env.local
```

Required variables:

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REFRESH_TOKEN`

If those values are absent, the widget stays hidden and the related API surface reports a
non-playing state.

Useful repo-level tooling commands:

- `pnpm astrograph:refresh` refreshes the Astrograph index planner for the repo
- `pnpm rag:index` refreshes the Obsidian memory index
- `pnpm agents:check` validates expected local agent setup

## Security

- Do not commit `.env.local` files or credentials.
- Keep Spotify credentials local to `apps/host/.env.local`.
- Treat repo-owned memory and index output as local workspace tooling, not a place to store
  secrets.
- Leave generated output untouched: `dist/`, `.next/`, `.turbo/`, and `coverage/`.

## How to Contribute

- Use `pnpm` only. Do not introduce `npm` or `yarn`.
- Keep changes scoped to the workspace that owns the behavior.
- Prefer small, reviewable changes over broad repo-wide edits.
- Update the relevant README, rule, hook doc, vault note, or AGENTS file when behavior,
  architecture, workflow, or setup expectations change.
- Unless the work is explicitly about that track, leave `docs/superpowers/` alone.

If you are working locally, these docs are the fastest entry points:

- [Root AGENTS guide](./AGENTS.md)
- [Repo workflow rules](./.agents/rules/repo-workflow.md)
- [Host README](./apps/host/README.md)

## What's Next?

The repo's current direction is intentionally focused:

- keep the host strong as a real personal site, not just a shell for demos
- preserve the playground as a distinct lab with a narrow remote seam
- keep growing the shared UI and contract layers incrementally
- continue proving the repo-local agent workflow against real daily use

For active planning and deferred ideas, start here:

- [Docs index](./docs/README.md)
- [Roadmap](./docs/ideas/roadmap.md)
- [Parking lot](./docs/ideas/parking-lot.md)

## Documentation

The root README is the front door. Deeper repo context lives in:

- [Docs index](./docs/README.md)
- [Obsidian repository brain](./docs/obsidian/README.md)
- [Host README](./apps/host/README.md)
- [Admin README](./apps/admin/README.md)
- [Todo remote README](./packages/remotes/todo-app/README.md)
- [Uplink game README](./packages/remotes/uplink-game/README.md)
- [UI package README](./packages/ui/README.md)
- [Types package README](./packages/types/README.md)
- [Config package README](./packages/config/README.md)
- [Astrograph repository](https://github.com/mortenbroesby/astrograph)
- [Obsidian memory README](./tools/obsidian-memory/README.md)

## License

MIT. See [LICENSE](./LICENSE).

## Acknowledgements

- `pnpm`, `Turborepo`, `Vite`, `React`, and `Vitest` for the core workspace foundation
- `Obsidian` for the repo-memory authoring model
- `Astrograph` and the repo-owned `obsidian-memory` tooling for keeping agent
  workflows grounded in local context

---

## Author

**Morten Broesby-Olsen** (mortenbroesby)

- GitHub: [@mortenbroesby](https://github.com/mortenbroesby)
- LinkedIn: [mortenbroesby](https://www.linkedin.com/in/morten-broesby-olsen/)

---

<p align="center">
  Made with ☕ and ⚡️ by Morten Broesby-Olsen
</p>
