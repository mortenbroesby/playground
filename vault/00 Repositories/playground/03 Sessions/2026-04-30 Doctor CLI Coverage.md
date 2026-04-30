---
id: "mem-20260430-doctor-cli-coverage"
type: "session"
repo_slug: "playground"
title: "Doctor CLI Coverage"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Added direct `rag:doctor` CLI coverage, including fixture-backed path overrides, grouped JSON assertions, nonzero exit behavior for broken indexes, and non-blocking advisory-only frontmatter backlog checks."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "doctor"
  - "cli"
  - "governance"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-rag-verify-mode-split"
    - "mem-20260430-mcp-tools-list-coverage"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-14"
  expires_after: "2026-10-27"
  keep: false
branch: "feat/agent-facing-rag-rebuild-foundation"
touched_paths:
  - "tools/obsidian-memory/src/rag-doctor.mjs"
  - "tools/obsidian-memory/tests/rag-doctor.test.mjs"
---

## Goal

Cover the outer `rag:doctor` contract directly so governance behavior is tested
at the CLI boundary, not only through in-process helpers.

## Actions taken

- added `--vault` and `--index-root` support to `rag:doctor`
- exported doctor arg parsing and execution helpers for direct test use
- added CLI tests for grouped JSON output under broken-index conditions
- asserted advisory-only frontmatter backlog stays non-blocking at the CLI
  level

## Tests run

- `node --test ./tools/obsidian-memory/tests/rag-doctor.test.mjs`
- `pnpm --filter @playground/obsidian-memory test:retrieval`
- `pnpm knowledge:check`

## Findings

- doctor’s grouping policy was already correct; the missing seam was fixture
  injection for the CLI entrypoint
- path override support makes governance CLI coverage practical without
  depending on the live repo state

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next thin slice should likely cover `rag:verify` failure output in the same
style, so both governance-facing CLIs have direct broken-index contract tests.
