---
id: "mem-20260411-jcodemunch-codex-setup"
type: "session"
repo_slug: "playground"
title: "jCodemunch Codex Setup"
status: "active"
created: "2026-04-11"
updated: "2026-04-11"
owner: "agent"
summary: "Registered jCodemunch MCP with Codex and indexed the repo with focused ignore rules."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "jcodemunch"
  - "codex mcp"
  - "code navigation"
  - "symbol index"
  - "obsidian-memory"
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-04-25"
  expires_after: "2026-10-08"
  keep: false
started_at: "2026-04-11 21:35"
touched_paths:
  - "AGENTS.md"
  - "vault/00 Repositories/playground/01 Architecture/Repo Memory Architecture.md"
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

