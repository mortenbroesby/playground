---
id: mem-20260414-playground-home
type: repo-home
repo_slug: playground
title: playground
repo_path: /Users/macbook/personal/playground
status: active
created: 2026-04-14
updated: 2026-04-14
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
owner: mortenbroesby
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

`playground` is a `pnpm` + Turborepo monorepo for multi-agent workflow experiments, one host-owned
personal-site shell, and a narrow microfrontend seam that still proves local remote composition.

## Source Of Truth

- [AGENTS.md](file:///Users/macbook/personal/playground/AGENTS.md)
- [CLAUDE.md](file:///Users/macbook/personal/playground/CLAUDE.md)
- [README.md](file:///Users/macbook/personal/playground/README.md)
- [BRAINDUMP.md](file:///Users/macbook/personal/playground/BRAINDUMP.md)
- [Task Board](file:///Users/macbook/personal/playground/vault/00%20Repositories/playground/04%20Tasks/Task%20Board.md)
- [.agents/rules/](file:///Users/macbook/personal/playground/.agents/rules)
- [.agents/hooks/](file:///Users/macbook/personal/playground/.agents/hooks)

## Current Architecture

- `apps/host/` owns routing, page composition, and the public-site plus playground split.
- `packages/remotes/todo-app/` is the sole live injected remote and the main mount-contract proof.
- `packages/remotes/uplink-game/` still exists as a workspace package, but it now feeds a
  host-local playground experience instead of anchoring the remote strategy.
- `packages/ui/`, `packages/types/`, and `packages/config/` hold the shared layer for components,
  contracts, and tooling.

## Active Focus

- Keep the host strong as a real personal site while preserving the playground as a distinct lab.
- Keep remote composition narrow and explicit so mount-contract proof stays easy to reason about.
- Keep durable memory concise: repo home as primer, architecture and decisions as canonical detail,
  sessions as short handoffs, task board as the work queue.
- Keep shared agent rules and hooks aligned across Codex and Claude surfaces.

## Recent Sessions

```dataview
TABLE started_at, goal, outcome, next_step
FROM "00 Repositories/playground/03 Sessions"
WHERE type = "session"
SORT started_at DESC
LIMIT 10
```

## Key Decisions

```dataview
TABLE title, status, updated
FROM "00 Repositories/playground/02 Decisions"
WHERE type = "architecture-record"
SORT updated DESC
```

## Next Actions

- Keep this note short enough to load first.
- Prefer architecture and decision notes for durable detail; keep sessions compact.
- Keep the vault task board canonical and use `BRAINDUMP.md` as loose capture.

## Related Repo Files

- `apps/host/`
- `packages/remotes/todo-app/`
- `packages/remotes/uplink-game/`
- `packages/ui/`
- `packages/types/`
- [[01 Architecture/Repo Memory Architecture|Repo Memory Architecture]]
- [[04 Tasks/Task Board|Task Board]]
