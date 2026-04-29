---
id: mem-20260421-ai-context-engine-oxc-parser-migration
type: session
repo_slug: playground
title: AI Context Engine Oxc Parser Migration
status: archived
created: 2026-04-21
updated: 2026-04-21
owner: agent
summary: Moved `ai-context-engine` to an Oxc-first parser path, kept Tree-sitter only as a bounded fallback behind the parser facade, and updated the small benchmark to report backend and fallback metadata.
tags:
  - type/session
  - repo/playground
keywords:
  - ai-context-engine
  - oxc
  - parser
  - benchmark
links:
  parents: []
  children: []
  related:
    - mem-20260421-ai-context-engine-parser-bench-replacement-spec
  supersedes: []
  superseded_by:
    - mem-20260421-prefer-oxc-as-primary-parser
retention:
  review_after: 2026-05-05
  expires_after: 2026-10-18
  keep: false
started_at: 2026-04-21 23:05
branch: main
touched_paths:
  - packages/ai-context-engine/package.json
  - packages/ai-context-engine/src/parser.ts
  - packages/ai-context-engine/scripts/benchmark-small.mjs
goal: Replace the primary parser path with Oxc while keeping fallback behavior explicit and measurable.
outcome: Oxc became the primary backend, Tree-sitter stayed behind the parser facade, and the benchmark began reporting backend and fallback metadata.
decisions:
  - Use Oxc as the main parser for JS/TS indexing.
  - Keep Tree-sitter only as a bounded fallback during migration, not a co-equal runtime model.
blockers: []
next_step: Treat resolver work and eventual Tree-sitter removal as later slices, not part of this migration checkpoint.
---

## Goal

Prove Oxc can carry the primary indexing path without leaking a dual-parser
architecture across the package.

## What Changed

- added Oxc as the primary parse backend
- kept Tree-sitter only for parser-facade fallback behavior
- extended the benchmark to report backend choice and fallback usage

## Why It Mattered

This established a clean migration checkpoint: Oxc was proven on the main path,
and fallback behavior stayed explicit instead of silently spreading.

## Verification

- `pnpm --filter @playground/ai-context-engine type-check`
- `pnpm --filter @playground/ai-context-engine test -- --run tests/engine-behavior.test.ts tests/interface.test.ts`
- `pnpm --filter @playground/ai-context-engine bench:small`

## Next Step

Keep resolver follow-up and full Tree-sitter removal in later dedicated notes.
