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

- Use `ai-context-engine` as the repo-owned default for code navigation when
  available.
- If `ai-context-engine` is unavailable, fall back to `jcodemunch` rather than
  broad shell-based code scans.
- For `jcodemunch` fallback flows, start with `plan_turn`, then prefer
  `search_symbols`, `get_file_outline`, and `get_symbol_source`.
- Prefer `query_code`, `get_file_outline`, and `diagnostics` before broad file
  reads.
- Use `query_code` intents instead of the older granular retrieval surfaces.
- Use `obsidian-memory` for repo history, architecture, and decisions.
- Use [`.agents/context/active-context.md`](.agents/context/active-context.md)
  only as compact current-state or handoff context when present.
- See [`.agents/rules/repo-workflow.md`](.agents/rules/repo-workflow.md) for the
  full workflow policy.

## Hooks And Rules

- Shared agent docs live under [`.agents/`](.agents/).
- Codex execution-policy rules live in [`.codex/rules/`](.codex/rules/), with
  [codex/rules](codex/rules) as a docs-path compatibility symlink.
- Claude loads the same shared commands, skills, hooks, and rules through
  `.claude/*` symlinks.

## Ship Default

- Default to finishing work by committing and pushing.
- If the user and agent explicitly agreed on a feature branch, push that
  branch.
- Otherwise commit on the current branch and push `main`.
