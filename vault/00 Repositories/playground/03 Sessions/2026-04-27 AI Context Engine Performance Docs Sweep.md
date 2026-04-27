# 2026-04-27 AI Context Engine Performance Docs Sweep

- Scope: final documentation pass for `.specs/performance-deps.md`
- Goal: close the remaining acceptance gap around performance workflow guidance

## Landed

- Added `tools/ai-context-engine/docs/performance.md`
- Documented:
  - which performance dependencies are used
  - which runtime paths they affect
  - how to run benchmarks
  - how to run profilers
  - how to disable worker mode
  - how watch backend fallback works
  - why `xxHash` is limited to non-security fingerprints
  - why SQLite writes remain single-writer and transactional
- Linked the new doc from the package README

## Outcome

- The package now has an explicit performance workflow document instead of
  scattering those details across changelog-style README bullets
