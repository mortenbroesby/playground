---
id: mem-20260417-memos-evaluation-ideas
type: session
repo_slug: playground
title: MemOS Evaluation Ideas
status: done
created: 2026-04-17
updated: 2026-04-17
owner: agent
summary: Captured the practical boundary for evaluating MemOS: useful as an auxiliary preference memory, but not as a replacement for the repo’s vault-first durable memory model.
tags:
  - type/session
  - repo/playground
keywords:
  - memos
  - memory
  - evaluation
links:
  parents: []
  children: []
  related:
    - mem-20260429-repo-memory-architecture
  supersedes: []
  superseded_by: []
retention:
  review_after: 2026-05-01
  expires_after: 2026-10-14
  keep: false
started_at: 2026-04-17 19:05
touched_paths:
  - vault/00 Repositories/playground/03 Sessions/2026-04-17 MemOS Evaluation Ideas.md
branch:
goal: Decide whether MemOS should become part of the repo memory stack.
outcome: MemOS was scoped to an optional assistive layer, while `vault/` plus `obsidian-memory` remained the canonical repo memory path.
decisions:
  - Keep the vault as canonical durable repo memory.
  - Use MemOS only for assistive cross-session preference recall if it is adopted at all.
blockers: []
next_step: Only run a narrow MemOS pilot if there is a real cross-session preference problem that the current vault plus active-context split cannot solve.
---

## Recommendation

Do not make MemOS the primary repo memory system.

Keep the current split:

- `vault/` plus `obsidian-memory` for canonical repo knowledge
- `.agents/context/active-context.md` for low-token handoff state
- MemOS, if adopted, as an auxiliary preference and continuity layer

## Good Boundary

MemOS is reasonable for:

- response-style preferences
- recurring workflow habits
- personal setup hints
- cross-session continuity that should not become canonical repo history

MemOS is not the place for:

- architecture decisions
- task board state
- release notes
- setup instructions that should stay reviewable in git

## Rollout Rule

If this is tried at all, start with one local deployment, one client, and
manually curated memories. Retrieval should stay opt-in and milestone-based,
not always-on.

## Current Position

MemOS looked promising as an assistive layer, but the vault-first model
remained the correct default for durable repo memory.
