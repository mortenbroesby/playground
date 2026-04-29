---
type: repo-session
repo: playground
date: 2026-04-27
started_at: 2026-04-27 13:20
branch: astrograph-ai-engine-refactor
summary: Landed the next `.specs/performance-deps.md` slices in `tools/ai-context-engine`: picomatch-backed path matching plus xxh64-vs-SHA hash routing for routine fingerprints and integrity checks.
keywords:
  - ai-context-engine
  - picomatch
  - xxhash
  - glob
  - performance
  - discovery
  - search
  - hashing
touched_paths:
  - tools/ai-context-engine/package.json
  - tools/ai-context-engine/README.md
  - tools/ai-context-engine/src/config.ts
  - tools/ai-context-engine/src/hash.ts
  - tools/ai-context-engine/src/path-matcher.ts
  - tools/ai-context-engine/src/filesystem-scan.ts
  - tools/ai-context-engine/src/parser.ts
  - tools/ai-context-engine/src/storage.ts
  - tools/ai-context-engine/tests/hash.test.ts
  - tools/ai-context-engine/tests/path-matcher.test.ts
  - tools/ai-context-engine/tests/filesystem-scan.test.ts
  - tools/ai-context-engine/tests/engine-behavior.test.ts
  - tools/ai-context-engine/tests/engine-contract.test.ts
  - tools/ai-context-engine/tests/interface.test.ts
  - pnpm-lock.yaml
tags:
  - type/session
  - repo/playground
---

# AI Context Engine Picomatch Path Matching And Hash Routing

## Summary

This session lands the next `.specs/performance-deps.md` slices for the
Astrograph workspace.

It adds a centralized `path-matcher` utility backed by compiled `picomatch`
matchers, then lands the first shared `xxh64` hashing utility for routine
fingerprints while preserving SHA-256 for integrity checks.

Path matching now covers the two live path-filter seams:

- source discovery include/exclude filtering
- `filePattern` filtering for symbol and text search

Hash routing now covers the first routine fingerprint seams:

- filesystem snapshot content fingerprints
- directory snapshot hashes
- persisted `symbol_signature_hash`
- persisted `import_hash`
- parser-produced file fingerprints plus a separate persisted integrity hash

## What Changed

- added `picomatch` as a runtime dependency for `tools/ai-context-engine`
- added `@types/picomatch` as the workspace type source and removed the local
  shim
- added `@node-rs/xxhash` and introduced `src/hash.ts` as the shared hash
  policy utility
- introduced `src/path-matcher.ts` with normalized include/exclude matching and
  exclude precedence
- preserved dotfile matching and Windows-style separator normalization
- extended `discoverSourceFiles` so future include/exclude callers can reuse the
  compiled matcher without per-file recompilation
- replaced the ad hoc regex-based `filePattern` matcher in `storage.ts` with the
  centralized matcher
- split fast file fingerprints from integrity verification by keeping
  `content_hash` on routine `xxh64` fingerprints and persisting a separate
  `integrity_hash` for SHA-256 verification
- bumped the Astrograph schema version to add the new `integrity_hash` column
- added focused tests for include/exclude precedence, Windows-style patterns,
  dotfiles, hash-policy routing, and integration coverage across discovery,
  search, diagnostics, and interface contracts

## Verification

- `pnpm --filter @astrograph/astrograph test -- tests/hash.test.ts tests/filesystem-scan.test.ts tests/engine-contract.test.ts tests/engine-behavior.test.ts`
- `pnpm --filter @astrograph/astrograph type-check`

`tests/interface.test.ts` still hits Bun observability startup/localhost bind
failures in this sandbox (`observability server exited before startup: 1` and
`listen EPERM 127.0.0.1:34323`), but the non-observability interface assertions
that this slice touched passed before those environment-level failures.
