---
id: "mem-20260430-rag-governance-parser-cleanup"
type: "session"
repo_slug: "playground"
title: "RAG Governance Parser Cleanup"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Removed the stale hand-rolled frontmatter parser from RAG governance after strict YAML parsing became the shared path."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "frontmatter"
  - "cleanup"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-rag-memory-schema-foundation"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-14"
  expires_after: "2026-10-27"
  keep: false
branch: "feat/agent-facing-rag-rebuild-foundation"
touched_paths:
  - "tools/obsidian-memory/src/rag-governance.mjs"
---

## Summary

Cleaned up `rag-governance.mjs` after the merge from `origin/main` by deleting
the obsolete local YAML subset parser helpers.

## Actions taken

- kept `planFrontmatterFix()` on the strict `parseMemoryMarkdown()` path
- removed the old `parseFrontmatter()`, YAML subset parser, scalar parser, and
  quote-stripping helpers from governance
- left the separate `rag-index.ts` parser in place because the indexer still
  uses it for its compatibility flow

## Verification

- `git diff --check`
- `pnpm --filter @playground/obsidian-memory rag:test`
- `pnpm rag:verify --full`
- `pnpm rag:doctor --json`
