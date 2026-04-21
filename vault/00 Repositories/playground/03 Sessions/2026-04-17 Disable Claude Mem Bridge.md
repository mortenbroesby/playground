---
type: repo-session
repo: playground
date: 2026-04-17
started_at: 2026-04-17 18:20
summary: Removed the repo-local claude-mem bridge, package script, and workflow references so vault plus obsidian-memory remain the only durable repo memory path.
keywords:
  - claude-mem
  - memory
  - workflow
  - active context
touched_paths:
  - AGENTS.md
  - package.json
  - .agents/context/README.md
  - .agents/context/.gitignore
  - .agents/rules/repo-workflow.md
  - BRAINDUMP.md
  - scripts/claude-mem/sync.mjs
tags:
  - type/session
  - repo/playground
---

# Disable Claude Mem Bridge

## Outcome

Removed the repo-level `claude-mem` integration:

- deleted `scripts/claude-mem/sync.mjs`
- removed `pnpm claude-mem:sync` from `package.json`
- removed bridge and workflow references from shared agent docs
- deleted the repo-local bridge file and its gitignore entry

## Why

The repo should keep one durable memory path: the vault plus `obsidian-memory`.
The `claude-mem` bridge added another semi-local memory surface that was
optional, disposable, and easy to confuse with canonical repo memory.

## Notes

- Keep `.agents/context/active-context.md` as the only shared low-token handoff
  file.
- Keep durable repo knowledge in `vault/`.
- Historical vault notes about the old bridge remain as repository history, not
  active workflow guidance.
