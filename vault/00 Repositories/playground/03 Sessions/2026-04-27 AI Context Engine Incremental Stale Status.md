---
id: "mem-20260427-ai-context-engine-incremental-stale-status"
type: "session"
repo_slug: "playground"
title: "AI Context Engine Incremental Stale Status"
status: "done"
created: "2026-04-27"
updated: "2026-04-27"
owner: "agent"
summary: "Make incremental indexing and watch refresh summaries reflect dependency drift immediately instead of always reporting `staleStatus: \"fresh\"` after a write."
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

Make incremental indexing and watch refresh summaries reflect dependency drift
immediately instead of always reporting `staleStatus: "fresh"` after a write.

## Landed

- changed `finalizeIndex()` to derive repo stale state from dependency-graph
  health after rebuilding file dependencies
- propagated the computed stale status through `indexFolder()`, `indexFile()`,
  and watch reindex summaries
- added focused coverage for exporter changes that break downstream relative
  symbol imports

## Why It Matters

Before this slice, an exporter change could break a downstream importer while
the incremental refresh summary and repo sidecar metadata still claimed the
index was fresh. The new behavior keeps incremental status aligned with what
`diagnostics` and `doctor` will report next.
