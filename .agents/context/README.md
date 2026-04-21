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
