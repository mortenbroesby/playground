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
  - vault/02 Repositories/playground
  - tools/rag-index.ts
  - tools/rag-mcp-server.mjs
  - scripts/check-knowledge-reminder.mjs
  - tools/hooks/post-commit
tags:
  - type/architecture
  - repo/playground
---

# Repo Memory Architecture

## Memory Source

The repo's durable memory lives in Markdown notes under `vault/02 Repositories/playground/`.
Architecture notes, decisions, sessions, and open questions are the source material for future
agent context.

The system does not learn from file access. Reading source files or READMEs does not update memory.
Agents must write or update vault notes when the "why" of the repo changes.

## Indexing

`pnpm rag:index` reads vault Markdown, chunks notes by heading, preserves frontmatter metadata, and
writes `.rag/obsidian-vault.corpus.json` plus a manifest.

The indexer skips unchanged notes by mtime unless `--force` is passed. It excludes Obsidian local
state plus template and script folders from the corpus.

## Retrieval

`tools/rag-mcp-server.mjs` exposes the generated corpus through:

- `memory_context` for the repo primer
- `memory_search` for architecture, decision, session, and question lookup
- `memory_unfold` for expanding a cited chunk

Agents should query `obsidian-memory` for repo history, architecture, and decisions before opening
vault files directly.

Search and context tools are compact by default. `memory_search` returns source paths, summaries,
short excerpts, and an explicit `memory_unfold` call for each hit. Agents should unfold only the
specific chunk needed for the task instead of loading every retrieved section.

`jcodemunch` MCP is the companion tool for source-code navigation. Use it for symbols, references,
file outlines, and code relationships when available. Keep `obsidian-memory` focused on durable
architecture, decisions, sessions, and questions rather than raw source-code indexing.

## Forgetting Guard

`pnpm knowledge:check` runs before commit through Husky. Large or structural staged changes must
include a staged note under `vault/02 Repositories/`, which makes memory capture part of the commit
path instead of a separate afterthought.
