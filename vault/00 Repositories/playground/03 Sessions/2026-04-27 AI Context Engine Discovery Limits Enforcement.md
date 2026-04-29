---
id: "mem-20260427-2026-04-27-ai-context-engine-discovery-limits-enforcement"
type: "session"
repo_slug: "playground"
title: "2026-04-27 AI Context Engine Discovery Limits Enforcement"
status: archived
created: "2026-04-27"
updated: "2026-04-27"
owner: "agent"
summary: "config-only"
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
---

- Scope: follow-up to the `limits` config slice from `.specs/performance-deps.md`
- Goal: enforce the remaining discovery-related limits instead of leaving them
  config-only

## Landed

- `limits.maxFilesDiscovered` now fails supported-file discovery when the
  filtered set exceeds the configured ceiling
- `limits.maxFileBytes` now excludes oversized files from:
  - source discovery
  - filesystem snapshots
  - watch subtree rescans
  - indexed folder refresh
- explicit single-file refresh paths now treat oversized files as non-indexable
  and remove any previously indexed row instead of failing the refresh loop

## Verification

- added scanner tests for:
  - oversized-file exclusion
  - max-file-count failure
- added behavior coverage proving repo-config `maxFileBytes` keeps oversized
  source files out of the index
