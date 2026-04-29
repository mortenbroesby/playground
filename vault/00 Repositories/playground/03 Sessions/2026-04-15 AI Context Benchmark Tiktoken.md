---
id: "mem-20260415-ai-context-benchmark-tiktoken"
type: "session"
repo_slug: "playground"
title: "AI Context Benchmark Tiktoken"
status: "done"
created: "2026-04-15"
updated: "2026-04-15"
owner: "agent"
summary: "Replace the benchmark harness token approximation with real `tiktoken` accounting so the package reports truthful `cl100k_base` numbers."
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

Replace the benchmark harness token approximation with real `tiktoken`
accounting so the package reports truthful `cl100k_base` numbers.

## Implemented

- added the official `tiktoken` package to
  `@playground/ai-context-engine-bench`
- replaced the `approx_char4` heuristic with a shared `cl100k_base` encoder in
  `src/tokenizer.ts`
- updated benchmark workflows to count retrieved payloads with the real
  tokenizer
- updated the benchmark runner to stamp result artifacts with `cl100k_base`
  instead of `approx_char4`
- added tokenizer coverage that proves exact counts for a small fixture string
- updated runner coverage to assert the emitted tokenizer metadata
- refreshed the package README to reflect that token accounting is now real

## Verification

- `pnpm --filter @playground/ai-context-engine-bench test`
- `pnpm --filter @playground/ai-context-engine-bench type-check`

## Follow-up

- add the checked-in `.specs/benchmarks/` corpus promised by the harness spec
- run the benchmark CLI against that corpus as an end-to-end smoke check
