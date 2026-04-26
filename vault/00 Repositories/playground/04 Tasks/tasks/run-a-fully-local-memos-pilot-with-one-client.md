---
type: repo-task
repo: playground
id: run-a-fully-local-memos-pilot-with-one-client
priority: P2
status: Ready
ai_appetite: 70
source: "[2026-04-17 MemOS Evaluation Ideas.md](</Users/macbook/personal/playground/vault/00 Repositories/playground/03 Sessions/2026-04-17 MemOS Evaluation Ideas.md>)."
---

# Run a fully local MemOS pilot with one client

## Why

If MemOS is worth adding, it should prove value as an auxiliary memory layer
without replacing the vault or adding paid API dependencies.

## Outcome

A small MemOS pilot runs fully locally with one client, stores only safe
preference-style memory, and confirms whether cross-session recall is useful
enough to justify broader setup.

## Details

## Constraints

- fully local or self-hosted deployment only
- no paid providers
- no hosted model or embedding dependency
- one client only for the pilot
- `vault/` plus `obsidian-memory` remain the canonical durable repo memory path
- MemOS must not become the task board, ADR store, or architecture source of
  truth

## Acceptance Criteria

- MemOS is installed and runnable locally in this environment
- one client is connected successfully
- at least a few preference-style memories can be written and retrieved across
  sessions
- the pilot documents exactly what belongs in MemOS vs `vault/`
- cleanup and deletion of bad memories is tested once
- the outcome is written back into the vault before any broader rollout
