---
type: repo-architecture
repo: playground
status: archived
summary: Archived planning docs that used to live under docs/superpowers.
keywords:
  - superpowers
  - plans
  - specs
  - archive
tags:
  - type/architecture
  - repo/playground
---

# Superpowers Archive

`docs/superpowers/` was a planning-only workspace. The useful parts now live
here as a compact archive.

## Archived Entries

- `2026-04-05` Context Mode + Codex plugin setup plan
  - Outcome: the repo got a combined preflight script for plugin setup and version checks.
  - Follow-up: the current repo notes and setup scripts are the durable source of truth.

- `2026-04-05` Turborepo Monorepo Pivot Implementation Plan
  - Outcome: the monorepo pivot and workspace scaffolding landed.
  - Follow-up: the repo home and architecture notes now describe the live layout instead of this plan.

- `2026-04-06` Microfrontend Cleanup Implementation Plan
  - Outcome: the host/remotes cleanup landed and the old MFE shape is no longer current.
  - Follow-up: the current host architecture notes and vault history record the shipped shape.

- `2026-04-08` Mobile-first Polish Implementation Plan
  - Outcome: the mobile drawer and touch fixes shipped.
  - Follow-up: the current host component notes and cleanup history supersede this plan.

- `2026-04-11` Obsidian RAG Memory System Design Spec
  - Outcome: the repo now uses the vault-backed memory corpus and indexer flow.
  - Follow-up: the memory architecture note and `pnpm rag:index` / `pnpm rag:init` scripts are the source of truth.

## Rule Of Thumb

If a superpowers doc is a completed plan or spec, archive it here instead of
leaving it in `docs/superpowers/`.
