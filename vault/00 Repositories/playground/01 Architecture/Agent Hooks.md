---
type: repo-architecture
repo: playground
status: active
summary: Shared hook policy for Codex and Claude Code, with shared session-start ai-context-engine freshness bootstrap and focused runtime adapters.
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
- Codex: `.codex/hooks.json` invokes the shared `SessionStart`,
  dangerous-command, and logging hooks.

## Security Defaults

- Block destructive shell commands.
- Block force-pushes unless a later policy explicitly allows them.
- Block secret-like prompt content and secret file writes.
- Block edits to generated output directories.
- Block edits outside the project root.
- Keep hooks fast, use specific runtime matchers, and keep personal hook
  overrides in ignored local settings.

## Freshness Bootstrap

- `SessionStart` now best-effort ensures one detached repo-local
  `ai-context-engine` watch process is running from `.ai-context-engine/`.
- The hook stays fast: it only checks or launches the background watcher and
  returns session context immediately.
- The watcher owns initial indexing plus incremental refresh for later local
  edits and external file changes, reducing stale-index windows for both agent
  and end-user flows.

## Repository Hooks

- Git hooks are managed by Husky. The RAG post-commit hook lives at
  `.husky/post-commit`.

## Follow-Up

- Add more policy only when a real recurring need appears.
- Keep hook architecture documented here; executable policy lives in
  `.agents/hooks/`.
