---
type: repo-session
repo: playground
date: 2026-04-21
started_at: 2026-04-21 22:31
branch: main
summary: Added a session-scoped override to the dangerous-command hook so direct pushes to `main` remain blocked by default but can be explicitly allowed per command with `CODEX_ALLOW_DIRECT_MAIN_PUSH=1`.
keywords:
  - hooks
  - git
  - main
  - codex
  - workflow
touched_paths:
  - .agents/hooks/block-dangerous-commands.mjs
tags:
  - type/session
  - repo/playground
---

# Session Scoped Direct Main Push Hook Override

## Summary

The repo-level dangerous-command hook blocked any direct `git push` to
`main/master`. That conflicted with the temporary direct-to-`main` workflow
already requested for this session.

## What Changed

- kept the default deny behavior for direct `main/master` pushes
- added a narrow escape hatch that only applies when the command explicitly
  includes `CODEX_ALLOW_DIRECT_MAIN_PUSH=1`
- left the force-push protections untouched

## Why It Matters

This keeps the guardrail in place for normal use while allowing an intentional,
one-command override when the workflow has already been explicitly approved.
