# Active Context Layer

Date: 2026-04-14

## Decision

The repo may use a compact shared active-context layer for low-token handoff,
but durable memory remains the vault plus `obsidian-memory`.

## Purpose

The active-context layer exists to reduce token cost when Claude or Codex needs
a short current-state summary:

- current task
- branch or worktree
- blocker
- next step
- a few relevant files or commands

## Location

The shared file lives at `.agents/context/active-context.md`.

This keeps the surface cross-agent and avoids runtime-specific memory drift.

## Non-Goals

The active-context layer must not become:

- a second source of truth
- an architecture log
- a decision record system
- a transcript store
- a replacement for vault notes

Durable repo memory still belongs in `vault/00 Repositories/playground/` and is
retrieved through `obsidian-memory`.

## Claudemem Fit

`claudemem` is acceptable only if it writes or refreshes the shared active
context file instead of maintaining a separate durable memory surface.
