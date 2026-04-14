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

- `.agents/hooks/lib/core.mjs` owns shared payload parsing, output helpers, path
  resolution, secret redaction, and best-effort logging.
- `.agents/hooks/agent-hooks.mjs` remains a compatibility dispatcher for
  runtimes that need one command, but Claude Code is wired to focused scripts.
- Focused hook entrypoints handle session context, prompt secret scanning,
  Bash command gating, file protection, artifact write blocking, write-content
  secret scanning, post-edit protected-file auditing, notifications, and
  audit-only logging.
- It treats hook stdin as untrusted input, resolves edit paths against the
  project root, blocks edits outside that root, and redacts secret-like values
  before writing hook logs.
- The policy should stay deterministic and narrow. If a check is uncertain, the
  hook should explain the risk clearly rather than guessing.

## Runtime Mapping

- Claude Code: `.claude/settings.json` invokes specific `.agents/hooks/*.mjs`
  entrypoints for `SessionStart`, `UserPromptSubmit`, `Notification`,
  `PreToolUse`, `PostToolUse`, and `SessionEnd`.
- Codex: no active hook is wired at the moment. If one is added later, it
  should remain a thin shim that delegates to the shared runner.

## Security Defaults

- Block destructive shell commands.
- Block force-pushes unless a later policy explicitly allows them.
- Block secret-like prompt content and secret file writes.
- Block edits to generated output directories.
- Block edits outside the project root.
- Keep hooks fast, use specific runtime matchers, and keep personal hook
  overrides in ignored local settings.

## Repository Hooks

- Git hooks are managed by Husky. The RAG post-commit hook lives at
  `.husky/post-commit`.

## Follow-Up

- Add more policy only when a real recurring need appears.
- Keep hook architecture documented here; executable policy lives in
  `.agents/hooks/`.
