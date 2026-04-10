---
type: repo
repo_slug: __REPO_SLUG__
repo_path: __REPO_PATH__
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
active_focus: personal-site host plus one deliberate injected remote
last_reviewed: __TODAY__
tags:
  - type/repo
  - state/active
  - repo/__REPO_SLUG__
---

# __REPO_SLUG__

## What This Repo Is

`playground` is a `pnpm` + Turborepo monorepo for multi-agent workflow experiments, one host-owned
personal-site shell, and a narrow microfrontend seam that still proves local remote composition.

## Source Of Truth

- [AGENTS.md](__AGENTS_URI__)
- [README.md](__README_URI__)
- [KANBAN.md](__KANBAN_URI__)
- [BRAINDUMP.md](__BRAINDUMP_URI__)
- [docs/ideas/](__DOCS_IDEAS_URI__)
- [apps/host/AGENTS.md](__HOST_AGENTS_URI__)

## Current Architecture

- `apps/host/` owns routing, page composition, and the public-site plus playground split.
- `packages/remotes/todo-app/` is the sole live injected remote and the main mount-contract proof.
- `packages/remotes/uplink-game/` still exists as a workspace package, but it now feeds a
  host-local playground experience instead of anchoring the remote strategy.
- `packages/ui/`, `packages/types/`, and `packages/config/` hold the shared layer for components,
  contracts, and tooling.

## Active Focus

- Keep the host strong as a real personal site while preserving the playground as a distinct lab.
- Keep `KANBAN.md` task-shaped and `BRAINDUMP.md` loose.
- Keep the host-to-remote contract trustworthy while the host architecture evolves.

## Recent Sessions

```dataview
TABLE started_at, goal, outcome, next_step
FROM "02 Repositories/__REPO_SLUG__/03 Sessions"
WHERE type = "repo-session"
SORT started_at DESC
LIMIT 10
```

## Open Questions

```dataview
TABLE opened_on, owner
FROM "02 Repositories/__REPO_SLUG__/04 Questions"
WHERE type = "repo-question" AND status != "closed"
SORT opened_on DESC
```

## Key Decisions

```dataview
TABLE decision_id, status, decided_on
FROM "02 Repositories/__REPO_SLUG__/02 Decisions"
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
