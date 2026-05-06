# Hook Implementation Cleanup Design

**Date:** 2026-05-05
**Status:** Approved for implementation

## Goal

Run a focused refactor of the shared hook implementation layer so the main
enforcement hooks are smaller, the repeated rule-evaluation logic is extracted
into shared helpers, and a small number of low-risk policy corrections can land
when they are clearly justified by the cleanup.

## Scope

This slice covers:

1. helper extraction in `.agents/hooks/lib/`
2. simplification of the main enforcement hook entrypoints
3. tiny policy corrections only where the current behavior is obviously rough

This slice does not include broad hook-registration changes or a major hook
policy rewrite.

## Current Problems

- Path-based enforcement logic is split across multiple hook files with similar
  normalization and rule-walk patterns.
- Command-based enforcement logic mixes shared policy classification with
  entrypoint-specific handling.
- The hook entrypoints are still small enough to understand, but they are more
  repetitive than they need to be.
- A cleanup round is the right place to tighten any clearly accidental false
  positives or uneven rule handling.

## Desired Outcome

After the cleanup:

- shared path-rule evaluation lives in reusable helpers
- shared command classification lives in reusable helpers where it makes sense
- `code-navigation-guard.mjs`, `protect-files.mjs`, and
  `block-dangerous-commands.mjs` read as thin decision layers
- any policy changes are tiny, explicit, and easy to justify

## Approach Options

### Option A: Full hook-policy rewrite

Refactor structure and revisit what each hook blocks, warns on, or logs.

Pros:

- Maximum control

Cons:

- Mixes cleanup with policy design
- Higher verification risk

### Option B: Helper-first cleanup with tiny rule fixes

Extract repeated logic into helpers, keep behavior stable by default, and only
apply small rule corrections where the current behavior is obviously uneven.

Pros:

- Clear useful outcome
- Lower risk
- Makes future policy work easier

Cons:

- Leaves deeper hook-policy redesign for a later slice

### Option C: Pure structural cleanup

Refactor helpers and naming only, with zero policy movement.

Pros:

- Safest possible path

Cons:

- Misses obvious low-risk corrections when they appear during cleanup

## Chosen Approach

Choose Option B.

This gives a durable implementation improvement while still allowing tiny fixes
that are cheap to justify and verify.

## Design

### Shared helper extraction

- Keep `.agents/hooks/lib/core.mjs` as the shared hook foundation.
- Add reusable helper modules only when they reduce real duplication.
- Good extraction targets:
  - path-pattern rule evaluation
  - touched-path classification
  - command-pattern matching or push-policy checks

### Thin hook entrypoints

Each enforcement hook should read as:

1. parse the relevant input
2. evaluate focused shared rules
3. return a single clear decision or warning

Target entrypoints:

- `.agents/hooks/code-navigation-guard.mjs`
- `.agents/hooks/protect-files.mjs`
- `.agents/hooks/block-dangerous-commands.mjs`

### Policy correction threshold

Allowed:

- tighten a pattern that is obviously too broad
- narrow a false positive
- align two similar rule paths that currently handle the same class differently

Not allowed:

- broad new policy categories
- registration-surface changes without a strong reason
- behavioral churn that needs a separate design discussion

## Non-Goals

- No broad rewrite of hook registration in `.claude/settings.json` or
  `.codex/hooks.json`
- No redesign of session-start or logging behavior
- No change to the shared runtime contract docs beyond what implementation
  clarity may require

## Verification

- `pnpm agents:check`
- `pnpm lint:md`
- targeted node syntax checks for touched hook files if useful

## Risks And Mitigations

- Risk: helper extraction hides concrete policy details
  Mitigation: keep rules data close to the hook that owns the policy and only
  extract the generic evaluation logic.

- Risk: small policy changes slip into broader behavior movement
  Mitigation: keep every policy change narrow and explainable in the final diff.

- Risk: the refactor increases indirection without reducing complexity
  Mitigation: only extract helpers that remove repetition across multiple hook
  files.
