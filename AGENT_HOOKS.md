# AGENT_HOOKS.md

Shared hook policy for agent runtimes in `playground`.

## Goals

- Keep code-exploration context small.
- Prefer `ai-context-engine` over broad shell-based file discovery.
- Keep destructive-command, secret, and generated-output protections active.

## Current policy

- `PreToolUse` blocks broad code-exploration shortcuts through `Bash`, `Grep`,
  and `Glob` and redirects the agent toward `ai-context-engine`.
- `PreToolUse` warns on large untargeted `Read` calls for code files but does
  not block them, so edit flows still work.
- `PostToolUse` best-effort reindexes edited code files through
  a small `ai-context-engine` hook adapter.
- `SessionStart` now bootstraps one repo-local `ai-context-engine` watch
  process in the background so fresh indexing begins automatically and later
  edits or external changes continue to flow into the local index.
- `PreToolUse` separately blocks dangerous shell commands and protected writes.
- `PostToolUse` audits edits through the existing shared hooks.

## ai-context-engine-first flow

1. `query_code`
2. `get_file_outline`, `get_file_tree`, or `get_repo_outline`
3. `diagnostics`
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
- This follows the repo-owned structured retrieval policy: hard-stop broad
  exploration shortcuts, keep `Read` available, and prefer indexed retrieval.
