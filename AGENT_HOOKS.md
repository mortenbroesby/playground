# AGENT_HOOKS.md

Shared hook policy for agent runtimes in `playground`.

## Goals

- Keep code-exploration context small.
- Prefer jcodemunch over broad shell-based file discovery.
- Keep destructive-command, secret, and generated-output protections active.

## Current policy

- `PreToolUse` blocks broad code-exploration shortcuts through `Bash`, `Grep`,
  and `Glob` and redirects the agent toward jcodemunch.
- `PreToolUse` warns on large untargeted `Read` calls for code files but does
  not block them, so edit flows still work.
- `PostToolUse` best-effort reindexes edited code files through
  `jcodemunch-mcp index-file`.
- `PreToolUse` separately blocks dangerous shell commands and protected writes.
- `PostToolUse` audits edits through the existing shared hooks.

## jcodemunch-first flow

1. `plan_turn` or `resolve_repo`
2. `search_symbols` or `search_text`
3. `get_file_outline`, `get_symbol_source`, or `get_context_bundle`
4. Direct file reads only for exact edit context or non-code support files

Tool selection details live in
[`.agents/rules/repo-workflow.md`](.agents/rules/repo-workflow.md) under
`Code Navigation`.

## Runtime mapping

- Claude Code loads the shared hook commands from [`.claude/settings.json`](.claude/settings.json).
- Codex uses the same repo rules and MCP guidance, but does not load this
  Claude-specific hook adapter.

## Notes

- The guard is intentionally narrow. It aims to stop token-wasteful exploration
  patterns without breaking normal shell commands, tests, git operations, or
  targeted reads.
- This follows the same general approach recommended by jcodemunch's
  `AGENT_HOOKS.md`: hard-stop broad exploration shortcuts, keep `Read`
  available, and prefer structured retrieval.
