---
id: "mem-20260430-mcp-memory-workflow-tools"
type: "session"
repo_slug: "playground"
title: "MCP Memory Workflow Tools"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Extended the obsidian-memory MCP surface with safe classify, write-proposal, and cleanup dry-run tools."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "mcp"
  - "classify"
  - "write"
  - "cleanup"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-retrieval-rerank-extraction"
    - "mem-20260430-write-dry-run-default"
    - "mem-20260430-doctor-status-review-backlog"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-14"
  expires_after: "2026-10-27"
  keep: false
branch: "feat/agent-facing-rag-rebuild-foundation"
touched_paths:
  - "tools/obsidian-memory/src/rag-mcp-server.mjs"
  - "tools/obsidian-memory/tests/query-surface.test.mjs"
---

## Goal

Finish the first agent-facing non-retrieval MCP slice so callers can classify
memory work, preview typed writes, and inspect cleanup backlog without mutating
the vault.

## Actions taken

- added `classify` to the MCP server so callers can route free-text memory
  requests into the typed workflow with structured filters
- added `propose_write` as a dry-run note proposal that validates inputs,
  checks duplicates, renders the note body, and returns the target path without
  writing files
- added `clean_dry_run` so callers can inspect cleanup report output and stale
  generated files without deleting anything
- expanded MCP outer-surface tests to cover the new tools and the updated
  `tools/list` discovery contract

## Tests run

- `node --test ./tools/obsidian-memory/tests/query-surface.test.mjs`
- `node --test ./tools/obsidian-memory/tests/rag-governance.test.mjs`
- `pnpm agents:check`
- `pnpm lint:md`

## Findings

- the existing governance helpers are already narrow enough to support MCP
  tooling safely as long as the server stays dry-run or advisory by default
- MCP contract tests need governance artifacts in the fixture once the tool
  surface extends beyond retrieval-only flows

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

Ralph backlog is now exhausted; the next step should be a final acceptance pass
against the broader ADR and then any remaining docs cleanup needed to call the
spec done end-to-end.
