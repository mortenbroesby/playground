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

- Use `jcodemunch` MCP for code navigation and symbol/reference questions when
  available.
- Start by resolving the indexed repo; index the folder if it is missing.
- Start new code tasks with `plan_turn` when you need quick route selection.
  Use it to get a fast recommendation for likely files and symbols before you
  read anything directly.
- Prefer `search_symbols`, `search_text`, `get_file_outline`,
  `get_symbol_source`, `get_context_bundle`, `get_file_tree`,
  `find_importers`, `find_references`, and `get_blast_radius`.
- Use `search_symbols` for named code lookups and `search_text` for strings,
  comments, or non-symbol matches.
- Use `get_file_outline` to inspect a file cheaply before opening it, and
  `get_symbol_source` when you already know which implementation you need.
- Use `get_context_bundle` when you need a symbol plus nearby imports and
  supporting context without broad file reads.
- Read files directly only when you need the exact file content for an edit or
  when a non-code support file is not represented in the index.
- Avoid broad shell-based code scans when `jcodemunch` can answer the question
  more precisely.

## Memory

- The repo-local Obsidian vault lives in `vault/`.
- Before answering architecture, historical, or decision questions, query
  `obsidian-memory` when available.
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
