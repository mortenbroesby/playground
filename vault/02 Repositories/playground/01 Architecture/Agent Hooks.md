---
type: repo-architecture
repo: playground
status: active
summary: Shared hook policy for Codex and Claude Code, with Claude-only interception and a common security runner.
keywords:
  - hooks
  - codex
  - claude code
  - security
  - notifications
tags:
  - type/architecture
  - repo/playground
---

# Agent Hooks

## Intent

Keep a single hook policy that both Codex and Claude Code can use where the
runtime supports it.

## Shared Policy

- `tools/hooks/agent-hooks.mjs` is the shared hook runner.
- It handles session start context, prompt secret scanning, shell-command
  gating, sensitive-file protection, notifications, and event logging.
- The policy should stay deterministic and narrow. If a check is uncertain, the
  hook should explain the risk clearly rather than guessing.

## Runtime Mapping

- Claude Code: `.claude/settings.json` invokes the shared runner for
  `SessionStart`, `UserPromptSubmit`, `Notification`, `PreToolUse`,
  `PostToolUse`, and `SessionEnd`.
- Codex: no active hook is wired at the moment. If one is added later, it
  should remain a thin shim that delegates to the shared runner.

## Security Defaults

- Block destructive shell commands.
- Block force-pushes unless a later policy explicitly allows them.
- Block secret-like prompt content and secret file writes.
- Block edits to generated output directories.

## Follow-Up

- Add more policy only when a real recurring need appears.
- Keep the hooks documented here and in `AGENT_HOOKS.md`.
