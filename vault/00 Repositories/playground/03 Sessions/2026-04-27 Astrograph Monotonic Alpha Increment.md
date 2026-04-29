---
id: "mem-20260427-astrograph-monotonic-alpha-increment"
type: "session"
repo_slug: "playground"
title: "Astrograph Monotonic Alpha Increment"
status: archived
created: "2026-04-27"
updated: "2026-04-27"
owner: "agent"
summary: "Astrograph's trailing `alpha.increment` is monotonic and is never reset."
tags: []
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-11"
  expires_after: "2026-10-24"
  keep: false
area: "tools/ai-context-engine"
branch: "astrograph-ai-engine-refactor"
project: "playground"
---

## Decision

Astrograph's trailing `alpha.increment` is monotonic and is never reset.

## Implications

- a minor bump from `0.0.1-alpha.45` becomes `0.1.0-alpha.46`
- a patch bump must also advance the trailing increment
- major bumps still reset minor and patch, but not the trailing increment

## Why

The trailing value is serving as a durable commit-scale sequence number for
Astrograph work, not just a counter scoped to one base semver line.
