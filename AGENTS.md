# AGENTS.md

This file provides guidance to coding agents when working in this repository.

## Scope Guidelines

- Keep changes scoped to the workspace that owns the behavior.
- Unless the task is explicitly about planning, do not modify `docs/superpowers/`.
- Treat the root `README.md` as the high-level overview and keep evolving direction in `docs/`.
- If more specific `AGENTS.md` files are added later, follow the most specific one for the files you change.

## Repository Overview

`playground` is a `pnpm` + Turborepo monorepo for experimenting with:

- multi-agent development workflows
- injected microfrontends and workspace-local remotes
- personal-site directions for `@mortenbroesby`
- local plugin and workflow experiments

## Monorepo Structure

- `apps/host/` - Vite host shell, personal-site routes, and microfrontend mounting
- `packages/remotes/todo-app/` - injected todo microfrontend
- `packages/remotes/uplink-game/` - injected game remote
- `packages/ui/` - shared React UI
- `packages/types/` - shared contracts
- `packages/config/` - shared TypeScript and ESLint config
- `docs/ideas/` - active lightweight planning
- `docs/superpowers/` - separate planning workstream
- `plugins/` - local plugin experiments and workflow content

## Development Guidance

- Use `pnpm` only. Do not introduce `npm` or `yarn` commands in docs, scripts, or hooks.
- Prefer deterministic repo scripts over ad-hoc shell pipelines.
- Prefer the narrowest relevant build, test, lint, and typecheck commands for the code you changed.
- For one-workspace changes, start with workspace-local scripts or filtered root commands.
- Use broader verification only when changes cross workspace boundaries, affect shared contracts, or touch shared tooling.

## Repository RAG Memory

- The repo-local Obsidian vault lives in `vault/` and is tracked by git except for local Obsidian state.
- Run `pnpm rag:init` once after cloning to seed the vault, install the local post-commit hook, and build the first `obsidian-vault` corpus.
- Run `pnpm rag:index` after editing vault notes if you need an immediate memory refresh before committing.
- The generated `.rag/obsidian-vault.corpus.json` file is intentionally agent-neutral. Any agent or MCP bridge can consume it for semantic search and section unfold behavior.
- Codex can use the repo-local MCP server at `tools/rag-mcp-server.mjs`. Register it once with `codex mcp add obsidian-memory -- node /Users/macbook/personal/playground/tools/rag-mcp-server.mjs`.
- Before answering architecture, historical, or "why was this decided?" questions, query the `obsidian-vault` memory corpus when your environment exposes a search tool for it. Prefer retrieved chunks over loading whole notes.

## Workspace Commands

### `apps/host`

- `pnpm --filter @playground/host lint`
- `pnpm --filter @playground/host type-check`
- `pnpm --filter @playground/host test`

### `packages/remotes/todo-app`

- `pnpm --filter @playground/todo-app build`
- `pnpm --filter @playground/todo-app lint`
- `pnpm --filter @playground/todo-app type-check`
- `pnpm --filter @playground/todo-app test`
- `pnpm --filter @playground/todo-app test:integration`

### `packages/remotes/uplink-game`

- `pnpm --filter @playground/uplink-game build`
- `pnpm --filter @playground/uplink-game type-check`

### `packages/ui`

- `pnpm --filter @playground/ui lint`
- `pnpm --filter @playground/ui type-check`
- `pnpm --filter @playground/ui build`

### `packages/types`

- `pnpm --filter @playground/types lint`
- `pnpm --filter @playground/types type-check`
- `pnpm --filter @playground/types build`

## Shared Commands

- `corepack enable`
- `pnpm install`
- `pnpm turbo lint`
- `pnpm lint:md`
- `pnpm turbo type-check`
- `pnpm turbo build`
- `pnpm test`
- `pnpm test:integration`
- `pnpm dev`
- `pnpm dev:web`

## Documentation Guidance

- Update docs when behavior, architecture, or workflow expectations change.
- Keep repo-wide orientation in the root `README.md`.
- Keep active direction in `docs/ideas/`.

## Architecture Overview

- The host app owns routing and page composition.
- Remotes are workspace packages mounted by the host through local imports and mount contracts.
- Shared UI and shared types keep host and remotes aligned.
- `packages/remotes/todo-app/tests/integration/` covers rendering and host-to-remote interaction.

## Verification Defaults

- Docs-only changes: `pnpm lint:md`
- One-workspace code changes: start with targeted `pnpm --filter ...` commands plus relevant lint or tests
- Cross-workspace changes: `pnpm turbo lint` and `pnpm turbo type-check`
- User-facing behavior changes: run the most relevant tests and do a quick manual check when possible
