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

- Use `jcodemunch` as the current default for code navigation.
- Start with `plan_turn`, then prefer `search_symbols`, `search_text`,
  `get_file_outline`, `get_symbol_source`, `get_context_bundle`, and
  `get_file_tree` before broad file reads.
- Use Astrograph (`@mortenbroesby/astrograph`; compatibility bin
  `ai-context-engine`) only as a fallback when `jcodemunch` lacks coverage or
  when you specifically need repo-local diagnostics or index freshness
  confirmation.
- Use `obsidian-memory` for repo history, architecture, and decisions.
- See [`.agents/rules/repo-workflow.md`](.agents/rules/repo-workflow.md) for the
  full workflow policy.

## Code Exploration Policy

- Use `jcodemunch` MCP tools for code navigation instead of broad `Read`,
  `Grep`, `Glob`, or shell exploration.
- Exception: use `Read` when you need exact file content for an edit, because
  the harness expects a read before write-style file changes.
- Fall back to Astrograph only when `jcodemunch` cannot answer the question or
  when you need `diagnostics` to confirm the local index state.
- If a search result returns strong negative evidence, do not keep re-searching
  with random variations hoping the implementation exists. Report the gap.
- After edits, prefer `register_edit` for the touched paths when you need to
  keep the `jcodemunch` index fresh.

## Hooks And Rules

- Shared agent docs live under [`.agents/`](.agents/).
- Codex execution-policy rules live in [`.codex/rules/`](.codex/rules/), with
  [codex/rules](codex/rules) as a docs-path compatibility symlink.
- Claude loads the same shared commands, hooks, and rules through `.claude/*`
  symlinks.

## Skills

- Repo-owned skills live in [`.skills/`](.skills/).
- Discover skills on demand with `pnpm skills:list` and
  `pnpm skills:search <query>`.
- Route a task to the narrowest useful skill set with
  `pnpm skills:route "<task>"`.
- Load a skill only when needed with `pnpm skills:read <skill-name>`.
- Use [`.agents/rules/skill-routing.md`](.agents/rules/skill-routing.md) to
  decide which skills to load for which kinds of tasks.
- For Superpowers-derived skills on Codex, use the tool mapping at
  [codex-tools.md](.skills/using-superpowers/references/codex-tools.md).

## Ship Default

- Default to finishing work by committing and pushing.
- If the user and agent explicitly agreed on a feature branch, push that
  branch.
- Otherwise commit on the current branch and push `main`.
