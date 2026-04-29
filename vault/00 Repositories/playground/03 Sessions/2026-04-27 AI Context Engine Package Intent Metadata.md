---
id: "mem-20260427-ai-context-engine-package-intent-metadata"
type: "session"
repo_slug: "playground"
title: "AI Context Engine Package Intent Metadata"
status: "done"
created: "2026-04-27"
updated: "2026-04-27"
owner: "agent"
summary: "Close the remaining packaging-clarity gap by making Astrograph's npm alpha intent explicit in publish metadata and README language."
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

## Goal

Close the remaining packaging-clarity gap by making Astrograph's npm alpha
intent explicit in publish metadata and README language.

## Landed

- added package metadata for keywords, homepage, repository, bugs, and Node
  engine requirements
- clarified in the README that Astrograph is a local-first npm alpha rather
  than a supported hosted product
- made the Bun boundary explicit: Bun is only required for the observability
  server, not for normal indexing, CLI, MCP, or library use
- added a contract test so the publish metadata stays aligned with this intent

## Why It Matters

Most of the technical alpha work is already landed. This slice makes the
publish surface match the actual runtime contract, which reduces ambiguity when
Astrograph is installed outside the monorepo.
