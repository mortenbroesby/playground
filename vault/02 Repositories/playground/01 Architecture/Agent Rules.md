---
type: repo-architecture
repo: playground
status: active
summary: Shared cross-agent rules now keep AGENTS.md thin while Codex execpolicy controls host command escalation.
keywords:
  - agents
  - rules
  - codex
  - claude code
  - policy
tags:
  - type/architecture
  - repo/playground
---

# Agent Rules

## Intent

Keep `AGENTS.md` as a thin bootstrap and move durable policy into scoped rule
files that multiple agent runtimes can share.

## Layout

- `.agents/rules/` contains shared markdown instruction rules.
- `.claude/rules` symlinks to `.agents/rules` so Claude-style rule loading uses
  the same source files.
- `.codex/rules/playground.rules` contains Codex execpolicy rules for host
  command escalation. These are command policy, not general agent instructions.
- `codex/rules` symlinks to `.codex/rules` for docs-path compatibility.

## Current Rules

- `repo-workflow.md`: always-on repo workflow, code navigation, memory, and
  verification policy.
- `frontend.md`: path-scoped frontend and UI policy.
- `agent-infrastructure.md`: path-scoped policy for hooks, skills, rules, and
  runtime adapters.

## Follow-Up

- Keep new always-on policy short.
- Add path-scoped rules only when they prevent repeated mistakes.
- Keep command approval rules in `.codex/rules/*.rules`, not markdown rules.
- Run `pnpm agents:check` after changing agent adapters, hooks, rules, or
  symlinks.
