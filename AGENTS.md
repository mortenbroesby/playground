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

## Code Exploration Policy

Prefer Astrograph MCP tools for code exploration before falling back to raw file reads or shell search.

- Start with `diagnostics` for the current repository; if the index is missing or stale, run `index_folder`.
- Before reading a file, use `get_file_outline` or `query_code` with source intent.
- Before searching broadly, use `query_code` or `suggest_initial_queries`.
- Before exploring structure, use `get_file_tree` or `get_repo_outline`.
- Use raw file reads or shell search only when Astrograph cannot answer the question or when debugging Astrograph itself.
- Use `obsidian-memory` for repo history, architecture, and decisions.
- See [`.agents/rules/repo-workflow.md`](.agents/rules/repo-workflow.md) for the
  full workflow policy.

## Hooks And Rules

- Shared agent docs live under [`.agents/`](.agents/).
- Codex execution-policy rules live in [`.codex/rules/`](.codex/rules/), with
  [codex/rules](codex/rules) as a docs-path compatibility symlink.
- Claude loads the same shared commands, hooks, and rules through `.claude/*`
  symlinks.
- Large-change memory checks (`pnpm knowledge:check`) for commit are enforced by
  Codex hooks when using tool-based `git commit` flows.
- To bypass intentionally once, set `SKIP_AGENT_MEMORY_CHECK=1` for that tool
  command.

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
