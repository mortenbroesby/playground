# CLAUDE.md

Thin Claude Code adapter for this repo.

- Follow [AGENTS.md](AGENTS.md).
- Load shared rules from [`.claude/rules`](.claude/rules), which points to
  [`.agents/rules`](.agents/rules).
- Shared commands, hooks, and skills are exposed through `.claude/*` symlinks.
- Use `ai-context-engine` first for code exploration. If it is unavailable,
  fall back to `jcodemunch` before broad shell-based code scans.
