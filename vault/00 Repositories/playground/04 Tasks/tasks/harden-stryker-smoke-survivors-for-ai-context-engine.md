---
id: "harden-stryker-smoke-survivors-for-ai-context-engine"
type: "todo"
repo_slug: "playground"
title: "Harden Stryker smoke survivors for `ai-context-engine`"
status: "active"
created: "2026-04-29"
updated: "2026-04-29"
owner: "morten"
summary: "The first carved-down Stryker smoke run completed fast enough to keep, but it still left meaningful survivors in the exact boundary logic the smoke profile targets."
tags: []
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-29"
  expires_after: null
  keep: false
ai_appetite: 70
priority: "P1"
source: "Follow-up from the first `@playground/ai-context-engine` Stryker smoke run on 2026-04-17."
---

## Why

The first carved-down Stryker smoke run completed fast enough to keep, but it
still left meaningful survivors in the exact boundary logic the smoke profile
targets.

Those survivors show the smoke tests are useful, but still too weak in a few
important places:

- CLI missing-value and invalid-number guards
- CLI boolean-flag parsing branch
- unsupported summary strategy / symbol kind guards
- watch-mode delete-path bookkeeping and `removeFileIndex(...)` truthiness

## Outcome

The smoke-profile survivors are either killed by stronger tests or explicitly
removed from the smoke mutate scope with a clear reason.

## Details

## Acceptance Criteria

- the current smoke survivors are reviewed one by one
- high-signal survivors get stronger targeted assertions in the smoke tests
- any intentionally excluded survivor is documented in the session note
- `pnpm --filter @playground/ai-context-engine test:mutation` improves over the
  current 61.70 mutation score

## Current survivor areas

- `src/cli.ts`
  - `optionalNumber(...)`
  - `parseArgs(...)` missing-value / boolean-flag handling
- `src/config.ts`
  - `parseSummaryStrategy(...)`
  - `parseSymbolKind(...)`
- `src/storage.ts`
  - `removeFileIndex(...)`
  - `!fileExists` delete-path branch during watch refresh
