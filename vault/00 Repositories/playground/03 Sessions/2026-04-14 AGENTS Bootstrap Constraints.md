---
type: repo-session
repo: playground
date: 2026-04-14
started_at: 2026-04-14 22:10
summary: Removed the README agent-workflow section and added constraints to keep AGENTS.md as a thin bootstrap.
keywords:
  - agents
  - docs
  - bootstrap
  - constraints
  - README
touched_paths:
  - README.md
  - AGENTS.md
  - .agents/rules/agent-infrastructure.md
tags:
  - type/session
  - repo/playground
---

# AGENTS Bootstrap Constraints

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
