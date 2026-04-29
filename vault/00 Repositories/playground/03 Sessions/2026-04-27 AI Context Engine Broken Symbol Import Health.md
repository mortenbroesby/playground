---
date: 2026-04-27
project: playground
branch: astrograph-ai-engine-refactor
area: tools/ai-context-engine
---

# AI Context Engine Broken Symbol Import Health

## Goal

Close a remaining Phase 5 dependency-graph gap by reporting relative imports
whose target files still exist but no longer export the named symbols that the
importer expects.

## Landed

- enriched persisted import specifiers with import kind, imported name, and
  local alias information
- kept backwards compatibility for older stored import rows by normalizing
  legacy string arrays on read
- added doctor and diagnostics dependency-graph reporting for unresolved
  relative named-symbol imports
- marked unresolved relative symbol imports as stale dependency drift
- added focused behavior coverage for the new warning and stale-signal path

## Why It Matters

Astrograph already reported missing relative target files, but it did not catch
the equally important case where the file still exists and an expected export
has been removed or renamed. This keeps dependency-health output closer to the
actual graph state without forcing broader importer reindex orchestration.
