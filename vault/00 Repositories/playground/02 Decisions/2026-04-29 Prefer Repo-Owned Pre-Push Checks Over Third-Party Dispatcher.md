---
id: "mem-20260429-prefer-repo-owned-pre-push-checks-over-third-party-dispatcher"
type: "architecture-record"
repo_slug: "playground"
title: "Prefer Repo-Owned Pre-Push Checks Over Third-Party Dispatcher"
status: "accepted"
created: "2026-04-29"
updated: "2026-04-29"
owner: "morten"
summary: "Keep the pre-push flow repo-owned and changed-file-aware instead of depending on a third-party dispatcher package."
tags:
  - "type/decision"
  - "repo/playground"
keywords:
  - "pre-push"
  - "hooks"
  - "tooling"
  - "lint-prepush"
links:
  parents: []
  children: []
  related:
    - "mem-20260429-lint-prepush-hook-wiring"
    - "mem-20260429-remove-third-party-lint-prepush"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-10-26"
  expires_after: null
  keep: true
decided_on: "2026-04-29"
decision_id: "DEC-2026-04-29-repo-owned-pre-push-checks"
related_paths:
  - ".husky/pre-push"
  - "scripts/prepush-checks.mjs"
---

The repo keeps its pre-push routing logic in repo-owned scripts rather than in
a third-party dispatcher package.

The hook should stay changed-file-aware and focused, but the control path
belongs in the repo so it is easier to debug, evolve, and trust.

Third-party wrapper packages are acceptable only when they add real value
beyond what the repo can maintain simply itself.
