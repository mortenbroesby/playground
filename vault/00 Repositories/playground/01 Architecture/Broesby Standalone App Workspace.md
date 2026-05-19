---
id: "mem-20260519-broesby-standalone-app-workspace"
type: "architecture-record"
repo_slug: "playground"
title: "Broesby Standalone App Workspace"
status: "accepted"
created: "2026-05-19"
updated: "2026-05-19"
owner: "agent"
summary: "The Broesby family site starts as its own Vite workspace under apps/broesby with local tests, styles, and entrypoints, separate from apps/host."
tags:
  - "type/architecture"
  - "repo/playground"
keywords:
  - "broesby"
  - "workspace"
  - "vite"
  - "react"
  - "family site"
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-11-19"
  expires_after: null
  keep: true
related_paths:
  - "apps/broesby"
  - "pnpm-lock.yaml"
---

## Context

`broesby.dk` is being built as a private family site, but Task 1 only needs the
standalone app shell and test harness. The repo already has `apps/host` for the
public site and `apps/admin` for local admin workflows.

## Decision

Create a dedicated `apps/broesby` workspace rather than extending `apps/host`.
Keep the first slice self-contained:

- local `package.json`, `tsconfig.json`, and `vite.config.ts`
- app-local entrypoint, top-level `App`, and styles
- workspace-local Vitest setup and integration coverage

## Consequences

- Later Broesby work can add auth, persistence, and deployment setup without
  coupling those concerns to the public host app.
- Verification stays workspace-scoped through Broesby-local `test`,
  `type-check`, and `build` commands.
