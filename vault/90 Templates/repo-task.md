---
id: mem-<% tp.date.now("YYYYMMDD") %>-<% tp.file.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") %>
type: todo
repo_slug: <% tp.user.repo_context.currentRepo(tp) %>
title: <% tp.file.title %>
status: active
created: <% tp.date.now("YYYY-MM-DD") %>
updated: <% tp.date.now("YYYY-MM-DD") %>
owner: morten
summary:
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: <% tp.date.now("YYYY-MM-DD", 30) %>
  expires_after: null
  keep: false
priority:
ai_appetite:
source:
tags:
  - type/task
  - repo/<% tp.user.repo_context.currentRepo(tp) %>
---

## Why

## Outcome
