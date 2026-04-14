---
type: repo-architecture
repo: playground
status: active
summary: Shared cross-agent rules now keep AGENTS.md thin while Codex execpolicy controls host command escalation.
keywords:
  - agents
  - rules
  - skills
  - commands
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
- `.agents/commands/` contains shared lifecycle prompts. Claude sees these as
  commands through `.claude/commands`; Codex sees the same files through
  `.codex/prompts`.
- `.agents/skills/` contains shared skills. Claude, Codex, Copilot, and
  OpenCode adapters point at this same source.
- `.claude/rules` symlinks to `.agents/rules` so Claude-style rule loading uses
  the same source files.
- `.codex/rules/playground.rules` contains Codex execpolicy rules for host
  command escalation. These are command policy, not general agent instructions.
- `codex/rules` symlinks to `.codex/rules` for docs-path compatibility.

Prefer symlinks when a runtime can consume the same source files directly. Do
not force symlinks across incompatible formats. Subagents are the main expected
case: Claude uses Markdown agent files, while Codex uses TOML agent files, so a
future shared layout should keep source under `.agents/agents/` but allow
runtime-specific adapter files when needed.

## Current Rules

- `repo-workflow.md`: always-on repo workflow, code navigation, memory, and
  verification policy.
- `frontend.md`: path-scoped frontend and UI policy.
- `agent-infrastructure.md`: path-scoped policy for hooks, skills, rules, and
  runtime adapters.

## Workflow Skill

`engineering-workflow` is a compact, cross-agent adaptation of the useful setup
from `addyosmani/agent-skills`: define, plan, build, test, review, simplify, and
ship. The repo deliberately imports the lifecycle shape and command prompts, not
the Claude plugin wrapper or runtime-specific install state.

`pnpm agents:check` now treats `.claude-plugin/` and root `plugins/` as forbidden
paths so plugin-specific setup does not drift back into the shared adapter
layout.

## Follow-Up

- Keep new always-on policy short.
- Add path-scoped rules only when they prevent repeated mistakes.
- Keep command approval rules in `.codex/rules/*.rules`, not markdown rules.
- Prefer symlinked adapters where formats match; use real adapter files where
  Codex and Claude require different schemas.
- Run `pnpm agents:check` after changing agent adapters, hooks, rules, or
  symlinks.
