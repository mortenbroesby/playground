---
id: "mem-20260430-rag-unresolved-link-enforcement"
type: "session"
repo_slug: "playground"
title: "RAG Unresolved Link Enforcement"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Made rag:index fail by default when canonical frontmatter links point at missing note IDs, while preserving an explicit allow flag for migration and fixture coverage."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "rag:index"
  - "links"
  - "validation"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-rag-memory-schema-foundation"
    - "mem-20260430-rag-index-validation-hardening"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-14"
  expires_after: "2026-10-27"
  keep: false
branch: "feat/agent-facing-rag-rebuild-foundation"
touched_paths:
  - "tools/obsidian-memory/src/rag-index.ts"
  - "tools/obsidian-memory/tests/rag-index.test.mjs"
---

## Goal

Enforce canonical `links.*` integrity in `rag:index` without blocking the
existing migration fixture that intentionally carries unresolved relationships.

## Actions taken

- added red tests for default unresolved-link failure and explicit allow-mode
- made `rag:index` accept `--allow-unresolved-links` as a migration escape hatch
- made `rag:index` throw `links.target_missing` when unresolved canonical links
  are present and the allow flag is not set
- preserved unresolved-link diagnostics output when the allow flag is enabled

## Tests run

- `node --test ./tools/obsidian-memory/tests/rag-index.test.mjs`
- `pnpm --filter @playground/obsidian-memory test:retrieval`

## Findings

- link enforcement belongs after graph construction, where missing targets are
  already collected centrally
- the fixture compatibility test needs the allow flag because it intentionally
  models a superseded reference not yet present in the vault

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next thin slice should move one more policy boundary out of inline
`rag-index.ts` logic, likely by extracting note-registry assembly or by adding a
dedicated duplicate/integrity report surface that can be reused by `rag:doctor`.
