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
  - CLAUDE.md
  - README.md
  - BRAINDUMP.md
  - vault/00 Repositories/playground/04 Tasks/Task Board.md
  - .agents/rules/
  - .agents/hooks/
active_focus: personal-site host, playground lab, and a thin shared agent setup with durable memory in this vault
last_reviewed: 2026-04-14
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

## Architecture Map

- [[01 Architecture/Host Routing and Shells|Host Routing and Shells]]
- [[01 Architecture/Workspace Remote Composition|Workspace Remote Composition]]
- [[01 Architecture/Shared Packages and Tooling|Shared Packages and Tooling]]
- [[01 Architecture/Agent Hooks|Agent Hooks]]
- [[01 Architecture/Agent Rules|Agent Rules]]
- [[01 Architecture/Archived Specs|Archived Specs]]
- [[01 Architecture/Kanban Archive|Kanban Archive]]
- [[01 Architecture/Superpowers Archive|Superpowers Archive]]
- [[01 Architecture/Design System Split Migration Plan|Design System Split Migration Plan]]
- [[01 Architecture/Spotify Now Playing Boundary|Spotify Now Playing Boundary]]
- [[01 Architecture/Verification Map|Verification Map]]
- [[01 Architecture/Repo Memory Architecture|Repo Memory Architecture]]
- [[04 Tasks/Task Board|Task Board]]

## Active Focus

- Keep the host strong as a real personal site while preserving the playground as a distinct lab.
- Keep the design-system split incremental: shared primitives for now, surface-specific systems later.
- Keep the shared hook and rule policy in sync between Codex and Claude Code.
- Keep this vault optimized for agents: `00 Repo Home` as primer, `01 Architecture`,
  `02 Decisions`, `03 Sessions`, and `04 Tasks` as the active durable-memory
  buckets.
- Keep completed `docs/superpowers` planning docs archived in the vault.
- Keep the canonical task board in `04 Tasks/Task Board.md` and
  `BRAINDUMP.md` loose.
- Keep the host-to-remote contract trustworthy while the host architecture evolves.

## Recent Sessions

```dataview
TABLE started_at, goal, outcome, next_step
FROM "00 Repositories/playground/03 Sessions"
WHERE type = "repo-session"
SORT started_at DESC
LIMIT 10
```

## Key Decisions

```dataview
TABLE decision_id, status, decided_on
FROM "00 Repositories/playground/02 Decisions"
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
- Keep `KANBAN.md` as a thin pointer to the vault-backed task board rather than
  a second task system.

## Related Repo Files

- `apps/host/`
- `packages/remotes/todo-app/`
- `packages/remotes/uplink-game/`
- `packages/ui/`
- `packages/types/`
