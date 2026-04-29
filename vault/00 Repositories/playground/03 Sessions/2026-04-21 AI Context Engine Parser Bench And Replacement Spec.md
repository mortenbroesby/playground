---
id: mem-20260421-ai-context-engine-parser-bench-replacement-spec
type: session
repo_slug: playground
title: AI Context Engine Parser Bench And Replacement Spec
status: done
created: 2026-04-21
updated: 2026-04-21
owner: agent
summary: Added a small benchmark harness for `ai-context-engine`, hardened large-file parsing with overlap-aware chunk ownership, and wrote the parser replacement spec targeting Oxc with only tightly bounded Tree-sitter fallback.
tags:
  - type/session
  - repo/playground
keywords:
  - ai-context-engine
  - benchmark
  - parser
  - oxc
  - tree-sitter
links:
  parents: []
  children: []
  related:
    - mem-a19019048d5b4a0e
  supersedes: []
  superseded_by: []
retention:
  review_after: 2026-05-05
  expires_after: 2026-10-18
  keep: false
started_at: 2026-04-21 22:40
branch: main
touched_paths:
  - packages/ai-context-engine/package.json
  - packages/ai-context-engine/scripts/benchmark-small.mjs
  - packages/ai-context-engine/src/parser.ts
  - packages/ai-context-engine/tests/engine-behavior.test.ts
  - .specs/ai-context-engine-parser-replacement-spec.md
goal: Turn parser work into a measured implementation path instead of an open-ended discussion.
outcome: The benchmark path, safer large-file fallback, and concrete migration spec landed together.
decisions:
  - Benchmark token savings and parser behavior directly instead of relying on intuition.
  - Target Oxc as the primary parser and keep Tree-sitter fallback tightly bounded behind the parser facade.
blockers: []
next_step: Use the spec and benchmark to drive the actual parser migration slices, not another broad planning loop.
---

## Goal

Make parser work measurable and implementation-ready.

## What Changed

- added a small in-process benchmark harness for `ai-context-engine`
- hardened the large-file fallback path with overlap-aware chunk ownership
- wrote the parser replacement spec with Oxc as the primary target and
  Tree-sitter fallback constrained to the parser facade

## Why It Mattered

This turned parser migration from vague discussion into a benchmarked path with
explicit boundaries and stop conditions.

## Verification

- `pnpm --filter @playground/ai-context-engine type-check`
- `pnpm --filter @playground/ai-context-engine test -- --run tests/engine-behavior.test.ts`
- `pnpm --filter @playground/ai-context-engine bench:small`

## Next Step

Keep future parser notes focused on implementation outcomes rather than
repeating the migration rationale captured here.
