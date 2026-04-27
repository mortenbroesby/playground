# CLAUDE.md

Thin Claude Code adapter for this repo.

- Follow [AGENTS.md](AGENTS.md).
- Load shared rules from [`.claude/rules`](.claude/rules), which points to
  [`.agents/rules`](.agents/rules).
- Shared commands, hooks, and skills are exposed through `.claude/*` symlinks.
- Use `jcodemunch` first for code exploration. Keep `ai-context-engine`
  (`@astrograph`) available in parallel, but treat it as the secondary path
  until the repo is ready to switch fully.
