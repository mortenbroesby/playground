# CLAUDE.md

Thin Claude Code adapter for this repo.

- Follow [AGENTS.md](AGENTS.md).
- Load shared rules from [`.claude/rules`](.claude/rules), which points to
  [`.agents/rules`](.agents/rules).
- Shared commands, hooks, and skills are exposed through `.claude/*` symlinks.
- Use jcodemunch-first code exploration; Claude hooks will block broad code
  scans through shell search tools.
