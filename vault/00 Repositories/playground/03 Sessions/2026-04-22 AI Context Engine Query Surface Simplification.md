---
id: "mem-20260422-ai-context-engine-query-surface-simplification"
type: "session"
repo_slug: "playground"
title: "AI Context Engine Query Surface Simplification"
status: archived
created: "2026-04-22"
updated: "2026-04-22"
owner: "agent"
summary: "Reduced the preferred agent-facing retrieval contract in `ai-context-engine` by adding a unified `query_code` surface, and moved new public-boundary validation toward `zod` instead of adding more hand-written parsing branches."
tags: []
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-06"
  expires_after: "2026-10-19"
  keep: false
---

## Summary

Reduced the preferred agent-facing retrieval contract in `ai-context-engine` by
adding a unified `query_code` surface, and moved new public-boundary validation
toward `zod` instead of adding more hand-written parsing branches.

## What Changed

- added `queryCode` to the library surface with three intents:
  `discover`, `source`, and `assemble`
- added matching `query-code` CLI and `query_code` MCP entrypoints
- kept the older granular commands and tools intact as compatibility layers
- switched the new boundary parsing and shared numeric validation helpers onto
  `zod`
- updated README and shared agent workflow docs so `query_code` becomes the
  preferred starting point for normal code retrieval

## Why

- too many overlapping retrieval entrypoints force agents to learn the tool map
  instead of the repo
- one intent-driven surface is easier to dogfood than several narrowly
  overlapping discovery and assembly commands
- schema-driven validation is easier to read and evolve than growing hand-rolled
  transport parsing code

## Verification

- `pnpm --filter @playground/ai-context-engine type-lint`
- `pnpm --filter @playground/ai-context-engine test -- --run tests/interface.test.ts tests/engine-behavior.test.ts tests/mutation-smoke.cli.test.ts`
- `pnpm --filter @playground/ai-context-engine test`
- `pnpm exec markdownlint-cli2 AGENTS.md .agents/rules/repo-workflow.md .agents/skills/context-engineering/SKILL.md tools/ai-context-engine/README.md 'vault/00 Repositories/playground/03 Sessions/2026-04-22 AI Context Engine Query Surface Simplification.md'`
