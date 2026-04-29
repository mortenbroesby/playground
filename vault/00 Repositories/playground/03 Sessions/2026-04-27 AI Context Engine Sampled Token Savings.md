---
id: "mem-20260427-ai-context-engine-sampled-token-savings"
type: "session"
repo_slug: "playground"
title: "AI Context Engine Sampled Token Savings"
status: "done"
created: "2026-04-27"
updated: "2026-04-27"
owner: "agent"
summary: "Make observability token savings more informative than the mirror-baseline fallback without paying exact-tokenizer cost on every MCP tool event."
tags: []
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-11"
  expires_after: "2026-10-24"
  keep: false
area: "tools/ai-context-engine"
branch: "astrograph-ai-engine-refactor"
project: "playground"
---

## Goal

Make observability token savings more informative than the mirror-baseline
fallback without paying exact-tokenizer cost on every MCP tool event.

## Landed

- moved runtime token counting onto the shared tokenizer module used by the
  benchmark tooling
- use `tokenx` for default MCP token guestimates
- added heuristic baseline percentages for overview and discovery-style MCP
  tools where no exact raw baseline is available
- keep exact-baseline paths for source and assembled-context responses when the
  raw comparison material is already available
- rerun every 10th matching MCP tool event through `cl100k_base` and persist
  that sampled exact comparison on the event payload

## Why It Matters

This keeps the ledger cheap and always populated while still grounding it
periodically against the same tokenizer family the benchmark suite already uses.
