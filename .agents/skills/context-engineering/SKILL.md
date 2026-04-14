---
name: context-engineering
description: Curate the right repo context at the right time. Use when starting work, switching tasks, or when agent output starts drifting.
---

# Context Engineering

## Overview

Context quality is a major output lever. Load durable rules first, then only the
task-specific context needed for the next step.

## When to Use

- Starting a new task or session
- Switching between workspaces or concerns
- Agent output stops matching repo conventions

## Process

1. Start with persistent repo context: `AGENTS.md`, `.agents/rules/`, and any
   closer `AGENTS.md`.
2. For code tasks, use `jcodemunch` first: `plan_turn`, `search_symbols`,
   `get_file_outline`, `get_symbol_source`, and `get_context_bundle`.
3. For repo history, architecture, or decisions, query `obsidian-memory` before
   assuming.
4. Load only the exact files, symbols, tests, and error output relevant to the
   current slice.
5. Refresh or compact context when the task changes materially.

## Rationalizations

| Rationalization | Reality |
| --- | --- |
| "More context is always better" | Irrelevant context dilutes attention and increases mistakes. |
| "I know this repo well enough already" | Drift happens fast in active repos. |
| "Shell search is good enough" | Structured retrieval is usually faster and more precise here. |

## Red Flags

- Output ignores repo-specific commands or conventions
- The agent invents APIs or file paths
- Broad file dumps appear before a specific task is identified
- Architecture questions are answered without repo memory or durable docs

## Verification

- [ ] Persistent rules were loaded first
- [ ] Task-specific context stayed narrow
- [ ] `jcodemunch` or `obsidian-memory` were used when appropriate
- [ ] Loaded examples and APIs actually exist in the repo
