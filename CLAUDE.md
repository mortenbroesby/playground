# CLAUDE.md

Thin Claude Code adapter for this repo.

- Follow [AGENTS.md](AGENTS.md).
- Load shared rules from [`.claude/rules`](.claude/rules), which points to
  [`.agents/rules`](.agents/rules).
- Shared commands, hooks, and skills are exposed through `.claude/*` symlinks.
- Use Astrograph (`@mortenbroesby/astrograph`; compatibility bin
  `ai-context-engine`) first for code exploration.
- Use `obsidian-memory` for repo history, architecture, and decisions.

## Code Exploration Policy

Prefer Astrograph MCP tools for code exploration before falling back to raw file
reads or shell search.

- Start with `diagnostics` for the current repository; if the index is missing
  or stale, run `index_folder`.
- Before reading a file, use `get_file_outline` or `query_code` with source
  intent.
- Before searching broadly, use `query_code` or `suggest_initial_queries`.
- Before exploring structure, use `get_file_tree` or `get_repo_outline`.
- Use raw file reads or shell search only when Astrograph cannot answer the
  question or when debugging Astrograph itself.
