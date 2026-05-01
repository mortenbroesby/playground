---
id: "evaluate-tsup-for-ai-context-engine-packaging"
type: "todo"
repo_slug: "playground"
title: "Evaluate Astrograph packaging in the standalone repo"
status: "superseded"
created: "2026-04-29"
updated: "2026-05-01"
owner: "morten"
summary: "Superseded by the Astrograph extraction: packaging decisions now belong in the standalone `../astrograph` repository for `@mortenbroesby/astrograph`."
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
ai_appetite: 20
priority: "P2"
source: "follow-up from ai-context-engine phase 2 closeout; superseded by Astrograph extraction"
---

## Why

This was opened when Astrograph lived inside `playground`. That source tree has
since been removed from this repo, and the current source of truth is the
standalone `../astrograph` checkout published as `@mortenbroesby/astrograph`.

## Outcome

This playground task is retired. Any future `tsup`, build-output, or package
startup decision should be tracked and implemented in `../astrograph`.

## Details

### Scope

- Compare the current native TypeScript runtime against `tsup` for:
  - local developer ergonomics
  - CLI and MCP startup behavior
  - ESM packaging correctness
  - test and workspace compatibility
  - dist artifact expectations
- Run that evaluation in the standalone Astrograph repository only if there is a
  concrete need for published or external-consumer artifacts.

### Acceptance criteria

- Decision is documented with concrete tradeoffs
- If migration is justified, package scripts and export paths are updated in
  `../astrograph`.
- If migration is not justified, the current native TypeScript approach remains
  the documented default

### Non-goals

- Bundling every workspace package in the monorepo
- Introducing generated output without an explicit distribution need
