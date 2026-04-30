---
id: "mem-20260430-rag-verify-mode-split"
type: "session"
repo_slug: "playground"
title: "RAG Verify Mode Split"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Split `rag:verify` into a fast default integrity check and an explicit `--full` retrieval-fixture mode so routine verification stays cheap while the deeper golden suite remains available."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "verify"
  - "cli"
  - "fixtures"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-query-surface-integrity-tests"
    - "mem-20260430-doctor-registry-integrity-adoption"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-14"
  expires_after: "2026-10-27"
  keep: false
branch: "feat/agent-facing-rag-rebuild-foundation"
touched_paths:
  - "tools/obsidian-memory/src/verify-obsidian-rag.mjs"
  - "tools/obsidian-memory/tests/verify-obsidian-rag.test.mjs"
---

## Goal

Make `rag:verify` practical for routine use by keeping the default path cheap,
while preserving the deeper retrieval regression suite behind an explicit mode.

## Actions taken

- added CLI arg parsing for fast default mode, `--full`, `--vault`, and
  `--index-root`
- refactored verification into exportable fast and fixture-backed full helpers
- kept the full fixture suite available, but only when `--full` is requested
- added focused tests for arg parsing, fast verification behavior, and
  fixture-only retrieval verification

## Tests run

- `node --test ./tools/obsidian-memory/tests/verify-obsidian-rag.test.mjs`
- `pnpm --filter @playground/obsidian-memory test:retrieval`
- `pnpm --filter @playground/obsidian-memory rag:verify`
- `pnpm --filter @playground/obsidian-memory rag:verify -- --full`

## Findings

- the existing verification fixture suite already had the right coverage shape;
  the missing piece was mode separation, not new retrieval logic
- exportable verify helpers make the CLI boundary testable without spawning a
  subprocess for every assertion

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next thin slice should likely cover the remaining public MCP retrieval
surfaces, especially `memory_context` and `memory_unfold`, since
`memory_search` and `rag:query` now have stronger outer-surface coverage than
the rest of the agent-facing interface.
