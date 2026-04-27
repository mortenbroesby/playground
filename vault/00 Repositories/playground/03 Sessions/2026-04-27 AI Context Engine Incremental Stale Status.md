---
date: 2026-04-27
project: playground
branch: astrograph-ai-engine-refactor
area: tools/ai-context-engine
---

# AI Context Engine Incremental Stale Status

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
