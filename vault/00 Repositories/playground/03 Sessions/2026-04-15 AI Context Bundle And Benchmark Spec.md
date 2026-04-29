---
id: "mem-20260415-ai-context-bundle-and-benchmark-spec"
type: "session"
repo_slug: "playground"
title: "AI Context Bundle And Benchmark Spec"
status: "done"
created: "2026-04-15"
updated: "2026-04-15"
owner: "agent"
summary: "Add a first bounded context bundle surface to `@playground/ai-context-engine` and define a repo-local benchmark specification for measuring retrieval efficiency and correctness."
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

Add a first bounded context bundle surface to `@playground/ai-context-engine`
and define a repo-local benchmark specification for measuring retrieval
efficiency and correctness.

## Implemented

- added `getContextBundle` to the library surface
- exposed `get_context_bundle` through the MCP server
- exposed `get-context-bundle` through the JSON CLI
- added tests proving bundle assembly uses persisted indexed content rather than
  reparsing modified working files
- added `.specs/ai-context-engine-benchmark-spec.md` as the local benchmark spec

## Bundle Shape

- target symbols are selected from explicit symbol ids or top ranked query hits
- imported local dependencies are added as secondary bundle items
- bundle output tracks token budget, estimated tokens, used tokens, and
  truncation
- retrieval remains deterministic and based on stored content blobs

## Benchmark Spec Direction

- compare read-all baseline against fixed retrieval workflows
- use a pinned repo SHA and deterministic task-card corpus
- report both token cost and correctness signals
- keep `get_context_bundle` as a benchmarked workflow now that the engine
  exposes it

## Verification

- `pnpm --filter @playground/ai-context-engine test`
- `pnpm --filter @playground/ai-context-engine type-check`
- `pnpm lint:md`
