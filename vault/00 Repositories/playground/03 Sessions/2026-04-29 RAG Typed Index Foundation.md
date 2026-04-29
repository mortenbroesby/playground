---
id: "mem-20260429-rag-typed-index-foundation"
type: "session"
repo_slug: "playground"
title: "RAG Typed Index Foundation"
status: "active"
created: "2026-04-29"
updated: "2026-04-29"
owner: "agent"
summary: "Started the RAG refactor by rebuilding `rag:index` around a typed multi-index output, then hardened retrieval and governance by separating doctor blockers from migration advisories, adding regression tests, and documenting the exported RAG surfaces."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "typed-index"
  - "memory"
  - "graph-index"
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-13"
  expires_after: "2026-10-26"
  keep: false
branch: "feat/rag-refactor"
started_at: "2026-04-29 21:05"
touched_paths:
  - "tools/obsidian-memory/src/rag-index.ts"
  - "tools/obsidian-memory/src/obsidian-rag.mjs"
  - "tools/obsidian-memory/src/rag-governance.mjs"
  - "tools/obsidian-memory/src/rag-classify.mjs"
  - "tools/obsidian-memory/src/rag-clean.mjs"
  - "tools/obsidian-memory/src/rag-doctor.mjs"
  - "tools/obsidian-memory/src/rag-write.mjs"
  - "tools/obsidian-memory/src/rag-query.mjs"
  - "tools/obsidian-memory/src/rag-mcp-server.mjs"
  - "tools/obsidian-memory/src/verify-obsidian-rag.mjs"
  - "tools/obsidian-memory/tests/obsidian-rag.test.mjs"
  - "tools/obsidian-memory/tests/rag-governance.test.mjs"
  - "tools/obsidian-memory/tests/rag-index.test.mjs"
  - "tools/obsidian-memory/package.json"
  - "package.json"
  - "vault/00 Repositories/playground/03 Sessions/2026-04-29 RAG Typed Index Foundation.md"
---

## Summary

Started `.specs/rag-refactor.md` with the lowest-risk migration slice:
rebuild index generation first while keeping the current query path working.

## What Changed

- rewrote `tools/obsidian-memory/src/rag-index.ts` to emit the new generated
  index family:
  - `manifest.json`
  - `note-registry.json`
  - `chunk-index.json`
  - `lexical-index.json`
  - `vector-index.json` placeholder
  - `graph-index.json`
  - `diagnostics.json`
  - `cleanup-report.json`
- kept `obsidian-vault.corpus.json` and `obsidian-vault.manifest.json` as
  compatibility outputs so `rag:query`, verification, and MCP callers still
  have the current retrieval input during migration
- added compatibility normalization for current repo note types:
  - `repo` -> `repo-home`
  - `repo-architecture` and `repo-decision` -> `architecture-record`
  - `repo-session` and `session-note` -> `session`
  - `repo-task` and `repo-tasks` -> `todo`
- normalized older status values like `In Progress`, `Ready`, and `Backlog`
  into the new status model
- extended the frontmatter parser to handle nested maps and lists needed by the
  target `links` and `retention` schema
- added `rag:test` and a new fixture-driven index test covering typed output,
  graph edges, unresolved-link diagnostics, and backward-compatible corpus
  generation
- moved retrieval off `obsidian-vault.corpus.json` and onto the typed
  `note-registry.json`, `chunk-index.json`, and `graph-index.json` outputs
- added a lightweight query planner with expected note types and default
  negative status filters
- updated ranking to combine lexical scoring with type boosts, status boosts,
  selective recency boosts, exact lookup boosts, graph-aware expansion, and a
  small duplicate-note penalty
- rewired `rag:query` and the MCP memory server to load the typed `.rag/`
  index root directly while preserving the existing command and tool surfaces
- added `rag:classify` with a first rule-based request classifier for decisions,
  specs, todos, investigations, glossary-style questions, and cleanup flows
- added a shared governance module for typed index verification, cleanup
  analysis, and command-level policy reuse
