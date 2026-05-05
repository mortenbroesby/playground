# AGENT_HOOKS.md

Shared hook policy for agent runtimes in `playground`.

## Role

- This file describes the repo's current hook-policy intent.
- The canonical shared runtime contract lives in
  [`.agents/references/agent-runtimes/shared-contract.md`](.agents/references/agent-runtimes/shared-contract.md).
- Code-navigation policy details live in
  [`.agents/rules/repo-workflow.md`](.agents/rules/repo-workflow.md).

## Current Policy

- `PreToolUse` blocks broad code-exploration shortcuts through `Bash`, `Grep`,
  and `Glob` and redirects the agent toward indexed retrieval.
- `PreToolUse` warns on large untargeted `Read` calls for code files but does
  not block them, so edit flows still work.
- `SessionStart` adds a thin shared context banner plus live git state.
- `PreToolUse` separately blocks dangerous shell commands and protected writes.
- `PostToolUse` audits edits through the existing shared hooks.

## Policy Goals

- Keep code-exploration context small.
- Prefer Astrograph over broad shell-based file discovery when indexed code
  retrieval is needed.
- Keep destructive-command, secret, and generated-output protections active.

## Notes

- The guard is intentionally narrow. It aims to stop token-wasteful exploration
  patterns without breaking normal shell commands, tests, git operations, or
  targeted reads.
- This follows the repo-owned structured retrieval policy: hard-stop broad
  exploration shortcuts, keep `Read` available, and prefer indexed retrieval.
