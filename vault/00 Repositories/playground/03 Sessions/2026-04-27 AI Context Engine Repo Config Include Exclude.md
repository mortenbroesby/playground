---
id: "mem-20260427-ai-context-engine-repo-config-include-exclude"
type: "session"
repo_slug: "playground"
title: "AI Context Engine Repo Config Include Exclude"
status: archived
created: "2026-04-27"
updated: "2026-04-27"
owner: "agent"
summary: "Phase 6 follow-up for the Astrograph AI engine refactor."
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
project: "playground"
---

Phase 6 follow-up for the Astrograph AI engine refactor.

Goal:

- expose repo-configured indexed-discovery scoping through compiled glob matchers instead of requiring call-site-level include or exclude wiring

Landed:

- added `performance.include` and `performance.exclude` to `astrograph.config.json`
- threaded those patterns through default engine config resolution
- applied the matcher to folder indexing, freshness snapshots, watch subtree rescans, and watch baseline filesystem snapshots
- added contract coverage for config normalization and a behavior test proving include plus exclude precedence during indexed discovery

Why:

- the matcher already existed and was picomatch-backed
- the missing piece was making repo-level indexing scope durable and consistent across indexing and freshness flows
