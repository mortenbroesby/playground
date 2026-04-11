# AGENTS.md

Root guidance for coding agents in this repository. Follow any deeper `AGENTS.md`
closest to the files you edit.

## Core Rules

- Use `pnpm` only; do not add `npm` or `yarn` commands to docs, scripts, or hooks.
- Keep changes scoped to the workspace that owns the behavior.
- Do not edit generated output such as `dist/`, `.next/`, or `.turbo/`.
- Unless the task is explicitly about planning, do not modify `docs/superpowers/`.
- Update the relevant README, `AGENTS.md`, docs note, or vault note when a change
  alters behavior, architecture, workflow, or setup expectations.
- Use the repo `.ignore` defaults for file discovery; bypass them only when the
  task explicitly needs ignored files.
- Larger staged code/config changes must include a vault note under
  `vault/02 Repositories/`; `pnpm knowledge:check` enforces this before commit.

## Repo Shape

- `apps/host/` owns routing, page composition, and the public-site/playground split.
- `packages/remotes/todo-app/` is the live injected remote and mount-contract proof.
- `packages/remotes/uplink-game/` is still a workspace package consumed by the host.
- `packages/ui/`, `packages/types/`, and `packages/config/` hold shared components,
  contracts, and tooling.

## Memory

- The repo-local Obsidian vault lives in `vault/`.
- Before answering architecture, historical, or decision questions, query the
  `obsidian-memory` corpus when available and prefer retrieved chunks over broad
  note reads.
- After editing vault notes, run `pnpm rag:index` if you need fresh memory before
  committing.

## Verification

- Prefer the narrowest relevant script for the workspace you changed.
- For one-workspace code changes, run that workspace's lint, type-check, or tests
  as appropriate.
- For shared contracts, shared tooling, or cross-workspace behavior, broaden to
  the affected package checks or `pnpm turbo type-check`.
- For docs-only changes, run `pnpm lint:md` when verification is needed.
- For user-facing behavior, run relevant tests and do a quick manual check when
  practical.
