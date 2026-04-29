---
id: "mem-20260429-gate-session-start-on-pnpm-install-readiness"
type: "architecture-record"
repo_slug: "playground"
title: "Gate Session Start On Pnpm Install Readiness"
status: "accepted"
created: "2026-04-29"
updated: "2026-04-29"
owner: "morten"
summary: "Session-start bootstrap should check for required `pnpm install` artifacts before trying to launch repo-local tooling."
tags:
  - "type/decision"
  - "repo/playground"
keywords:
  - "pnpm"
  - "startup"
  - "hooks"
  - "readiness"
links:
  parents: []
  children: []
  related:
    - "mem-20260429-startup-pnpm-install-readiness-check"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-10-26"
  expires_after: null
  keep: true
decided_on: "2026-04-29"
decision_id: "DEC-2026-04-29-session-start-pnpm-readiness"
related_paths:
  - ".agents/hooks/session-start.mjs"
---

Session-start bootstrap should not assume local dependencies are installed.

Before launching repo-local tooling such as Astrograph watches or related
bootstrap helpers, the startup path should verify the expected `pnpm install`
artifacts exist. If they do not, startup should instruct the user to run
`pnpm install` and skip the broken bootstrap path.

This keeps session-start output honest and avoids failing into half-initialized
tooling.
