---
type: repo-session
repo: playground
date: 2026-04-11
started_at: 2026-04-11 21:35
summary: Registered jCodemunch MCP with Codex and indexed the repo with focused ignore rules.
keywords:
  - jcodemunch
  - codex mcp
  - code navigation
  - symbol index
  - obsidian-memory
touched_paths:
  - AGENTS.md
  - vault/00 Repositories/playground/01 Architecture/Repo Memory Architecture.md
tags:
  - type/session
  - repo/playground
---

# jCodemunch Codex Setup

## Outcome

Registered `jcodemunch` as a global Codex MCP server and indexed
`/Users/macbook/personal/playground`.

The index command used `--no-ai-summaries` and extra ignore rules for README files, `vault/`,
`plugins/`, `docs/superpowers/`, `.rag/`, generated output, and caches. The index reported 6,988
symbols.

Codex MCP registration now starts:

```bash
jcodemunch-mcp serve --transport stdio --watcher --watcher-path /Users/macbook/personal/playground --watcher-extra-ignore README.md vault/ plugins/ docs/superpowers/ .rag/ dist/ .next/ .turbo/ coverage/
```

## Tool Split

Use `jcodemunch` for code navigation, symbols, references, file outlines, and code relationships.
Use `obsidian-memory` for durable repo memory: architecture, decisions, sessions, open questions,
and historical context.

## Note

Current Codex sessions need a restart before newly registered MCP tools appear in the tool list.
