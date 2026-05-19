---
id: "mem-20260519-broesby-scaffold-quality-fixes"
type: "session"
repo_slug: "playground"
title: "Broesby Scaffold Quality Fixes"
status: "active"
created: "2026-05-19"
updated: "2026-05-19"
owner: "agent"
summary: "Tightened the Broesby scaffold contract with an explicit password-field assertion, added border-box sizing for the gate input, and aligned the workspace with Vite ESM by setting type module."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "broesby"
  - "vite"
  - "password gate"
  - "box-sizing"
  - "esm"
links:
  parents: []
  children: []
  related:
    - "mem-20260519-broesby-standalone-app-workspace"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-06-02"
  expires_after: "2026-11-19"
  keep: false
branch: "main"
touched_paths:
  - "apps/broesby/package.json"
  - "apps/broesby/src/styles.css"
  - "apps/broesby/tests/app.integration.test.tsx"
---

## Goal

Fix the initial Broesby scaffold quality gaps without expanding scope beyond the
existing workspace.

## Actions taken

- set `"type": "module"` in `apps/broesby/package.json`
- added `box-sizing: border-box` to the password input rule
- tightened the integration test to assert the password-gate container,
  password input type, autocomplete, and stylesheet contract

## Tests run

- `pnpm --filter @playground/broesby test -- --run tests/app.integration.test.tsx`
- `pnpm --filter @playground/broesby build`

## Findings

- the Vite CJS Node API deprecation warning disappeared once the workspace was
  marked as ESM
- `happy-dom` did not expose the imported stylesheet through `getComputedStyle`
  or `document.styleSheets` in this setup, so the test checks the local CSS
  source directly for the box-sizing contract

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice
