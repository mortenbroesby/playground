---
id: mem-<% tp.date.now("YYYYMMDD") %>-<% tp.file.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") %>
type: spec
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
  keep: true
tags:
  - type/spec
  - repo/<% tp.user.repo_context.currentRepo(tp) %>
---

## Goal

## Non-Goals

## Current State

## Proposed Design

## Implementation Plan

## Acceptance Criteria

## Verification

## Open Questions
