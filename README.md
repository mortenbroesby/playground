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

A monorepo playground for experimenting with **multi-agent Claude Code workflows**, injected microfrontends, and a personal-site pivot for `@mortenbroesby`.

Apps and packages in this repo:

- [host](./apps/host) — Vite shell that serves the todo microfrontend and the `@mortenbroesby` uses page
- [todo-app](./packages/remotes/todo-app) — injected todo microfrontend mounted by the host at runtime
- [ui](./packages/ui) — Shared React component library
- [config](./packages/config) — Shared ESLint + TypeScript configs

## Monorepo

This repo uses:

- [pnpm workspaces](https://pnpm.io/workspaces) — splits the codebase into focused packages
- [Turborepo](https://turbo.build/repo) — runs and caches tasks (build, lint, type-check) across packages in dependency order

## Getting Started

```bash
# Enable pnpm if needed
corepack enable

# Install all workspace dependencies
pnpm install

# Build all workspaces
pnpm turbo build
```

## Table of Contents

### Development

- [Adding a workspace](#adding-a-workspace)
  - **TLDR**: Create a directory under `apps/` or `packages/`, run `pnpm init`, and reference `@playground/tsconfig` and `@playground/eslint-config` as dev dependencies.
- [How this was built](#how-this-was-built)
  - **TLDR**: Keep `apps/` for deployable surfaces, put shared code in `packages/`, and keep injected microfrontends in workspace packages that the host can load directly.
- [Microfrontend setup](./apps/host/README.md)
  - **TLDR**: The host mounts the todo app from the workspace with a client-side dynamic import and an explicit host↔mFE contract.
- [Docs index](./docs/README.md)
  - **TLDR**: Use `docs/ideas` for lightweight direction and `docs/superpowers` for the deeper planning track.

### Commands

| Command                 | Description                                                                   |
| :---------------------- | :---------------------------------------------------------------------------- |
| `pnpm turbo build`      | Build all packages in dependency order                                        |
| `pnpm turbo type-check` | TypeScript check across all workspaces                                        |
| `pnpm turbo lint`       | ESLint across all workspaces                                                  |
| `pnpm turbo dev`        | Start all dev servers in parallel                                             |
| `pnpm test`             | Run workspace tests through Turborepo                                         |
| `pnpm dev:web`          | Start the host app and open `/todo`                                           |
| `pnpm lint:md`          | Lint root docs, workspace READMEs, and active planning docs with markdownlint |

## Microfrontends

The repo ships a single deployable web app, [`apps/host`](./apps/host), plus an injected microfrontend package in [`packages/remotes/todo-app`](./packages/remotes/todo-app).

- Local development: `pnpm turbo dev`
- Web-only local development: `pnpm dev:web` (opens the browser automatically)
- Host route: `/todo`
- Personal route: `/uses`
- Composition mode: injected workspace module loaded client-side
- Communication model: host gets mFE events and can push state back into the mounted app
- Workspace tests: `pnpm test`
- Todo integration coverage: `pnpm test:integration`

This keeps a real microfrontend boundary without relying on a separate `remoteEntry.js` dev server.

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

The repo is organized around a single deployable host app and separately built supporting workspaces:

```text
apps/host                  Vite shell with `/todo` and `/uses`
packages/remotes/todo-app  Injected todo microfrontend package
packages/ui                Shared React components
packages/config            Shared TypeScript and ESLint config
packages/types             Shared TypeScript types
plugins/                   Claude Code plugin content for repo workflows
```

That split keeps deployment concerns simple while preserving a real runtime microfrontend boundary.

## License

MIT — see [LICENSE](LICENSE)
