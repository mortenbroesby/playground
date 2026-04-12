---
type: repo
repo_slug: playground
repo_path: /Users/macbook/personal/playground
status: active
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
source_of_truth:
  - AGENTS.md
  - README.md
  - KANBAN.md
  - BRAINDUMP.md
  - docs/ideas/
  - apps/host/AGENTS.md
active_focus: personal-site host plus one deliberate injected remote, with an intentional drift toward separate personal and playground surface systems
last_reviewed: 2026-04-11
tags:
  - type/repo
  - state/active
  - repo/playground
---

# playground

## What This Repo Is

`playground` is a `pnpm` + Turborepo monorepo for multi-agent workflow experiments, one host-owned
personal-site shell, and a narrow microfrontend seam that still proves local remote composition.

## Source Of Truth

- [AGENTS.md](file:///Users/macbook/personal/playground/AGENTS.md)
- [README.md](file:///Users/macbook/personal/playground/README.md)
- [KANBAN.md](file:///Users/macbook/personal/playground/KANBAN.md)
- [BRAINDUMP.md](file:///Users/macbook/personal/playground/BRAINDUMP.md)
- [docs/ideas/](file:///Users/macbook/personal/playground/docs/ideas)
- [apps/host/AGENTS.md](file:///Users/macbook/personal/playground/apps/host/AGENTS.md)

## Current Architecture

- `apps/host/` owns routing, page composition, and the public-site plus playground split.
- `packages/remotes/todo-app/` is the sole live injected remote and the main mount-contract proof.
- `packages/remotes/uplink-game/` still exists as a workspace package, but it now feeds a
  host-local playground experience instead of anchoring the remote strategy.
- `packages/ui/`, `packages/types/`, and `packages/config/` hold the shared layer for components,
  contracts, and tooling.

## Architecture Map

- [[01 Architecture/Host Routing and Shells|Host Routing and Shells]]
- [[01 Architecture/Workspace Remote Composition|Workspace Remote Composition]]
- [[01 Architecture/Shared Packages and Tooling|Shared Packages and Tooling]]
- [[01 Architecture/Design System Split Migration Plan|Design System Split Migration Plan]]
- [[01 Architecture/Spotify Now Playing Boundary|Spotify Now Playing Boundary]]
- [[01 Architecture/Verification Map|Verification Map]]
- [[01 Architecture/Repo Memory Architecture|Repo Memory Architecture]]

## Active Focus

- Keep the host strong as a real personal site while preserving the playground as a distinct lab.
- Keep the design-system split incremental: shared primitives for now, surface-specific systems later.
- Keep `KANBAN.md` task-shaped and `BRAINDUMP.md` loose.
- Keep the host-to-remote contract trustworthy while the host architecture evolves.

## Recent Sessions

```dataview
TABLE started_at, goal, outcome, next_step
FROM "02 Repositories/playground/03 Sessions"
WHERE type = "repo-session"
SORT started_at DESC
LIMIT 10
```

## Open Questions

```dataview
TABLE opened_on, owner
FROM "02 Repositories/playground/04 Questions"
WHERE type = "repo-question" AND status != "closed"
SORT opened_on DESC
```

## Key Decisions

```dataview
TABLE decision_id, status, decided_on
FROM "02 Repositories/playground/02 Decisions"
WHERE type = "repo-decision"
SORT decided_on DESC
```

## Next Actions

- Log new sessions under `03 Sessions/` using the session template.
- Capture architecture or workflow decisions under `02 Decisions/` instead of hiding them inside
  long session notes.
- Keep this note short and dashboard-shaped. Link out instead of duplicating repo docs.

## Related Repo Files

- `apps/host/`
- `packages/remotes/todo-app/`
- `packages/remotes/uplink-game/`
- `packages/ui/`
- `packages/types/`
