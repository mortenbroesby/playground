# Ralph Runner

This repo keeps the existing planning-oriented Ralph surface in
`.agents/commands/ralph-plan.md` and `.skills/ralph-plan/`.

It also now includes a separate opt-in autonomous runner inspired by
[`snarktank/ralph`](https://github.com/snarktank/ralph), adapted to fit the
repo's current architecture and safety defaults.

## What it is

The runner lives under `scripts/ralph/` and manages:

- a run directory with `prd.json`
- an append-only `progress.txt`
- a `last-run.json` pointer for the most recent iteration
- prompt generation for the next pending story
- optional execution through a supported agent CLI

It does not replace the current Ralph planning flow.

## Why this is separate

The upstream `snarktank/ralph` repo is an autonomous loop engine, not just a
planning prompt. This repo keeps it opt-in and repo-native:

- no plugin scaffolding
- no dangerous sandbox bypass defaults
- no automatic branch switching
- no automatic commits unless explicitly enabled
- no `AGENTS.md` growth by default

## Initialize a run

```bash
pnpm ralph:init -- --title "My feature" --name my-feature --branch main
```

This creates `.ralph/my-feature/` with:

- `prd.json`
- `progress.txt`
- `README.md`
- `last-run.json` after the first loop run

Each story may use either the older `passes` boolean or an explicit `status`.
Supported statuses are `pending`, `in_progress`, `blocked`, and `done`.

The loop prefers:

1. `in_progress` stories first
2. then pending stories by priority
3. then blocked stories only when nothing else remains

Use explicit statuses when you want cleaner resume behavior across iterations.

## Inspect story state

```bash
pnpm ralph:loop -- --dir .ralph/my-feature --list
```

This prints the current story queue with status and priority.

Use one call to inspect all active loops at once:

```bash
pnpm ralph:loop -- --all --list
```

Use autopilot mode only for execution, never for broad exploratory planning:

```bash
pnpm ralph:loop -- --all --autopilot --agent codex --autopilot-max-rounds 12 --autopilot-wait-ms 1000
```

## Dry-run the next prompt

```bash
pnpm ralph:loop -- --dir .ralph/my-feature --dry-run
```

This selects the highest-priority incomplete story and writes a generated prompt
file into the run directory.

You can also target a specific story:

```bash
pnpm ralph:loop -- --dir .ralph/my-feature --story STORY-2 --dry-run
```

Run one or more rounds in one call:

```bash
pnpm ralph:loop -- --dir .ralph/my-feature --rounds 3 --dry-run
```

`--rounds` defaults to `1`.

Run one or more rounds across all active runs in `.ralph`:

```bash
pnpm ralph:loop -- --all --rounds 3 --dry-run
```

Autopilot examples:

```bash
pnpm ralph:loop -- --dir .ralph/my-feature --autopilot --agent codex
pnpm ralph:loop -- --dir .ralph/my-feature --autopilot --agent codex --autopilot-max-rounds 5
pnpm ralph:loop -- --all --autopilot --agent codex --autopilot-wait-ms 1500
```

Defaults:

- autopilot caps at 25 rounds unless `--autopilot-max-rounds` is set
- `--autopilot-wait-ms` defaults to `0`

## Execute with Codex

```bash
pnpm ralph:loop -- --dir .ralph/my-feature --agent codex
```

Optional flags:

- `--model <name>`
- `--sandbox workspace-write`
- `--auto-commit`
- `--enforce-branch`
- `--all`
- `--autopilot`
- `--autopilot-max-rounds <n>`
- `--autopilot-wait-ms <n>`
- `--story <id>`
- `--rounds <n>`
- `--list`

## Execute with Claude

```bash
pnpm ralph:loop -- --dir .ralph/my-feature --agent claude
```

## Use a custom command

```bash
pnpm ralph:loop -- --dir .ralph/my-feature --agent-command "my-agent-cli --stdin"
```

The command receives the generated prompt on stdin.

## PRD shape

Example `prd.json`:

```json
{
  "title": "My feature",
  "branchName": "main",
  "checks": ["pnpm agents:check", "pnpm lint:md"],
  "stories": [
    {
      "id": "STORY-1",
      "title": "Implement the first vertical slice",
      "priority": "high",
      "status": "pending",
      "notes": "Keep the scope narrow and verifiable."
    }
  ]
}
```

Supported priorities are `critical`, `high`, `medium`, and `low`. Numeric
priorities also work, with lower numbers selected first.

## What improved from the first cut

- `prd.json` is validated before the loop runs, so malformed stories fail fast
- prompts now include the current story queue and the tail of `progress.txt`
- `last-run.json` records which story the last iteration selected
- stories can be targeted explicitly with `--story`
- `--rounds` runs multiple iterations in one invocation and records round metadata
- `--all` can execute a single merged loop across `.ralph/*` runs
- `--autopilot` runs repeated rounds automatically until no pending stories or cap is reached
- `--list` provides a quick status view without generating a prompt

## Differences from upstream

- planning remains in the shared `.agents/` surface
- execution is a separate script, not a replacement for the planning skill
- safe defaults are stronger than upstream
- the repo's existing docs, rules, hooks, and memory model remain the source of
  truth
