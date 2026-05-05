---
id: "mem-20260429-agent-hooks"
type: "architecture-record"
repo_slug: "playground"
title: "Agent Hooks"
status: "accepted"
created: "2026-04-29"
updated: "2026-05-01"
owner: "morten"
summary: "Shared hook policy for Codex and Claude Code, with a slim session-start context, indexed-retrieval guidance, and no repo-local Astrograph bootstrap logic."
tags:
  - "type/architecture"
  - "repo/playground"
keywords:
  - "hooks"
  - "codex"
  - "claude code"
  - "security"
  - "notifications"
  - "astrograph"
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

Keep a single hook policy that both Codex and Claude Code can use where the
runtime supports it.

## Shared Policy

- `.agents/hooks/lib/core.mjs` owns shared parsing, path resolution, redaction,
  and logging helpers.
- `.agents/hooks/agent-hooks.mjs` is a compatibility dispatcher; Claude uses
  focused hook scripts directly.
- The hooks cover session context, prompt and write secret scanning, dangerous
  command gating, file protection, notifications, and audit logging.
- Hook stdin is untrusted, writes must stay inside the repo root, and uncertain
  checks should fail with a clear explanation instead of guessing.

## Runtime Mapping

- Claude Code calls focused `.agents/hooks/*.mjs` entrypoints.
- Codex calls the shared `SessionStart`, dangerous-command, and logging hooks.

## Security Defaults

- Block destructive shell commands and force-pushes by default.
- Block secret-like prompt content, secret file writes, generated-output edits,
  and writes outside the project root.
- Keep hooks fast and keep personal overrides in ignored local settings.

## Astrograph Integration

- `SessionStart` stays intentionally small and only returns shared repo context
  plus live git state.
- Astrograph remains a configured indexed-retrieval path for agents, but the
  repo no longer carries local watcher bootstrap or reindex hook logic.
- Git refresh and observability behavior live in the standalone Astrograph
  package rather than in playground hook scripts.

## Repository Hooks

- Git hooks are managed by Husky. The RAG post-commit hook lives at
  `.husky/post-commit`.

## Follow-Up

- Add policy only for recurring needs.
- Keep the explanation here and the enforcement in `.agents/hooks/`.
