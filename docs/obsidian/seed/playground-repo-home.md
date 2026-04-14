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
  - CLAUDE.md
  - README.md
  - KANBAN.md
  - BRAINDUMP.md
  - .agents/rules/
  - .agents/hooks/
active_focus: personal-site host, playground lab, and a thin shared agent setup with durable memory in this vault
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
- [CLAUDE.md](__CLAUDE_URI__)
- [README.md](__README_URI__)
- [KANBAN.md](__KANBAN_URI__)
- [BRAINDUMP.md](__BRAINDUMP_URI__)
- [.agents/rules/](__AGENTS_RULES_URI__)
- [.agents/hooks/](__AGENTS_HOOKS_URI__)

## Current Architecture

- `apps/host/` owns routing, page composition, and the public-site plus playground split.
- `packages/remotes/todo-app/` is the sole live injected remote and the main mount-contract proof.
- `packages/remotes/uplink-game/` still exists as a workspace package, but it now feeds a
  host-local playground experience instead of anchoring the remote strategy.
- `packages/ui/`, `packages/types/`, and `packages/config/` hold the shared layer for components,
  contracts, and tooling.

## Active Focus

- Keep the host strong as a real personal site while preserving the playground as a distinct lab.
- Keep this vault optimized for agents: `00 Repo Home` as primer, `01 Architecture`,
  `02 Decisions`, and `03 Sessions` as the active durable-memory buckets.
- Keep `KANBAN.md` task-shaped and `BRAINDUMP.md` loose.
- Keep the host-to-remote contract trustworthy while the host architecture evolves.

## Recent Sessions

```dataview
TABLE started_at, goal, outcome, next_step
FROM "00 Repositories/__REPO_SLUG__/03 Sessions"
WHERE type = "repo-session"
SORT started_at DESC
LIMIT 10
```

## Key Decisions

```dataview
TABLE decision_id, status, decided_on
FROM "00 Repositories/__REPO_SLUG__/02 Decisions"
WHERE type = "repo-decision"
SORT decided_on DESC
```

## Next Actions

- Keep this note short enough for agents to load first. Link out instead of duplicating repo docs.
- Log session notes under `03 Sessions/` only when the session leaves useful future context.
- Capture architecture or workflow decisions under `02 Decisions/` instead of hiding them inside
  long session notes.
- Use `BRAINDUMP.md` for inbox-style capture; do not recreate a vault inbox unless it becomes part
  of the agent workflow.

## Related Repo Files

- `apps/host/`
- `packages/remotes/todo-app/`
- `packages/remotes/uplink-game/`
- `packages/ui/`
- `packages/types/`
