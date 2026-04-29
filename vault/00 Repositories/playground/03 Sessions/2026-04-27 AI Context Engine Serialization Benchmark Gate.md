---
id: "mem-20260427-2026-04-27-ai-context-engine-serialization-benchmark-gate"
type: "session"
repo_slug: "playground"
title: "2026-04-27 AI Context Engine Serialization Benchmark Gate"
status: "done"
created: "2026-04-27"
updated: "2026-04-27"
owner: "agent"
summary: "Benchmarked `fast-json-stringify` against current Astrograph JSON output paths and kept runtime behavior unchanged because the measured payloads did not justify a serializer switch."
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
---

- Scope: Phase 9 follow-up from `.specs/performance-deps.md`
- Decision: add a `fast-json-stringify` evaluation harness before changing public machine-facing JSON output paths
- Why:
  - the spec explicitly says serialization changes should be gated by profiling or benchmark evidence
  - Astrograph already has centralized perf-script coverage, so serialization fits cleanly as another measured surface
  - a direct benchmark is cheaper than prematurely rewriting MCP or CLI output behavior

## Landed

- Added `bench:perf:serialize`
- Added `scripts/perf-serialize.mjs` and `collectSerializationPerfMetrics(...)`
- Benchmarked native compact JSON against compiled serializer prototypes for:
  - `diagnostics`
  - `get_repo_outline`
  - `get_file_tree`
- Added focused compatibility tests proving the prototype serializer round-trips to the same parsed payloads
- Kept CLI and MCP output behavior unchanged after the benchmark showed no clear win on current payloads

## Result

- The current sample payloads do not justify a runtime switch yet
- `diagnostics` in particular is materially slower through the prototype serializer in the current benchmark
- Follow-up work, if any, should target narrower payloads or larger envelopes where serialization shows up in profiles
