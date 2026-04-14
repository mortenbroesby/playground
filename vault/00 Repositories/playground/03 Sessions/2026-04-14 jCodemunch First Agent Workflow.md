---
type: repo-session
repo: playground
date: 2026-04-14
started_at: 2026-04-14 20:30
summary: Added jcodemunch-first exploration guidance, Claude guard hooks, and workspace agent docs for shared repo workflow.
keywords:
  - jcodemunch
  - hooks
  - agent workflow
  - claude code
  - docs
touched_paths:
  - .agents/hooks/jcodemunch-guard.mjs
  - .agents/hooks/jcodemunch-reindex.mjs
  - .agents/rules/repo-workflow.md
  - .claude/settings.json
  - AGENT_HOOKS.md
  - AGENTS.md
  - README.md
tags:
  - type/session
  - repo/playground
---

# jCodemunch First Agent Workflow

## Outcome

The repo now documents and enforces a jcodemunch-first exploration flow for
agent work.

Claude Code `PreToolUse` now routes broad code scans away from shell search
tools and toward structured jcodemunch lookups. Large untargeted code reads are
warned instead of blocked, and edited code files trigger best-effort
`jcodemunch-mcp index-file` reindexing after writes.

## Supporting Changes

- Added `AGENT_HOOKS.md` as the shared hook-policy explainer.
- Updated root guidance in `AGENTS.md`, `CLAUDE.md`, and
  `.agents/rules/repo-workflow.md` to call out `plan_turn`,
  `search_symbols`, `get_file_outline`, `get_symbol_source`, and
  `get_context_bundle`.
- Added workspace-local `AGENTS.md` files for `apps/admin`, `packages/config`,
  `packages/types`, and `packages/ui`.
- Documented Node `24.x` in `.nvmrc`, `README.md`, and the root `package.json`
  engines field.

## Verification

- `node --check .agents/hooks/jcodemunch-guard.mjs`
- `node --check .agents/hooks/jcodemunch-reindex.mjs`
