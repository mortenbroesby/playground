---
id: "mem-20260414-agent-skills-lifecycle-adaptation"
type: "session"
repo_slug: "playground"
title: "Agent Skills Lifecycle Adaptation"
status: archived
created: "2026-04-14"
updated: "2026-04-14"
owner: "agent"
summary: "Adapted compatible lifecycle concepts from addyosmani/agent-skills into repo-native shared skills and command wiring."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "agent skills"
  - "shared skills"
  - "workflow"
  - "commands"
  - "context engineering"
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
started_at: "2026-04-14 21:10"
touched_paths:
  - ".agents/skills"
  - ".agents/commands"
  - ".agents/rules/README.md"
  - "AGENTS.md"
  - "README.md"
---

## Outcome

The repo now carries repo-native lifecycle skills that map more directly to the
concepts from `addyosmani/agent-skills` without importing the upstream
plugin-oriented layout.

Added skills:

- `spec-driven-development`
- `planning-and-task-breakdown`
- `incremental-implementation`
- `test-driven-development`
- `context-engineering`
- `source-driven-development`
- `code-review-and-quality`
- `code-simplification`
- `shipping-and-launch`

## Integration

The existing shared command prompts now target these more specific skills while
keeping `engineering-workflow` as the umbrella lifecycle skill.

The repo keeps its existing thin-adapter architecture:

- shared source under `.agents/`
- runtime adapters and symlinks under `.claude/`, `.codex/`, `.github/`, and
  `.opencode/`
- no `.claude-plugin/` or other runtime-specific plugin scaffolding

## Verification

- `pnpm agents:check`
- `pnpm lint:md`
