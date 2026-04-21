---
type: repo-session
repo: playground
date: 2026-04-17
started_at: 2026-04-17 19:05
summary: Captured a practical recommendation for evaluating MemOS as an auxiliary memory layer while keeping vault plus obsidian-memory as the canonical durable repo memory path.
keywords:
  - memos
  - memory
  - mcp
  - evaluation
  - workflow
touched_paths:
  - vault/00 Repositories/playground/03 Sessions/2026-04-17 MemOS Evaluation Ideas.md
tags:
  - type/session
  - repo/playground
---

# MemOS Evaluation Ideas

## Recommendation

Do not make MemOS the primary repo memory system.

Keep the current memory split:

- `vault/` plus `obsidian-memory` as canonical durable repo memory
- `.agents/context/active-context.md` as the low-token handoff layer
- MemOS, if added, as an auxiliary cross-session agent memory layer

## Why

The current repo already has a strong explicit memory architecture:

- durable notes are versioned in git
- architecture and workflow state are reviewable in markdown
- retrieval is already cheap through `obsidian-memory`
- code understanding is already handled separately through `jcodemunch`

MemOS solves a different problem. It is useful for agent-managed memory across
sessions and clients, but it should not replace explicit repo-native knowledge.

## Good MemOS Use Cases Here

Use MemOS for things that are useful across sessions but should not become
canonical repo records:

- preferred response style
- recurring coding preferences
- agent workflow habits
- repeated project heuristics
- personal setup notes that are useful across tools

## Bad MemOS Use Cases Here

Do not store canonical repo knowledge in MemOS:

- architecture decisions
- ADR-style records
- task board state
- release notes
- source-of-truth setup instructions
- anything that should be reviewed in git

Those should stay in `vault/`.

## Suggested Rollout

Start small.

### Phase 1: Narrow Pilot

- use one MemOS instance
- use one client first
- prefer local or self-hosted deployment
- write memories manually or only at clear milestones
- treat retrieval as opt-in for preference-sensitive tasks

Success criteria:

- useful cross-session recall
- no conflict with vault memory
- low noise
- easy inspection and deletion of bad memories

### Phase 2: Guarded Expansion

Only expand after the pilot feels clearly useful:

- add a second client
- keep the same memory boundary
- document allowed and disallowed memory categories
- define cleanup rules for stale or incorrect memories

### Phase 3: Stable Policy

If MemOS proves useful, document a stable rule:

- `vault` is canonical
- `active-context` is temporary
- MemOS is assistive only

## Integration Rules

If MemOS is introduced, keep these constraints:

1. Do not auto-save every conversation turn at first.
2. Prefer milestone-based or manually approved saves.
3. Do not run MemOS retrieval before every repo question.
4. Use `obsidian-memory` first for repo history, architecture, and decisions.
5. Use MemOS only when preference continuity or cross-session memory is the
   actual problem.

## Practical Next Step

If this gets implemented, the first implementation should be a small experiment:

- choose one local MemOS deployment path
- connect one client
- store a few safe preference-style memories
- verify retrieval quality across sessions
- document the result in the vault before broad rollout

## Current Position

MemOS looks more promising as an optional adjunct than as a replacement for the
existing repo memory design.

The current vault-first setup is still the best default for durable memory with
low token cost.
