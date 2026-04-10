---
type: repo-session
repo: <% tp.user.repo_context.currentRepo(tp) %>
date: <% tp.date.now("YYYY-MM-DD") %>
started_at: <% tp.date.now("YYYY-MM-DD HH:mm") %>
summary:
keywords: []
branch:
goal:
outcome:
touched_paths: []
decisions: []
blockers: []
next_step:
repo_home: "<% tp.user.repo_context.repoHomeLink(tp) %>"
tags:
  - type/session
  - state/active
  - repo/<% tp.user.repo_context.currentRepo(tp) %>
---

# Session - <% tp.date.now("YYYY-MM-DD HH:mm") %>

## Goal

## What Changed

## Decisions

## Blockers

## Next Step
