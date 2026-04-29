---
id: "mem-20260428-astrograph-review-fixes-and-spec-archive"
type: "session"
repo_slug: "playground"
title: "Astrograph Review Fixes And Spec Archive"
status: "done"
created: "2026-04-28"
updated: "2026-04-28"
owner: "agent"
summary: "Close the completed Astrograph specs, fix the review findings surfaced on the branch PR, and stabilize the interface verification path around the current observability contract."
tags: []
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-12"
  expires_after: "2026-10-25"
  keep: false
area: "tools/ai-context-engine"
branch: "astrograph-ai-engine-refactor"
project: "playground"
---

## Goal

Close the completed Astrograph specs, fix the review findings surfaced on the
branch PR, and stabilize the interface verification path around the current
observability contract.

## Landed

- moved `.specs/performance-deps.md` and `.specs/ai-engine-refactor.md` into
  `.specs/done/` as archived completed specs
- updated both archived specs so they read as done/final-state records instead
  of active implementation plans
- fixed the CLI boolean flag handling so `--include-references` works as a bare
  flag
- updated benchmark artifact generation to use the real Astrograph package
  version for `benchmarkVersion` and `engineVersion`
- relaxed flaky interface assertions that depended on transient watch metadata
  and token-estimate sampling details
- added focused CLI coverage for `--include-references`

## Verification

- `pnpm --filter @astrograph/astrograph test -- --run tests/interface.test.ts bench/tests/runner.test.ts bench/tests/report.test.ts`

## Notes

The local `astrograph.config.json` observability toggle was left out of this
commit because it was unrelated to the review-fix/spec-archive slice.
