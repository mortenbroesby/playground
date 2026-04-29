---
date: 2026-04-27
project: playground
branch: astrograph-ai-engine-refactor
area: tools/ai-context-engine
---

# AI Context Engine Package Intent Metadata

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
