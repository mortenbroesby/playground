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
- Keep `ai-context-engine` (`@astrograph`) installed in parallel, but treat it
  as a secondary path until the repo is ready to switch fully.
- For `jcodemunch` flows, start with `plan_turn`, then prefer
  `search_symbols`, `get_file_outline`, and `get_symbol_source`.
- Prefer `search_symbols`, `get_file_outline`, `get_symbol_source`, and
  `get_context_bundle` before broad file reads.
- Use Astrograph selectively for `query_code`, `get_file_outline`, and
  `diagnostics` when you specifically want to validate or compare the newer
  retrieval path.
- Use `obsidian-memory` for repo history, architecture, and decisions.
- Use [`.agents/context/active-context.md`](.agents/context/active-context.md)
  only as compact current-state or handoff context when present.
- See [`.agents/rules/repo-workflow.md`](.agents/rules/repo-workflow.md) for the
  full workflow policy.

## Code Exploration Policy

- Use `jcodemunch` MCP tools for code navigation instead of broad `Read`,
  `Grep`, `Glob`, or shell exploration.
- Exception: use `Read` when you need exact file content for an edit, because
  the harness expects a read before write-style file changes.
- Start by confirming the repo/index route with `plan_turn`, then use:
  `search_symbols`, `search_text`, `get_file_outline`, `get_symbol_source`,
  `get_context_bundle`, `get_file_tree`, and `get_repo_outline`.
- If a search result returns strong negative evidence, do not keep re-searching
  with random variations hoping the implementation exists. Report the gap.
- After edits, prefer `register_edit` for the touched paths when you need to
  keep the `jcodemunch` index fresh.

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
