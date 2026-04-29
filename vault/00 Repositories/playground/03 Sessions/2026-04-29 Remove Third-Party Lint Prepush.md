---
date: 2026-04-29
tags:
  - repo-memory
  - tooling
  - hooks
---

# Remove Third-Party Lint Prepush

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
