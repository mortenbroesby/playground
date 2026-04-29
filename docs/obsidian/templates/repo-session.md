---
id: mem-<% tp.date.now("YYYYMMDD") %>-<% tp.file.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") %>
type: session
repo_slug: <% tp.user.repo_context.currentRepo(tp) %>
title: <% tp.file.title %>
status: active
created: <% tp.date.now("YYYY-MM-DD") %>
updated: <% tp.date.now("YYYY-MM-DD") %>
owner: agent
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: <% tp.date.now("YYYY-MM-DD", 14) %>
  expires_after: <% tp.date.now("YYYY-MM-DD", 180) %>
  keep: false
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
tags:
  - type/session
  - repo/<% tp.user.repo_context.currentRepo(tp) %>
---

## Goal

## What Changed

## Decisions

## Blockers

## Next Step
