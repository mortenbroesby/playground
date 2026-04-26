---
alwaysApply: true
---

# Repo Workflow

## Core Policy

- Use `pnpm` only.
- Keep changes scoped to the workspace that owns the behavior.
- Do not edit generated output: `dist/`, `.next/`, `.turbo/`, `coverage/`.
- Unless the task is explicitly about planning, do not modify
  `docs/superpowers/`.
- Update the relevant README, rule, hook doc, vault note, or AGENTS file when a
  change alters behavior, architecture, workflow, or setup expectations.
- Larger staged code/config changes must include a vault note under
  `vault/02 Repositories/`; `pnpm knowledge:check` enforces this before commit.

## Code Navigation

- Use `ai-context-engine` as the default repo-owned code retrieval path when
  available.
- If `ai-context-engine` is unavailable, use `jcodemunch` as the fallback
  retrieval path before broad shell-based exploration.
- For `jcodemunch` fallback flows, start with `plan_turn` when you need route
  selection, then prefer `search_symbols`, `search_text`, `get_file_outline`,
  `get_symbol_source`, `get_context_bundle`, and `get_file_tree`.
- Start by ensuring the repo is indexed; use `index-folder` if the index is
  missing or stale.
- Prefer `query_code`, `get_file_outline`, `get_file_tree`, and `diagnostics`.
- Use `query_code` with `discover`, `source`, or `assemble` intent instead of
  the older granular retrieval tools.
- Use `get_file_outline` to inspect a file cheaply before opening it.
- Use `diagnostics` when you need freshness or watch-health confirmation before
  trusting the local index.
- Read files directly only when you need the exact file content for an edit or
  when a non-code support file is not represented in the index.
- Avoid broad shell-based code scans when `ai-context-engine` can answer the
  question more precisely.

## Memory

- The repo-local Obsidian vault lives in `vault/`.
- Treat the vault plus `obsidian-memory` as the only durable repo memory.
- Before answering architecture, historical, or decision questions, query
  `obsidian-memory` when available.
- Use `.agents/context/active-context.md` only as a compact active-task or
  handoff layer when a short current-state summary will save tokens.
- Keep active context small, disposable, and operational:
  current task, branch, blockers, next step, and a few relevant file paths.
- Do not store canonical decisions, architecture history, or long transcripts in
  active context; move durable knowledge into `vault/` notes instead.
- After editing vault notes, run `pnpm rag:index` when fresh memory is needed
  before commit.

## Verification

- Prefer the narrowest relevant script for the workspace changed.
- Treat `build` and `type-check` as the default baseline for app and feature
  workspaces.
- Add `lint` when a workspace has local ESLint wiring.
- Add `test` when a workspace owns behavior worth verifying in isolation.
- Config-only packages may omit runtime scripts when they only publish shared
  presets.
- For one-workspace code changes, run that workspace's lint, type-check, or
  tests as appropriate.
- For shared contracts, shared tooling, or cross-workspace behavior, broaden to
  affected package checks or `pnpm turbo type-check`.
- For docs-only changes, run `pnpm lint:md` when verification is useful.
- For user-facing behavior, run relevant tests and do a quick manual check when
  practical.

## Final Stage

- Once the task reaches the final stage, do not end on soft optional phrasing
  such as "if you want, I can...".
- Default to ending implementation work by committing and pushing the result.
- If the user and agent explicitly agreed on a feature branch, push that
  branch.
- Otherwise commit on the current branch and push `main`.
- Prefer taking the next concrete action immediately when it is already within
  scope and permissions.
- When confirmation is still needed, present one recommended concrete action as
  a textual default where `y` or `Enter` means proceed.
- Frame the next step around one recommended concrete action and one clear
  escape hatch where `n` means stop or keep the safer local state.
