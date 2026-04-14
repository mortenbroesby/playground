# Active Context

This directory is the shared cross-agent place for compact active context.

Use it for low-token operational handoff only:

- current task
- branch or worktree
- blocker
- next step
- a few relevant files or commands

Do not use it for durable knowledge:

- architecture maps
- decision records
- long transcripts
- full session logs
- canonical setup instructions

Durable memory belongs in `vault/` and is retrieved through
`obsidian-memory`.

If `claudemem` is used in this repo, it should refresh the shared
`active-context.md` file here instead of maintaining a separate memory surface.

## Claude-Mem Bridge

This repo also supports an optional local bridge file:

- `.agents/context/claude-mem-context.local.md`

Refresh it with:

- `pnpm claude-mem:sync`

The sync script prefers the local `claude-mem` worker API and falls back to the
current `~/.codex/AGENTS.md` context block when loopback access is unavailable.
This file is intentionally gitignored. It keeps `claude-mem` visible inside the
repo without letting a global watcher mutate tracked repo files.
