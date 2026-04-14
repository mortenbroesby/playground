---
type: repo-architecture
repo: playground
status: active
summary: Durable agent memory is a vault-note workflow indexed into a local corpus and exposed through the obsidian-memory MCP server.
keywords:
  - obsidian-memory
  - RAG
  - vault
  - memory_context
  - memory_search
  - memory_unfold
  - knowledge check
related_paths:
  - vault/00 Repositories/playground
  - tools/rag-index.ts
  - tools/rag-mcp-server.mjs
  - scripts/check-knowledge-reminder.mjs
  - .husky/post-commit
  - AGENTS.md
  - CLAUDE.md
  - .agents/rules
tags:
  - type/architecture
  - repo/playground
---

# Repo Memory Architecture

## Memory Source

The repo's durable memory lives in Markdown notes under `vault/00 Repositories/playground/`.
The vault is optimized for agents, not as a full personal Obsidian system.

- `00 Repo Home.md` is the low-token primer agents should load first.
- `01 Architecture/` holds durable maps, boundaries, and workflow policies.
- `02 Decisions/` holds decision records when the "why" needs to survive.
- `03 Sessions/` holds selected session summaries only when they add useful future context.
- `04 Tasks/` holds the canonical repo task board and other durable task-state
  notes if they are added later.

Inbox-style capture belongs in `BRAINDUMP.md`, and task state now lives in
`vault/00 Repositories/playground/04 Tasks/Task Board.md`. `KANBAN.md` is a
thin pointer for human convenience, not a second task source of truth. The
vault no longer keeps empty Inbox, Daily, Dashboard, Questions, Maps, Exports,
or Archive folders because they add navigation surface without improving
retrieval.

The system does not learn from file access. Reading source files or READMEs does not update memory.
Agents must write or update vault notes when the "why" of the repo changes.

## Indexing

`pnpm rag:index` reads vault Markdown, chunks notes by heading, preserves frontmatter metadata, and
writes `.rag/obsidian-vault.corpus.json` plus a manifest.

The indexer skips unchanged notes by mtime unless `--force` is passed. It excludes Obsidian local
state plus template and script folders from the corpus. The active vault structure keeps indexed
Markdown concentrated in the repo-memory subtree so retrieval stays compact.

## Retrieval

`tools/rag-mcp-server.mjs` exposes the generated corpus through:

- `memory_context` for the repo primer
- `memory_search` for architecture, decision, and session lookup
- `memory_unfold` for expanding a cited chunk

Agents should query `obsidian-memory` for repo history, architecture, and decisions before opening
vault files directly.

Search and context tools are compact by default. `memory_search` returns source paths, summaries,
short excerpts, and an explicit `memory_unfold` call for each hit. Agents should unfold only the
specific chunk needed for the task instead of loading every retrieved section.

`jcodemunch` MCP is the companion tool for source-code navigation. Use it for symbols, references,
file outlines, and code relationships when available. Keep `obsidian-memory` focused on durable
architecture, decisions, and session context rather than raw source-code indexing.

## Forgetting Guard

`pnpm knowledge:check` runs before commit through Husky. Large or structural staged changes must
include a staged note under `vault/00 Repositories/`, which makes memory capture part of the commit
path instead of a separate afterthought.
