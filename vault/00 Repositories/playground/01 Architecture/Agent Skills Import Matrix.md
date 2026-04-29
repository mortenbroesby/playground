---
id: "mem-20260429-agent-skills-import-matrix"
type: "architecture-record"
repo_slug: "playground"
title: "Agent Skills Import Matrix"
status: "archived"
created: "2026-04-29"
updated: "2026-04-29"
owner: "morten"
summary: "Archived migration-era matrix for comparing addyosmani agent-skills ideas against the repo’s current on-demand `.skills` model."
tags:
  - "type/architecture"
  - "repo/playground"
keywords:
  - "agent skills"
  - "workflow"
  - "skills"
  - "references"
  - "adapters"
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by:
    - "mem-20260429-root-skills-architecture"
    - "mem-20260429-use-root-skills-as-canonical-repo-owned-skills-store"
retention:
  review_after: "2026-10-26"
  expires_after: null
  keep: true
---

## Intent

Record which concepts from `addyosmani/agent-skills` fit the current
`playground` shared-agent architecture and which ones should stay out unless the
architecture changes.

## Import

Import lifecycle workflows, core markdown skills, and small reference
checklists where they fit the existing repo-native `.agents/` model. Good
examples are debugging, documentation/ADR support, and API/interface design.

## Adapt

Adapt browser testing, quality references, and any future persona-style
specialists into repo-native forms. The repo wants local commands, local rules,
and thin runtime adapters rather than upstream-specific wrappers.

## Reject

Reject runtime-specific plugin scaffolding, copied setup docs, upstream hook
layouts, and dormant wrapper surfaces with no local consumer. The repo already
has thin adapters, shared hooks, and selected support skills.

## Follow-Up

- Prefer repo-native markdown skills and references over imported runtime
  wrappers.
- Add new support skills only when they map to recurring repo work.
- Revisit shared persona files only if one of the supported runtimes gains a
  stable consumer path for them.
