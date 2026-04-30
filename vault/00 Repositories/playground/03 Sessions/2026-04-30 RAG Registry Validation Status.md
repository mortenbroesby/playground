---
id: "mem-20260430-rag-registry-validation-status"
type: "session"
repo_slug: "playground"
title: "RAG Registry Validation Status"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Added per-note validation_status and validation_issues fields to note-registry output so typed notes carry their own advisory integrity state without introducing a second validation pass."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "rag:index"
  - "note-registry"
  - "validation"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-rag-registry-chunk-ids"
    - "mem-20260430-rag-unresolved-link-enforcement"
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

Expose a note-level validation status in the generated registry so downstream
tools can reason about advisory integrity without recomputing it from global
diagnostics.

## Actions taken

- added red test coverage for registry `validation_status` and
  `validation_issues`
- populated per-note advisory issues from facts already computed by `rag:index`
- marked emitted notes as `warning` when they rely on synthetic IDs, missing
  summaries, legacy normalization, or explicitly allowed unresolved links
- kept true blockers unchanged so invalid strict frontmatter and duplicate IDs
  still fail before any registry row is written

## Tests run

- `node --test ./tools/obsidian-memory/tests/rag-index.test.mjs`
- `pnpm --filter @playground/obsidian-memory test:retrieval`

## Findings

- the spec’s “validation status” requirement can be satisfied without a new
  validator by projecting existing note and link facts into registry rows
- unresolved links belong in `warning` only when `--allow-unresolved-links` is
  explicitly used; otherwise the note never reaches registry emission

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next thin slice should likely extract note-registry assembly into a shared
builder so `rag:index` and `rag:doctor` can consume one integrity source
instead of re-deriving note-level concerns independently.
