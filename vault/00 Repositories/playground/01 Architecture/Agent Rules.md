---
id: "mem-20260429-agent-rules"
type: "architecture-record"
repo_slug: "playground"
title: "Agent Rules"
status: "accepted"
created: "2026-04-29"
updated: "2026-05-05"
owner: "morten"
summary: "Shared cross-agent rules keep AGENTS.md thin, use one default indexed navigation path, and leave host command escalation to Codex execpolicy."
tags:
  - "type/architecture"
  - "repo/playground"
keywords:
  - "agents"
  - "rules"
  - "skills"
  - "commands"
  - "codex"
  - "claude code"
  - "policy"
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-10-26"
  expires_after: null
  keep: true
---

## Intent

Keep `AGENTS.md` as a thin bootstrap and move durable policy into scoped rule
files that multiple agent runtimes can share.

## Layout

- `.agents/rules/` contains shared markdown instruction rules.
- `.agents/commands/` contains shared lifecycle prompts. Claude sees these as
  commands through `.claude/commands`; Codex sees the same files through
  `.codex/prompts`.
- `.skills/` contains repo-owned shared skills that load on demand.
- `.claude/rules` symlinks to `.agents/rules` so Claude-style rule loading uses
  the same source files.
- `.codex/rules/playground.rules` contains Codex execpolicy rules for host
  command escalation. These are command policy, not general agent instructions.
- `codex/rules` symlinks to `.codex/rules` for docs-path compatibility.

Prefer symlinks when a runtime can consume the same source files directly. Do
not force symlinks across incompatible formats. Keep runtime adapters thin and
keep repo-owned skills out of runtime-specific directories.

## Current Rules

- `repo-workflow.md`: always-on workflow policy for code navigation, memory,
  verification, and ship-default behavior.
- `frontend.md`: path-scoped frontend and UI policy.
- `agent-infrastructure.md`: path-scoped policy for hooks, skills, rules, and
  runtime adapters.

## Ownership Model

- `AGENTS.md` is the thin bootstrap.
- `.agents/rules/repo-workflow.md` owns always-on repo workflow policy.
- `.skills/engineering-workflow/SKILL.md` owns lifecycle guidance for spec,
  plan, build, test, review, simplify, and ship work.
- Vault architecture and decision notes explain why the surfaces are organized
  this way; they should not duplicate the live rule text.

## Retrieval Default

- Keep one default code-navigation path hot in always-applied guidance:
  Astrograph first.
- Keep durable repo history and architecture lookup in `obsidian-memory`.

## Workflow Skill

`engineering-workflow` is a compact, cross-agent adaptation of the useful setup
from `addyosmani/agent-skills`: define, plan, build, test, review, simplify, and
ship. The repo deliberately imports the lifecycle shape and command prompts, not
runtime-specific install state.

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
