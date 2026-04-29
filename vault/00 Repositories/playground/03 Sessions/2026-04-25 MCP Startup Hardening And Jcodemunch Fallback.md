---
id: mem-20260425-mcp-startup-hardening-jcodemunch-fallback
type: session
repo_slug: playground
title: MCP Startup Hardening And Jcodemunch Fallback
status: done
created: 2026-04-25
updated: 2026-04-25
owner: agent
summary: Hardened `ai-context-engine` MCP startup, moved protocol handling onto the official MCP SDK, restored `jcodemunch` as the fallback navigator, and captured the release-shaping follow-ups without keeping a sprawling running log.
tags:
  - type/session
  - repo/playground
  - ai-context-engine
  - jcodemunch
  - mcp
keywords:
  - mcp startup
  - jcodemunch fallback
  - observability
  - astrograph
links:
  parents: []
  children: []
  related:
    - mem-20260411-jcodemunch-codex-setup
  supersedes: []
  superseded_by: []
retention:
  review_after: 2026-05-09
  expires_after: 2026-10-22
  keep: false
started_at: 2026-04-25 00:00
touched_paths:
  - tools/ai-context-engine
  - .codex/config.toml
  - AGENTS.md
branch:
goal: Stabilize repo-local MCP startup and keep a practical fallback navigation path.
outcome: Startup and navigation contracts were hardened, the fallback path was restored, and the broader follow-up decisions were reduced to a smaller set of durable conclusions.
decisions:
  - Use the official MCP SDK rather than a hand-rolled stdio loop.
  - Keep `jcodemunch` configured as a repo-local fallback when the primary engine is unavailable.
  - Keep observability local, opt-in, and metadata-first.
blockers: []
next_step: Keep follow-up implementation detail in architecture notes or specs instead of growing this session note again.
---

## Goal

Stabilize `ai-context-engine` MCP startup, remove avoidable protocol drift,
and restore a reliable repo-local fallback for code navigation.

## What Changed

- made the MCP startup path lighter by deferring backend work until tool
  execution and moving the server onto the official SDK path
- aligned tool registration and dispatch around a single manifest so the
  interface contract stays consistent across server code and tests
- updated repo-local callers to use the installed `pnpm exec` interface rather
  than script-path assumptions
- restored `jcodemunch` as the checked-in fallback MCP path when the primary
  engine fails or is unavailable
- improved `ai-context-engine` indexing and watch performance enough to keep
  the startup hardening work from regressing the normal repo workflow

## Durable Conclusions

- keep MCP as the primary interface and CLI as a secondary debug surface
- keep watch behavior explicit and maintainable; use RxJS narrowly where it
  clarifies batching, not as a repo-wide architectural mandate
- keep observability local-only and read-only; do not turn it into a mandatory
  transport or storage rewrite
- keep Astrograph package/version policy explicit at the package boundary and
  let repo-level scripts wrap it ergonomically

## Follow-On Outcomes Worth Remembering

- Astrograph observability was justified as an opt-in repo-local surface, not a
  productized service
- the repo workflow was tightened so implementation work normally ends with a
  commit and push
- the shared design-system adoption queue was refined into smaller slices
  rather than one broad “theme everything” effort

## Verification

- `pnpm --filter @playground/ai-context-engine test -- --run tests/interface.test.ts`
- `pnpm --filter @playground/ai-context-engine test -- --run tests/mutation-smoke.watch.test.ts tests/engine-behavior.test.ts tests/interface.test.ts`
- `pnpm --filter @playground/ai-context-engine type-lint`
- `pnpm --filter @playground/ai-context-engine type-check`
- manual MCP stdio repro for `initialize` and `tools/list`

## Next Step

Leave detailed implementation follow-ups in architecture records, specs, or
focused session notes. This note should stay as the concise handoff for why the
startup hardening pass mattered and what decisions it locked in.
