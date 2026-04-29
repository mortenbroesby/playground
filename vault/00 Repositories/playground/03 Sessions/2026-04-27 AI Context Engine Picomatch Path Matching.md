---
id: mem-20260427-ai-context-engine-picomatch-path-matching
type: session
repo_slug: playground
title: AI Context Engine Picomatch Path Matching And Hash Routing
status: done
created: 2026-04-27
updated: 2026-04-27
owner: agent
summary: Added centralized picomatch-backed path matching and split fast xxh64 routine fingerprints from SHA-based integrity checks in Astrograph.
tags:
  - type/session
  - repo/playground
keywords:
  - astrograph
  - picomatch
  - xxhash
  - hashing
  - path matching
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: 2026-05-11
  expires_after: 2026-10-24
  keep: false
started_at: 2026-04-27 13:20
branch: astrograph-ai-engine-refactor
touched_paths:
  - tools/ai-context-engine/package.json
  - tools/ai-context-engine/src/config.ts
  - tools/ai-context-engine/src/hash.ts
  - tools/ai-context-engine/src/path-matcher.ts
  - tools/ai-context-engine/src/filesystem-scan.ts
  - tools/ai-context-engine/src/storage.ts
goal: Replace ad hoc path and hash logic with shared runtime utilities for Astrograph.
outcome: Path filtering moved to compiled picomatch helpers, fast and integrity hash roles were separated, and schema/tests were updated around the new hash contract.
decisions:
  - Use centralized picomatch-backed matching for discovery and file-pattern filters.
  - Use xxh64 for routine fingerprints and keep SHA only for integrity verification.
blockers: []
next_step: Keep future performance-dependency notes focused on one runtime utility change at a time.
---

## Goal

Standardize path matching and hash policy across Astrograph’s discovery and
search paths.

## What Changed

- added a centralized picomatch-backed path matcher
- replaced ad hoc file-pattern matching with the shared matcher
- introduced shared xxh64 hashing for routine fingerprints while preserving
  separate SHA-backed integrity verification

## Why It Mattered

This removed scattered matching and hashing policy from the codebase and made
the fast path versus integrity path distinction explicit.

## Verification

- `pnpm --filter @astrograph/astrograph test -- tests/hash.test.ts tests/filesystem-scan.test.ts tests/engine-contract.test.ts tests/engine-behavior.test.ts`
- `pnpm --filter @astrograph/astrograph type-check`

## Notes

Sandboxed Bun observability assertions were still environment-sensitive, so the
meaningful coverage for this slice came from the non-observability engine and
contract tests.