- added `rag:clean --dry-run` and `rag:doctor`
- tightened `rag:verify` so it now validates the typed index contract with a
  typed fixture vault instead of the old corpus-only path
- confirmed the real repo still fails `rag:doctor` because most vault notes have
  synthetic IDs and sparse links, which is the expected migration backlog from
  the stricter schema
- added a first `rag:write` command that creates new notes only in the spec’s
  typed folder layout (`architecture/`, `specs/`, `sessions/`, `todos/`,
  `investigations/`, `references/`, `glossary/`)
- added strict template generation for new notes so freshly written memory no
  longer adds synthetic IDs or legacy frontmatter shapes
- added dedupe checks against the typed note registry before write and a
  `--dry-run` mode to inspect the exact output path and frontmatter safely
- added `rag:fix-frontmatter` as a metadata-only migration command with
  default dry-run behavior and explicit `--apply` rewrites for existing notes
- added canonical frontmatter remediation helpers that normalize legacy repo
  note types and statuses, backfill strict `id`/`repo_slug`/`title`/`created`/
  `updated`/`owner`/`links`/`retention` fields, preserve note bodies, and keep
  non-schema metadata like `started_at` and `touched_paths`
- kept the remediation scope narrow to notes under
  `vault/00 Repositories/playground/` so the migration remains reviewable
- added batching controls to `rag:fix-frontmatter` with `--path-prefix`,
  `--limit`, and opt-in content previews so the migration can be applied in
  small reviewed subsets instead of one giant rewrite
- applied the first remediation batch to 10 legacy session notes under
  `03 Sessions/` and reindexed the vault, reducing `rag:doctor` synthetic-ID
  warnings from 114 notes to 104 notes without changing note bodies
- applied the second remediation batch to the next 10 `03 Sessions/` notes and
  reindexed again, reducing `rag:doctor` synthetic-ID warnings further from 104
  notes to 95 notes
- hardened the typed RAG surfaces with JSDoc on exported retrieval, query, and
  governance helpers so the current contract is easier to review and change
- refactored `rag:doctor` to call a shared `buildDoctorReport` helper instead
  of re-implementing policy in the CLI layer
- changed doctor reporting so mechanical migration debt like missing
  frontmatter IDs and missing summaries is treated as advisory backlog, while
  schema, link, and index integrity problems remain blocking failures
- added regression coverage to prove legacy migrated note metadata still
  normalizes to typed `session` and `active` retrieval signals before ranking
- added governance tests to prove session-specific metadata such as `branch`,
  `started_at`, and `touched_paths` survives frontmatter remediation intact
- rewrote this session note itself into the strict typed frontmatter shape,
  removing the remaining synthetic ID for the note while preserving its body

## Verification

- `pnpm --filter @playground/obsidian-memory rag:test`
- `pnpm --filter @playground/obsidian-memory rag:index --json`
- `pnpm --filter @playground/obsidian-memory rag:query --query 'What should we build for typed RAG memory?' --limit 3 --budget 300`
- `pnpm --filter @playground/obsidian-memory rag:classify --input 'We decided to use hybrid retrieval'`
- `pnpm --filter @playground/obsidian-memory rag:clean --dry-run`
- `pnpm --filter @playground/obsidian-memory rag:doctor`
- `pnpm --filter @playground/obsidian-memory rag:verify`
- `pnpm --filter @playground/obsidian-memory rag:write --type spec --title 'Rebuild RAG memory' --summary 'Spec for rebuilding repo memory.' --dry-run`
- `pnpm --filter @playground/obsidian-memory rag:fix-frontmatter`
- `pnpm --filter @playground/obsidian-memory rag:fix-frontmatter --path-prefix '03 Sessions' --limit 10`
- `pnpm --filter @playground/obsidian-memory rag:fix-frontmatter --path-prefix '03 Sessions' --limit 10 --apply`
- `pnpm markdown:check`

## Next Step

Keep shrinking the advisory migration backlog with reviewed
`rag:fix-frontmatter --apply` batches and then add targeted link-backfill flows
for orphan-heavy architecture and session notes so retrieval quality improves
without loosening the typed contract.
