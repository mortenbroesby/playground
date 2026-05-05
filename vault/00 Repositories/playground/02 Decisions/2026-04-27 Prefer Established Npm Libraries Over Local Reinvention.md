---
id: "mem-20260427-prefer-established-npm-libraries-over-local-reinvention"
type: "architecture-record"
repo_slug: "playground"
title: "Prefer Established Npm Libraries Over Local Reinvention"
status: "accepted"
created: "2026-04-27"
updated: "2026-04-27"
owner: "morten"
summary: "Prefer established npm libraries and published companion types over local reinvention when the dependency is low-risk or medium-risk and already fits the repo."
tags:
  - "type/decision"
  - "repo/playground"
keywords:
  - "npm"
  - "libraries"
  - "types"
  - "agent workflow"
  - "pragmatism"
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-10-24"
  expires_after: null
  keep: true
decided_on: "2026-04-27"
decision_id: "DEC-2026-04-27-established-npm-libraries"
related_paths:
  - "AGENTS.md"
  - "../astrograph/package.json"
  - "../astrograph/src/path-matcher.ts"
---

Agents working in this repo should not be overly conservative about pulling in
small or moderate established npm packages when they clearly fit the problem.

The default preference is:

- use an existing library rather than rebuilding its behavior locally
- use the published companion types package when one exists
- only fall back to local shims or hand-rolled replacements when there is a
  concrete constraint such as missing packages, policy restrictions, or an
  unusually large dependency cost

This applies to both low-risk and medium-risk dependencies. Medium risk does
not mean "avoid by default". It means make the tradeoff explicit: check size,
maintenance quality, security posture, and scope fit, then prefer the library
when the costs are still reasonable.

Concrete example: if a package already has `@types/...`, prefer that over
writing and maintaining a local ambient declaration. Reinventing types for
`picomatch` is worse than depending on `@types/picomatch` unless there is a
specific blocker.

This is a workflow preference, not an absolute rule. Agents should still weigh
dependency size, maintenance quality, security, and repository scope. The point
is to avoid spending engineering time rebuilding stable ecosystem pieces out of
fear of adding a reasonable dependency, including cases that are not perfectly
zero-risk but are still well within normal engineering judgment.
