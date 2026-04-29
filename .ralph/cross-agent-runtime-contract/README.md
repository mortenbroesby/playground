# Ralph Run: Tighten cross-agent runtime contract for rules, hooks, and on-demand skills

Files in this directory:

- `prd.json`: task state and story checklist
- `progress.txt`: append-only learnings and iteration log
- `last-run.json`: metadata for the most recently generated iteration
- generated prompt/output files from `pnpm ralph:loop`

Suggested next steps:

1. Edit `prd.json` with concrete stories.
2. Run `pnpm ralph:loop -- --dir .ralph/cross-agent-runtime-contract --list` to inspect story state.
3. Run `pnpm ralph:loop -- --dir .ralph/cross-agent-runtime-contract --dry-run` to inspect the next prompt.
4. Run `pnpm ralph:loop -- --dir .ralph/cross-agent-runtime-contract --agent codex` when the PRD is ready.
