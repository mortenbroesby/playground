---
id: "mem-20260429-remove-third-party-lint-prepush"
type: "session"
repo_slug: "playground"
title: "Remove Third-Party Lint Prepush"
status: "active"
created: "2026-04-29"
updated: "2026-04-29"
owner: "agent"
summary: "Reverted the `lint-prepush` npm package integration from the pre-push hook."
tags:
  - "repo-memory"
  - "tooling"
  - "hooks"
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-13"
  expires_after: "2026-10-26"
  keep: false
---

Reverted the `lint-prepush` npm package integration from the pre-push hook.

Kept the useful part as repo-owned logic:

- `.husky/pre-push` now calls `node scripts/prepush-checks.mjs`
- `scripts/prepush-checks.mjs` handles changed-file-aware routing for markdown,
  agent setup, skills smoke tests, and Astrograph type-lint

Why:

- the third-party `lint-prepush` package added indirection without adding real
  value
- it had already shown runtime/config fragility in this repo
- the repo-specific dispatcher is simpler and easier to evolve
