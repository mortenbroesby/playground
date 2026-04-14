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
- Prefer `search_symbols`, `search_text`, `get_file_outline`,
  `get_symbol_source`, `get_file_tree`, `find_importers`, `find_references`,
  and `get_blast_radius`.
- Read files directly only when you need the exact file content for an edit or
  when a non-code support file is not represented in the index.

## Memory

- The repo-local Obsidian vault lives in `vault/`.
- Before answering architecture, historical, or decision questions, query
  `obsidian-memory` when available.
- After editing vault notes, run `pnpm rag:index` when fresh memory is needed
  before commit.

## Verification

- Prefer the narrowest relevant script for the workspace changed.
- For one-workspace code changes, run that workspace's lint, type-check, or
  tests as appropriate.
- For shared contracts, shared tooling, or cross-workspace behavior, broaden to
  affected package checks or `pnpm turbo type-check`.
- For docs-only changes, run `pnpm lint:md` when verification is useful.
- For user-facing behavior, run relevant tests and do a quick manual check when
  practical.
