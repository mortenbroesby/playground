---
id: "mem-20260415-ai-context-freshness-diagnostics-and-harness-plan"
type: "session"
repo_slug: "playground"
title: "AI Context Freshness Diagnostics And Harness Plan"
status: "done"
created: "2026-04-15"
updated: "2026-04-15"
owner: "agent"
summary: "Improve `@playground/ai-context-engine` diagnostics so freshness is derived from real filesystem drift, and split the benchmark work into a policy spec plus a concrete harness implementation spec."
tags: []
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-04-29"
  expires_after: "2026-10-12"
  keep: false
---

## Summary

Improve `@playground/ai-context-engine` diagnostics so freshness is derived from
real filesystem drift, and split the benchmark work into a policy spec plus a
concrete harness implementation spec.

## Freshness Diagnostics

- diagnostics now compares indexed snapshot data against the live repository
- status can resolve to `unknown`, `fresh`, or `stale` from deterministic state
- diagnostics now reports:
  - `indexedAt`
  - `indexAgeMs`
  - indexed and current file counts
  - changed, missing, and extra file counts
  - indexed and current snapshot hashes
  - stale reasons

## Benchmark Planning

- keep `.specs/ai-context-engine-benchmark-spec.md` as the higher-level
  benchmark policy and fairness contract
- add `.specs/ai-context-engine-benchmark-harness-spec.md` as the concrete next
  implementation plan
- proposed harness shape currently targets package-local benchmark sources,
  corpus files under `.specs/benchmarks/`, and run artifacts under
  `.benchmarks/ai-context-engine/`

## Verification

- `pnpm --filter @playground/ai-context-engine test`
- `pnpm --filter @playground/ai-context-engine type-check`
- `pnpm lint:md`
