---
id: "harden-stryker-smoke-survivors-for-ai-context-engine"
type: "todo"
repo_slug: "playground"
title: "Harden Astrograph Stryker smoke survivors in the standalone repo"
status: "superseded"
created: "2026-04-29"
updated: "2026-05-01"
owner: "morten"
summary: "Superseded by the Astrograph extraction: survivor hardening now belongs in the standalone `../astrograph` repository."
tags: []
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by:
    - "Extract Astrograph To Standalone Repo"
retention:
  review_after: "2026-05-29"
  expires_after: null
  keep: false
ai_appetite: 70
priority: "P1"
source: "Follow-up from the first playground Stryker smoke run on 2026-04-17; superseded by Astrograph extraction."
---

## Why

This task was opened when Astrograph lived inside `playground`. That source tree
has since been removed from this repo, and the current source of truth is the
standalone `../astrograph` checkout published as `@mortenbroesby/astrograph`.

The historical survivor areas may still be useful input for standalone
Astrograph hardening:

- CLI missing-value and invalid-number guards
- CLI boolean-flag parsing branch
- unsupported summary strategy / symbol kind guards
- watch-mode delete-path bookkeeping and `removeFileIndex(...)` truthiness

## Outcome

This playground task is retired. Any future Stryker survivor hardening should be
tracked and run in `../astrograph`.

## Details

## Acceptance Criteria

- the current smoke survivors are reviewed one by one
- high-signal survivors get stronger targeted assertions in the smoke tests
- any intentionally excluded survivor is documented in the standalone
  Astrograph work notes
- the standalone Astrograph mutation score improves over the historical 61.70
  smoke-run baseline

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
