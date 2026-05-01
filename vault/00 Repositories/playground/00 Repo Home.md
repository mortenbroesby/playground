---
id: mem-20260414-playground-home
type: repo-home
repo_slug: playground
title: playground
repo_path: /Users/macbook/personal/playground
status: active
created: 2026-04-14
updated: 2026-04-29
summary: Personal-site host plus one deliberate injected remote in a pnpm Turborepo monorepo.
keywords:
  - personal site
  - microfrontend
  - todo-app
  - host routing
stack:
  - pnpm
  - Turborepo
  - Vite
  - React
  - TypeScript
owner: morten
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: 2026-10-11
  expires_after: null
  keep: true
source_of_truth:
  - AGENTS.md
  - CLAUDE.md
  - README.md
  - BRAINDUMP.md
  - vault/00 Repositories/playground/04 Tasks/Task Board.md
  - .agents/rules/
  - .agents/hooks/
active_focus: host-owned public site, narrow remote composition, and durable repo memory with typed RAG governance
last_reviewed: 2026-04-29
tags:
  - type/repo
  - state/active
  - repo/playground
---

## What This Repo Is

`playground` is a `pnpm` Turborepo for agent workflow experiments, a
host-owned personal site, and one narrow remote-composition seam.

## Source Of Truth

- [AGENTS.md](file:///Users/macbook/personal/playground/AGENTS.md)
- [CLAUDE.md](file:///Users/macbook/personal/playground/CLAUDE.md)
- [README.md](file:///Users/macbook/personal/playground/README.md)
- [BRAINDUMP.md](file:///Users/macbook/personal/playground/BRAINDUMP.md)
- [Task Board](file:///Users/macbook/personal/playground/vault/00%20Repositories/playground/04%20Tasks/Task%20Board.md)
- [.agents/rules/](file:///Users/macbook/personal/playground/.agents/rules)
- [.agents/hooks/](file:///Users/macbook/personal/playground/.agents/hooks)

## Current Architecture

- `apps/host/` owns routing, layout, and the public-site versus playground split.
- `packages/remotes/todo-app/` is the only live injected remote.
- `packages/remotes/uplink-game/` now feeds a host-local playground path.
- `packages/ui/`, `packages/types/`, and `packages/config/` are the shared layer.

## Active Focus

- Keep the host credible as a personal site and the playground isolated as a lab.
- Keep remote composition narrow and explicit.
- Keep durable memory compact: repo home, architecture, decisions, short sessions, task board.
- Keep agent rules and hooks aligned across Codex and Claude.

## Next Actions

- Keep this note short enough to load first.
- Push durable detail into architecture and decision notes.
- Keep the vault task board canonical and `BRAINDUMP.md` loose.

## Related Repo Files

- `apps/host/`
- `packages/remotes/todo-app/`
- `packages/remotes/uplink-game/`
- `packages/ui/`
- `packages/types/`
- [[01 Architecture/Repo Memory Architecture|Repo Memory Architecture]]
- [[04 Tasks/Task Board|Task Board]]
