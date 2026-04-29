---
id: "mem-20260414-agents-bootstrap-constraints"
type: "session"
repo_slug: "playground"
title: "AGENTS Bootstrap Constraints"
status: "active"
created: "2026-04-14"
updated: "2026-04-14"
owner: "agent"
summary: "Removed the README agent-workflow section and added constraints to keep AGENTS.md as a thin bootstrap."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "agents"
  - "docs"
  - "bootstrap"
  - "constraints"
  - "README"
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-04-28"
  expires_after: "2026-10-11"
  keep: false
started_at: "2026-04-14 22:10"
touched_paths:
  - "README.md"
  - "AGENTS.md"
  - ".agents/rules/agent-infrastructure.md"
---

## Outcome

Removed the root README `Agent workflow` section because it duplicated internal
agent-surface documentation and made the front door noisier.

Added explicit constraints to `.agents/rules/agent-infrastructure.md` so
`AGENTS.md` stays a thin bootstrap:

- keep it to a few short sections
- prefer pointers over inventories
- do not turn it into a workflow catalog or adapter implementation doc

## Note

The detailed shared-agent surface still lives under `.agents/`, while the root
`AGENTS.md` remains the short load-first pointer file.
