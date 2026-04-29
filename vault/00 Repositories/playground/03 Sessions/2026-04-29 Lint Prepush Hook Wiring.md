---
id: "mem-20260429-lint-prepush-hook-wiring"
type: "session"
repo_slug: "playground"
title: "Lint Prepush Hook Wiring"
status: archived
created: "2026-04-29"
updated: "2026-04-29"
owner: "agent"
summary: "The repo switched its pre-push flow from an inline Husky script to a `lint-prepush`-driven dispatcher while keeping the actual routing logic repo-owned."
tags: []
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by:
    - "mem-20260429-prefer-repo-owned-pre-push-checks-over-third-party-dispatcher"
retention:
  review_after: "2026-05-13"
  expires_after: "2026-10-26"
  keep: false
---

## Summary

The repo switched its pre-push flow from an inline Husky script to a
`lint-prepush`-driven dispatcher while keeping the actual routing logic
repo-owned.

## What Changed

- Added `lint-prepush` as a dev dependency.
- Added `scripts/lint-prepush.mjs` to decide which checks to run from the set of
  changed files.
- Switched `.husky/pre-push` to `pnpm exec lint-prepush`.
- Added `.npmrc` with stricter engine and package-manager enforcement.
- Updated `package.json` and `pnpm-lock.yaml` to reflect the new hook path and
  package-manager policy.

## Why

This keeps pre-push behavior file-aware without burying repo-specific logic
inside the hook itself. `lint-prepush` acts as the dispatcher; the repo script
owns the actual decisions.

## Verification

- `node --check scripts/lint-prepush.mjs`
- `node scripts/lint-prepush.mjs package.json .husky/pre-push`
- `pnpm agents:check`
- `pnpm lint:md`
