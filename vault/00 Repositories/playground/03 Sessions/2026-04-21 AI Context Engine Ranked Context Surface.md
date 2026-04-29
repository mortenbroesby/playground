---
id: "mem-20260421-ai-context-engine-ranked-context-surface"
type: "session"
repo_slug: "playground"
title: "AI Context Engine Ranked Context Surface"
status: archived
created: "2026-04-21"
updated: "2026-04-21"
owner: "agent"
summary: "Added a first-class `get_ranked_context` retrieval surface to `@playground/ai-context-engine` so agents can inspect ranked candidates and the bounded bundle selected under budget."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "ai-context-engine"
  - "ranked-context"
  - "retrieval"
  - "mvp"
  - "mcp"
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-05"
  expires_after: "2026-10-18"
  keep: false
branch: "main"
started_at: "2026-04-21 22:13"
touched_paths:
  - "packages/ai-context-engine/src/types.ts"
  - "packages/ai-context-engine/src/storage.ts"
  - "packages/ai-context-engine/src/index.ts"
  - "packages/ai-context-engine/src/cli.ts"
  - "packages/ai-context-engine/src/mcp.ts"
  - "packages/ai-context-engine/tests/engine-behavior.test.ts"
  - "packages/ai-context-engine/tests/interface.test.ts"
  - "packages/ai-context-engine/README.md"
---

## Summary

The engine already had `get_context_bundle`, but it hid the ranking step inside
the bundle response. That made query-driven retrieval harder to inspect and tune
as a product surface.

This slice adds a first-class `get_ranked_context` capability that returns:

- ranked candidate symbols for a query
- which seed ids were actually selected
- the bounded bundle assembled under the requested token budget

## What Changed

- added `RankedContextCandidate` and `RankedContextResult` types
- extracted ranked seed selection from the old bundle-only path
- kept `get_context_bundle` behavior intact while reusing the shared ranked-seed
  and bundle assembly logic
- added `get-ranked-context` to the CLI
- added `get_ranked_context` to the MCP surface
- expanded behavior and interface tests to prove ranked candidates are visible
  and selected bundle seeds are explicit

## Why It Matters For MVP

This makes the retrieval layer more inspectable for real agent usage. An agent
can now ask:

- what symbols matched my query
- in what order
- which ones were actually selected into the bounded context

That is materially closer to an MVP retrieval product than a single opaque
bundle endpoint.

## Verification

- `pnpm --filter @playground/ai-context-engine type-check`
- `pnpm --filter @playground/ai-context-engine test`
