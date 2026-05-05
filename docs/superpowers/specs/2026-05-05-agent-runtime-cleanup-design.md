# Agent Runtime Cleanup Design

**Date:** 2026-05-05
**Status:** Approved for implementation

## Goal

Run a focused refactor of the shared agent runtime surfaces so the repo has a
clear separation between:

- shared hook and rule implementation
- runtime-specific registration adapters
- runtime-specific reference notes

The cleanup should reduce duplicated guidance and registration drift without
changing intended hook behavior unless an obvious dead or redundant adapter
detail is discovered during the work.

## Scope

This slice covers:

1. shared runtime contract consolidation
2. hook-policy doc cleanup
3. runtime-specific adapter note tightening
4. minimal adapter registration cleanup only if justified

This slice does not include broad hook behavior rewrites.

## Current Problems

- Shared runtime responsibilities are described in multiple places:
  `AGENT_HOOKS.md`, `.agents/references/agent-runtimes/shared-contract.md`,
  and the runtime-specific notes.
- Runtime-specific notes for Claude and Codex both restate pieces of the shared
  contract instead of pointing back to one canonical source.
- The repo’s adapter layer is conceptually thin, but the documentation around
  it still makes future hook maintenance feel more complex than it is.

## Desired Outcome

After the cleanup:

- `.agents/references/agent-runtimes/shared-contract.md` is the canonical
  shared runtime contract.
- `AGENT_HOOKS.md` is a shorter hook-policy note that points back to the shared
  contract and repo workflow policy.
- `.agents/references/agent-runtimes/claude.md` and `codex.md` focus on
  runtime-specific facts instead of repeating the shared contract.
- `.claude/settings.json` and `.codex/hooks.json` stay behaviorally stable
  unless the cleanup reveals a clearly redundant registration detail.

## Approach Options

### Option A: Hook behavior refactor

Change the actual registration or implementation layout while cleaning docs.

Pros:

- Could reduce moving parts

Cons:

- Higher risk
- Harder to verify
- Not necessary for the main clarity outcome

### Option B: Contract-first adapter cleanup

Consolidate the contract and references first, then make only tiny runtime
surface changes if the docs cleanup exposes obvious redundancy.

Pros:

- Clear useful outcome
- Lower risk
- Keeps behavior stable

Cons:

- Leaves deeper behavioral refactors for a later dedicated slice

### Option C: Runtime-note rewrite only

Limit the work to the runtime-specific notes and leave shared docs alone.

Pros:

- Smallest change

Cons:

- Leaves the underlying duplication in place

## Chosen Approach

Choose Option B.

This makes the adapter layer easier to maintain without taking on a behavioral
hook refactor.

## Design

### Shared contract ownership

- `.agents/references/agent-runtimes/shared-contract.md` owns the shared model
  for rules, hooks, and skills across runtimes.
- It should explain what is genuinely shared and what is adapter-specific.

### Hook policy note

- `AGENT_HOOKS.md` should describe the current hook-policy intent for this repo
  and point to the shared contract and workflow policy.
- It should not act like a second shared-contract document.

### Runtime-specific notes

- `claude.md` should focus on the Claude entrypoints, adapter file, and
  Claude-only lifecycle specifics.
- `codex.md` should focus on Codex entrypoints, adapter file, and Codex-only
  hook registration or permission behavior.
- Both should link to the shared contract instead of repeating it.

### Registration cleanup threshold

- Do not rewrite `.claude/settings.json` or `.codex/hooks.json` unless a
  registration entry is clearly stale, dead, or self-contradictory.
- Behavior preservation is the default.

## Non-Goals

- No broad hook implementation changes
- No new runtime support surface
- No speculative Copilot adapter rollout
- No changes to Astrograph or memory tooling behavior

## Verification

- `pnpm agents:check`
- `pnpm lint:md`
- targeted grep checks across `.agents/`, `.claude/`, `.codex/`, and
  `AGENT_HOOKS.md`

## Risks And Mitigations

- Risk: the cleanup hides useful runtime differences
  Mitigation: keep runtime-specific notes focused on concrete adapter facts.

- Risk: doc cleanup drifts from actual adapter registration
  Mitigation: read `.claude/settings.json` and `.codex/hooks.json` directly and
  keep behavior preservation as the default.

- Risk: the work expands into hook implementation changes
  Mitigation: only change registration or implementation when the redundancy is
  obvious and safe.
