---
id: "mem-20260429-repo-memory-architecture"
type: "architecture-record"
repo_slug: "playground"
title: "Repo Memory Architecture"
status: "accepted"
created: "2026-04-29"
updated: "2026-04-29"
owner: "morten"
summary: "Durable agent memory is a vault-note workflow indexed into a local corpus, queried through a shared local retrieval module, and exposed through the obsidian-memory MCP server."
tags:
  - "type/architecture"
  - "repo/playground"
keywords:
  - "obsidian-memory"
  - "RAG"
  - "vault"
  - "rag-query"
  - "memory_context"
  - "memory_search"
  - "memory_unfold"
  - "knowledge check"
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-10-26"
  expires_after: null
  keep: true
related_paths:
  - "vault/00 Repositories/playground"
  - "tools/obsidian-rag.mjs"
  - "tools/rag-query.mjs"
  - "tools/rag-index.ts"
  - "tools/rag-mcp-server.mjs"
  - "scripts/check-knowledge-reminder.mjs"
  - ".husky/post-commit"
  - "AGENTS.md"
  - "CLAUDE.md"
  - ".agents/rules"
---

## Memory Source

Durable repo memory lives in Markdown under
`vault/00 Repositories/playground/`. The vault is optimized for agents, not as
a full personal Obsidian system.

- `00 Repo Home.md` is the low-token primer agents should load first.
- `01 Architecture/` holds durable maps, boundaries, and workflow policies.
- `02 Decisions/` holds decision records when the "why" needs to survive.
- `03 Sessions/` holds selected session summaries only when they add useful future context.
- `04 Tasks/` holds the canonical repo task board and other durable task-state
  notes if they are added later.

Inbox-style capture belongs in `BRAINDUMP.md`, and task state now lives in
`vault/00 Repositories/playground/04 Tasks/Task Board.md`. `KANBAN.md` is a
thin pointer, not a second source of truth.

The system does not learn from file access. Agents must write or update vault
notes when the "why" of the repo changes.

## Indexing

`pnpm rag:index` reads vault Markdown, chunks by heading, preserves metadata,
and writes the generated `.rag/` index family plus compatibility outputs. It
skips unchanged notes by mtime and excludes local Obsidian state, templates,
and script folders.

## Retrieval

`tools/obsidian-rag.mjs` is the shared retrieval layer. It handles:

- lexical candidate retrieval with note-type and metadata-aware reranking
- bounded context assembly with structured references
- repo-home context lookup and chunk lookup helpers

It is exposed through `pnpm rag:query` and `tools/rag-mcp-server.mjs`.

The MCP server exposes:

- `memory_context` for the repo primer
- `memory_search` for architecture, decision, and session lookup
- `memory_unfold` for expanding a cited chunk

Agents should query `obsidian-memory` for repo history, architecture, and
decisions before opening vault files directly.

Search stays compact by default: `memory_search` returns paths, summaries,
short excerpts, and an explicit `memory_unfold` hook per hit. Use
Astrograph for source-code navigation and keep `obsidian-memory`
focused on durable architecture, decisions, and session context.

## Forgetting Guard

`pnpm knowledge:check` runs before commit through Husky. Large or structural
changes should include a staged note under `vault/00 Repositories/`.
