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
- Start by ensuring the repo is indexed; use `index-folder` if the index is
  missing or stale.
- Prefer `search_symbols`, `search_text`, `get_file_outline`,
  `get_symbol_source`, `get_context_bundle`, `get_ranked_context`,
  `get_file_tree`, and `diagnostics`.
- Use `search_symbols` for named code lookups and `search_text` for strings,
  comments, or non-symbol matches.
- Use `get_file_outline` to inspect a file cheaply before opening it, and
  `get_symbol_source` when you already know which implementation you need.
- Use `get_context_bundle` when you need a symbol plus nearby imports and
  supporting context without broad file reads.
- Use `get_ranked_context` when the query is still ambiguous and you need to
  inspect which candidates the engine would actually assemble under budget.
- Use `diagnostics` when you need freshness or watch-health confirmation before
  trusting the local index.
- Use `jcodemunch` for reference-heavy or blast-radius questions that the local
  engine does not cover yet.
- Read files directly only when you need the exact file content for an edit or
  when a non-code support file is not represented in the index.
- Avoid broad shell-based code scans when `ai-context-engine` or `jcodemunch`
  can answer the question more precisely.

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
- Prefer taking the next concrete action immediately when it is already within
  scope and permissions.
- When confirmation is still needed, present one recommended concrete action as
  a textual default where `y` or `Enter` means proceed.
- Frame the next step around one recommended concrete action and one clear
  escape hatch where `n` means stop or keep the safer local state.
