---
type: repo-tasks
repo: playground
status: active
summary: Canonical kanban-style task board for the playground repo.
keywords:
  - tasks
  - kanban
  - backlog
  - ready
  - in progress
  - done
related_paths:
  - KANBAN.md
  - BRAINDUMP.md
tags:
  - type/tasks
  - repo/playground
---

# Task Board

Canonical task board for `playground`.

Raw and half-formed ideas belong in [BRAINDUMP.md](/Users/macbook/personal/playground/BRAINDUMP.md).
This note should stay task-shaped and easy to scan.

## Scales

Priority scale:

- `P0` critical next architectural move
- `P1` important near-term follow-up
- `P2` useful next-wave improvement
- `P3` later or exploratory

Lane model:

- `Backlog` useful work worth keeping visible, but not shaped for execution yet
- `Ready` clearly-scoped work that can be picked up next
- `In Progress` work that is actively being executed now
- `Done` work that already landed

AI appetite scale:

- `0%` manual or coordination-heavy work where AI should stay narrow
- `100%` work an agent can drive almost end-to-end with light review

## Backlog

- `P2` Define a stronger page-composition pattern for public routes
  AI Appetite: 70%
  Why: `Home`, `About`, `Writing`, and `Uses` are simpler now, but they still
  evolved page by page.
  Outcome: a small set of editorial layout conventions for headings, metadata,
  link lists, and long-form reading pages.
  Source: architecture review.

- `P1` Rebuild jCodeMunch-style code intelligence layer
  AI Appetite: 80%
  Why: existing solutions are either paid, immature, or fragmented; rebuilding
  a minimal, open, AST-based retrieval system provides control, extensibility,
  and long-term leverage.
  Outcome: a working system that parses a repo, indexes symbols, and exposes a
  retrieval API usable by AI agents such as via MCP, achieving token-efficient,
  precise code access comparable to jCodeMunch.
  Spec-driven regeneration or spec-first reconstruction.
  Scope:
  - Parse codebase using Tree-sitter with multi-language support where possible
  - Extract symbols such as functions, classes, exports, and imports
  - Store in lightweight index such as SQLite
  - Implement retrieval interface:
    - `findSymbol(name)`
    - `getDefinition(symbol)`
    - `search(query)`
  - Return minimal, structured snippets optimized for LLM consumption
  - Support incremental updates through file watching or re-indexing strategy
  - Optional: integrate LSP for improved accuracy and edge cases
  - Optional: add semantic search as a secondary layer
  - Optional: expose via an MCP-compatible interface
  Constraints:
  - Must be fully local and open source
  - Prioritize correctness and token efficiency over feature breadth
  - Keep initial version simple and avoid over-engineering
  Non-goals:
  - Full IDE replacement
  - Complex UI
  - Enterprise-scale indexing
  Source: synthesized from jCodeMunch, LSP systems, and Tree-sitter-based OSS
  patterns.
  Brainfart: Maybe leverage ideas from
  <https://github.com/safishamsi/graphify>. Worth a Ralph loop.

## Ready

- `P1` Pull remaining ideas from `morten.broesby.dk` into the backlog
  AI Appetite: 85%
  Why: there are still useful content and structure cues on the current site
  that have not been translated into this repo.
  Outcome: a clearer list of pages, copy ideas, and content gaps for the
  personal-site side.
  Source: existing seeded todo.

- `P1` Verify injected composition path
  AI Appetite: 60%
  Why: the todo remote is still the best live proof of the host-to-remote
  contract.
  Outcome: keep the microfrontend seam trustworthy while the host architecture
  evolves.
  Source: existing seeded todo.

- `P2` Fix signal mesh layout positioning after the recent move
  AI Appetite: 45%
  Why: the signal mesh sits too low after the layout shift and currently reads
  as a visual regression on the playground entry surface.
  Outcome: the canvas sits at the intended height in the playground page again.
  Source: [BRAINDUMP.md](/Users/macbook/personal/playground/BRAINDUMP.md).

## In Progress

## Done
