# AGENTS.md

Root guidance for coding agents in this repository. Follow any deeper `AGENTS.md`
closest to the files you edit.

## Core Rules

- Use `pnpm` only; do not add `npm` or `yarn` commands to docs, scripts, or hooks.
- Keep changes scoped to the workspace that owns the behavior.
- Do not edit generated output such as `dist/`, `.next/`, or `.turbo/`.
- Unless the task is explicitly about planning, do not modify `docs/superpowers/`.
- Update the relevant README, `AGENTS.md`, docs note, or vault note when a change
  alters behavior, architecture, workflow, or setup expectations.
- Use the repo `.ignore` defaults for file discovery; bypass them only when the
  task explicitly needs ignored files.
- Larger staged code/config changes must include a vault note under
  `vault/02 Repositories/`; `pnpm knowledge:check` enforces this before commit.
- When available, use `jcodemunch` MCP for code navigation and symbol/reference
  questions; use `obsidian-memory` for repo history, architecture, and decisions.

## Code Exploration Policy

Always use jCodemunch-MCP tools for code navigation. Never fall back to Read,
Grep, Glob, or Bash for code exploration.

Exception: use `Read` when you need to edit a file. Use jCodemunch tools to find
and understand code, then read only the specific file you are about to modify.

Start any session by confirming the repository is indexed:

1. `resolve_repo { "path": "." }`
2. If it is not indexed, call `index_folder { "path": "." }`

If your client supports it, install the jCodemunch enforcement hooks with
`jcodemunch-mcp init --hooks` so read guards, auto-reindex, and session snapshots
stay on the fast path.

For this repo specifically, `pnpm rag:init` installs the post-commit hook that
keeps the Obsidian corpus fresh when vault files change.

Codex does not have the same Claude Code hook surface. For Codex, the closest
adaptation is:

- register `jcodemunch` in `~/.codex/config.toml`
- point Codex at an AGENTS-style instruction file with the code exploration
  policy above and the shared hook policy in `AGENT_HOOKS.md`
- use a shell/tool allowlist in the executor if you are wiring Codex through
  the Responses API or Agents SDK
- keep `pnpm rag:init` as the repo-local freshness hook for vault changes

The hard read/edit/index interception described in `AGENT_HOOKS.md` remains
Claude Code-only, but the shared hook policy and security checks are common to
both runtimes.

Prefer these tools when exploring:

- symbol by name: `search_symbols`
- string, comment, or config value: `search_text`
- file API surface: `get_file_outline`
- one or more symbols: `get_symbol_source`
- repository structure: `get_repo_outline` or `get_file_tree`
- dependency questions: `find_importers`, `find_references`, `get_blast_radius`

## Repo Shape

- `apps/host/` owns routing, page composition, and the public-site/playground split.
- `packages/remotes/todo-app/` is the live injected remote and mount-contract proof.
- `packages/remotes/uplink-game/` is still a workspace package consumed by the host.
- `packages/ui/`, `packages/types/`, and `packages/config/` hold shared components,
  contracts, and tooling.

## Memory

- The repo-local Obsidian vault lives in `vault/`.
- Before answering architecture, historical, or decision questions, query the
  `obsidian-memory` corpus when available and prefer retrieved chunks over broad
  note reads.
- After editing vault notes, run `pnpm rag:index` if you need fresh memory before
  committing.

## Verification

- Prefer the narrowest relevant script for the workspace you changed.
- For one-workspace code changes, run that workspace's lint, type-check, or tests
  as appropriate.
- For shared contracts, shared tooling, or cross-workspace behavior, broaden to
  the affected package checks or `pnpm turbo type-check`.
- For docs-only changes, run `pnpm lint:md` when verification is needed.
- For user-facing behavior, run relevant tests and do a quick manual check when
  practical.
