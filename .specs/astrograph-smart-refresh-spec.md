# Astrograph Smart Refresh Spec

## Objective

Make Astrograph refresh at meaningful git checkpoints without giving up the
existing low-latency watcher for active edits.

## Problem

The current watcher is good at noticing local file edits, but it does not align
well with the moments users actually trust as stable checkpoints:

- after a commit
- after a branch checkout
- after a merge
- before a push

We also do not yet have Merkle-style invalidation or a dependency fan-out
system, so Astrograph cannot cheaply reason about the full affected closure of a
change set.

## Decision

Use a hybrid model:

1. Keep the watcher for live edit responsiveness.
2. Add git-triggered smart refresh hooks for stable checkpoints.
3. Use cheap changed-file analysis for the first slice:
   - incremental `index-file` when the checkpoint changed a small set of
     supported source files
   - fallback `index-folder` when deletes, renames, or structural changes make
     the narrow path unsafe
4. Defer Merkle hashing and dependency fan-out to a later slice.

## First Slice

### Scope

- Add a repo-local `astrograph-smart-refresh` script.
- Trigger it from:
  - `.husky/post-commit`
  - `.husky/post-checkout`
  - `.husky/post-merge`
  - `.husky/pre-push`
- Run the refresh in the background so git hooks stay fast.
- Log refresh activity under `.astrograph/`.

### Refresh Policy

- If the checkpoint changed only a small set of supported source files
  (`.ts`, `.tsx`, `.js`, `.jsx`, `.cjs`, `.mjs`), run `index-file` for each.
- If the checkpoint includes deletes, renames, or structural files such as
  `package.json`, `pnpm-lock.yaml`, or `astrograph.config.json`, run
  `index-folder`.
- If nothing relevant changed, do nothing.

## Non-Goals

- No realtime database.
- No Merkle tree implementation yet.
- No dependency-based stale propagation yet.
- No attempt to replace the watcher.

## Follow-Up

The next architectural slice should add:

1. persisted file and symbol hashes
2. reverse dependency edges
3. dirty-set propagation from a changed node to affected dependents
4. smarter refresh plans derived from that graph instead of plain git diffs

## Acceptance Criteria

- A commit triggers a background Astrograph refresh decision.
- A checkout or merge triggers a background Astrograph refresh decision.
- A push trigger can request a background refresh without blocking the push on
  indexing work.
- Small source-only change sets use `index-file`.
- Unsafe change sets fall back to `index-folder`.
- The behavior is documented in Astrograph docs and the session note.

## Verification

- `pnpm --filter @playground/ai-context-engine test -- --run tests/interface.test.ts tests/engine-contract.test.ts tests/engine-behavior.test.ts`
- `pnpm agents:check`
- `pnpm markdown:check .specs/astrograph-smart-refresh-spec.md tools/ai-context-engine/README.md 'vault/00 Repositories/playground/03 Sessions/2026-04-25 MCP Startup Hardening And Jcodemunch Fallback.md'`
