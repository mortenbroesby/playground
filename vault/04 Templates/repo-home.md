---
type: repo
repo_slug: <% tp.user.repo_context.currentRepo(tp) %>
repo_path:
status: active
summary:
keywords: []
stack: []
owner:
source_of_truth: []
active_focus:
last_reviewed: <% tp.date.now("YYYY-MM-DD") %>
tags:
  - type/repo
  - state/active
  - repo/<% tp.user.repo_context.currentRepo(tp) %>
---

# Repo Home - <% tp.user.repo_context.currentRepo(tp) %>

## What This Repo Is

Short summary of what the repo exists to do.

Use one tight paragraph here. This is the highest-signal retrieval chunk for local RAG or search.

## Source Of Truth

- `AGENTS.md`
- `README.md`
- `KANBAN.md`
- `BRAINDUMP.md`
- `docs/ideas/`

Trim or replace this list so it matches the actual repo.

## Current Architecture

- primary app or package layout
- main ownership boundaries
- important contracts and seams

## Active Focus

- current product or architecture direction
- currently risky area
- what should be looked at first after time away

## Open Questions

- unresolved product or technical questions

## Key Decisions

- links to decision notes under `02 Decisions/`

## Next Actions

- immediate next actions worth resuming

## Related Repo Files

- relative paths or external file links
