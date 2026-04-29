---
id: "mem-20260415-ai-context-benchmark-strict-snapshot-mode"
type: "session"
repo_slug: "playground"
title: "AI Context Benchmark Strict Snapshot Mode"
status: "done"
created: "2026-04-15"
updated: "2026-04-15"
owner: "agent"
summary: "Add strict reproducibility guards to `@playground/ai-context-engine-bench` so benchmark runs can enforce a pinned, clean git snapshot instead of running as best effort on whatever checkout happens to exist."
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

Add strict reproducibility guards to `@playground/ai-context-engine-bench` so
benchmark runs can enforce a pinned, clean git snapshot instead of running as
best effort on whatever checkout happens to exist.

## Implemented

- added `src/snapshot.ts` with repo snapshot capture and strict validation
- added `--strict` handling to the benchmark CLI
- updated the runner to:
  - capture the current repo snapshot
  - reject strict runs on dirty checkouts
  - reject strict runs when the checkout SHA does not match the pinned corpus
    SHA
  - record snapshot metadata in `corpus.lock.json`
- updated fixture repos to be real git repositories with committed benchmark
  corpus metadata
- added snapshot-specific tests and strict-mode CLI/runner coverage

## Verification

- `pnpm --filter @playground/ai-context-engine-bench test`
- `pnpm --filter @playground/ai-context-engine-bench type-check`

## Follow-up

- workflow fairness still needs a separate slice because some workflows still
  search outside `allowedPaths`
- traces and stricter output-layout compliance are still missing
