---
type: repo-task
repo: playground
id: harden-stryker-smoke-survivors-for-ai-context-engine
priority: P1
status: Ready
ai_appetite: 70
source: "Follow-up from the first `@playground/ai-context-engine` Stryker smoke run on 2026-04-17."
---

# Harden Stryker smoke survivors for `ai-context-engine`

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
