---
type: repo-session
repo: playground
date: 2026-04-14
started_at: 2026-04-14 22:58
summary: Added a repo-local claude-mem bridge so user-level Codex memory can be surfaced inside the repo without mutating tracked AGENTS files.
keywords:
  - claude-mem
  - codex
  - memory
  - active context
  - bridge
touched_paths:
  - AGENTS.md
  - package.json
  - .agents/context/README.md
  - .agents/rules/repo-workflow.md
  - scripts/claude-mem/sync.mjs
tags:
  - type/session
  - repo/playground
---

# Claude Mem Repo Bridge

## Outcome

Added a repo-local bridge for `claude-mem`:

- `pnpm claude-mem:sync` fetches current repo context from the local worker
- output is written to `.agents/context/claude-mem-context.local.md`

The output file is gitignored so it can live inside the repo during active work
without causing tracked file churn.

## Why

The official Codex integration writes to `~/.codex/AGENTS.md`, which feels too
global for repo work. A direct repo-local watcher target would mutate tracked
`AGENTS.md` files, which is the wrong default. The bridge keeps memory visible
in the repo while preserving the current shared-agent architecture.

## Notes

- Keep durable memory in the vault plus `obsidian-memory`.
- Treat the repo-local claude-mem file as disposable operational context.
- If the bridge becomes noisy, compress or stop syncing it rather than turning
  it into another source of truth.
