---
date: 2026-04-27
project: playground
branch: astrograph-ai-engine-refactor
area: tools/ai-context-engine
---

# AI Context Engine Symbol Count Limits

## Goal

Close the remaining Phase 6 limits gap by enforcing a repo-configurable ceiling
on per-file symbol extraction.

## Landed

- added `limits.maxSymbolsPerFile` to `astrograph.config.json`
- added `DEFAULT_MAX_SYMBOLS_PER_FILE` and threaded the resolved limit through
  engine config creation
- enforced the limit after parsing, since symbol count is only knowable once the
  parser has produced symbols
- treated symbol-explosive files as non-indexable, matching the existing
  behavior for oversized files instead of storing truncated symbol sets
- added focused coverage for both folder indexing and single-file refresh when a
  file crosses the symbol ceiling

## Why It Matters

Astrograph already bounded file count, file size, child-process output, and
retrieval result counts, but not symbol explosion inside a single file. This
keeps pathological generated or bundled sources from overwhelming the local
index while preserving honest results.
