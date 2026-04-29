---
id: mem-<% tp.date.now("YYYYMMDD") %>-<% tp.user.repo_context.currentRepo(tp) %>-home
type: repo-home
repo_slug: <% tp.user.repo_context.currentRepo(tp) %>
title: <% tp.user.repo_context.currentRepo(tp) %>
repo_path:
status: active
created: <% tp.date.now("YYYY-MM-DD") %>
updated: <% tp.date.now("YYYY-MM-DD") %>
summary:
keywords: []
stack: []
owner:
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: <% tp.date.now("YYYY-MM-DD", 180) %>
  expires_after: null
  keep: true
source_of_truth: []
active_focus:
last_reviewed: <% tp.date.now("YYYY-MM-DD") %>
tags:
  - type/repo
  - state/active
  - repo/<% tp.user.repo_context.currentRepo(tp) %>
---

## What This Repo Is

Short summary of what the repo exists to do.

Use one tight paragraph here. This is the highest-signal retrieval chunk for local RAG or search.

## Source Of Truth

- `AGENTS.md`
- `README.md`
- `KANBAN.md`
- `BRAINDUMP.md`

Trim or replace this list so it matches the actual repo.

## Current Architecture

- primary app or package layout
- main ownership boundaries
- important contracts and seams

## Active Focus

- current product or architecture direction
- currently risky area
- what should be looked at first after time away

## Key Decisions

- links to architecture-record notes under `02 Decisions/`

## Next Actions

- immediate next actions worth resuming
- keep inbox-style capture in the repo's scratch file, not in the vault

## Related Repo Files

- relative paths or external file links
