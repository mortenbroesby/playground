---
id: mem-<% tp.date.now("YYYYMMDD") %>-<% tp.file.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") %>
type: architecture-record
repo_slug: <% tp.user.repo_context.currentRepo(tp) %>
title: <% tp.file.title %>
status: proposed
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
  review_after: <% tp.date.now("YYYY-MM-DD", 180) %>
  expires_after: null
  keep: true
tags:
  - type/decision
  - repo/<% tp.user.repo_context.currentRepo(tp) %>
---

## Context

## Decision

## Consequences

## Related Files
