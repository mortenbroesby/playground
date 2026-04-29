---
id: "mem-20260427-ai-context-engine-metadata-integrity-reporting"
type: "session"
repo_slug: "playground"
title: "AI Context Engine Metadata Integrity Reporting"
status: "done"
created: "2026-04-27"
updated: "2026-04-27"
owner: "agent"
summary: "Later-phase reliability follow-up for Astrograph metadata sidecars."
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

Later-phase reliability follow-up for Astrograph metadata sidecars.

Goal:

- stop silently accepting corrupted repo-local metadata and tell operators to rebuild

Landed:

- added repo-meta health checks against the existing `integrity.sha256` sidecar
- diagnostics now marks unreadable, missing-integrity, and integrity-mismatch metadata as stale reasons
- doctor now emits explicit corruption warnings and rebuild suggestions for broken metadata sidecars
- kept the storage DB readable path intact so diagnostics can still report useful state while metadata is stale

Why:

- the spec explicitly said not to silently ignore stale index corruption
- Astrograph was already writing integrity data but not consuming it during health checks
