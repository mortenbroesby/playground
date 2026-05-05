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

## Workflow Defaults

- Treat [`.agents/rules/repo-workflow.md`](.agents/rules/repo-workflow.md) as
  the canonical workflow policy for code navigation, memory, verification, and
  ship-default behavior.
- Use Astrograph as the default code retrieval path.
- Use `obsidian-memory` for repo history, architecture, and decisions.

## Shared Surfaces

- Shared agent docs live under [`.agents/`](.agents/).
- Repo-owned skills live under [`.skills/`](.skills/).
- Codex execution-policy rules live under [`.codex/rules/`](.codex/rules/),
  with [codex/rules](codex/rules) kept as a docs-path compatibility symlink.
- Claude loads the same shared commands, hooks, and rules through `.claude/*`
  symlinks.
- Use [`.agents/rules/skill-routing.md`](.agents/rules/skill-routing.md) and
  these commands for on-demand skill loading:
  `pnpm skills:list`, `pnpm skills:search <query>`,
  `pnpm skills:route "<task>"`, and `pnpm skills:read <skill-name>`.
- Large-change memory checks (`pnpm knowledge:check`) are enforced by Codex
  hooks during tool-based `git commit` flows. Set
  `SKIP_AGENT_MEMORY_CHECK=1` only for an intentional one-off bypass.
