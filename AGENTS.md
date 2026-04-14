# AGENTS.md

Thin bootstrap for coding agents in this repo.

## Load First

- Follow the shared rules in [`.agents/rules/`](.agents/rules/).
- Follow any deeper `AGENTS.md` closer to the files you edit.
- Use `pnpm`; do not introduce `npm` or `yarn`.
- Keep generated output untouched: `dist/`, `.next/`, `.turbo/`, `coverage/`.

## Fast Map

- `apps/host/`: public site, playground routes, page composition.
- `packages/remotes/todo-app/`: live injected remote and mount-contract proof.
- `packages/remotes/uplink-game/`: game remote consumed by the host.
- `packages/ui/`, `packages/types/`, `packages/config/`: shared UI, contracts,
  and tooling.

## Navigation

- Use `jcodemunch` for code navigation when available.
- Prefer `plan_turn`, `search_symbols`, `get_file_outline`, and
  `get_symbol_source` before broad file reads.
- Use `obsidian-memory` for repo history, architecture, and decisions.
- See [`.agents/rules/repo-workflow.md`](.agents/rules/repo-workflow.md) for the
  full workflow policy.

## Hooks And Rules

- Shared command prompts live in [`.agents/commands/`](.agents/commands/).
- Shared hooks live in [`.agents/hooks/`](.agents/hooks/).
- Shared instruction rules live in [`.agents/rules/`](.agents/rules/).
- Codex execution-policy rules live in [`.codex/rules/`](.codex/rules/), with
  [codex/rules](codex/rules) as a docs-path compatibility symlink.
- Claude loads the same shared commands, skills, hooks, and rules through
  `.claude/*` symlinks.
