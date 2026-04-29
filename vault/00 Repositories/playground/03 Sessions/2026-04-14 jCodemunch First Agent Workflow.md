---
id: "mem-20260414-jcodemunch-first-agent-workflow"
type: "session"
repo_slug: "playground"
title: "jCodemunch First Agent Workflow"
status: "active"
created: "2026-04-14"
updated: "2026-04-14"
owner: "agent"
summary: "Added jcodemunch-first exploration guidance, Claude guard hooks, and workspace agent docs for shared repo workflow."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "jcodemunch"
  - "hooks"
  - "agent workflow"
  - "claude code"
  - "docs"
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-04-28"
  expires_after: "2026-10-11"
  keep: false
started_at: "2026-04-14 20:30"
touched_paths:
  - ".agents/hooks/jcodemunch-guard.mjs"
  - ".agents/hooks/jcodemunch-reindex.mjs"
  - ".agents/rules/repo-workflow.md"
  - ".claude/settings.json"
  - "AGENT_HOOKS.md"
  - "AGENTS.md"
  - "README.md"
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

