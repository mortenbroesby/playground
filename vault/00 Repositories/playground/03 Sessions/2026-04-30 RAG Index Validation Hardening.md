---
id: "mem-20260430-rag-index-validation-hardening"
type: "session"
repo_slug: "playground"
title: "RAG Index Validation Hardening"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Hardened rag:index so strict-shaped notes are validated at parse time, duplicate note IDs fail registry generation, and bootstrap repo-home generation stays compatible from a feature-branch worktree."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "rag:index"
  - "validation"
  - "duplicate-id"
links:
  parents: []
  children: []
  related: ["mem-20260430-rag-rebuild-spec"]
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-14"
  expires_after: "2026-10-27"
  keep: false
branch: "feat/agent-facing-rag-rebuild-foundation"
touched_paths:
  - "tools/obsidian-memory/src/rag-index.ts"
  - "tools/obsidian-memory/src/bootstrap-obsidian-vault.mjs"
  - "tools/obsidian-memory/tests/rag-index.test.mjs"
  - "docs/obsidian/seed/playground-repo-home.md"
---

## Goal

Make the new memory schema enforceable in the live `rag:index` path without
breaking the bootstrap or existing typed-index baseline.

## Actions taken

- added red tests for invalid strict frontmatter and duplicate note IDs in
  `rag-index.test.mjs`
- threaded `parseMemoryMarkdown()` and `validateFrontmatter()` into
  `parseMarkdownFile()` for strict-shaped notes
- made malformed YAML fail immediately during index generation
- made duplicate note IDs fail before registry-to-graph processing
- fixed bootstrap seed selection in worktrees by inferring the current repo slug
  from `package.json` instead of the worktree directory name
- normalized the playground repo-home seed owner to `morten` so the stricter
  schema accepts bootstrapped repo-home notes

## Tests run

- `node --test ./tools/obsidian-memory/tests/rag-index.test.mjs`
- `pnpm --filter @playground/obsidian-memory test:retrieval`

## Findings

- the most effective live integration point for the new schema module is
  `parseMarkdownFile()` in `rag-index.ts`, not `rag:doctor`
- worktree paths break bootstrap’s old “is this the current repo?” heuristic if
  it relies on the directory basename
- current typed fixtures include notes that are effectively strict but still
  rely on missing nested `links.*` keys being normalized to empty arrays

## Decisions that need ADRs

- none yet; this slice followed the existing rebuild ADR rather than changing it

## Todos created

- none in this slice

## Next handoff

The next smallest slice is likely unresolved-link hard failure or a dedicated
note-registry builder boundary extracted out of `rag-index.ts`, depending on
whether we want link enforcement or structural cleanup first.
