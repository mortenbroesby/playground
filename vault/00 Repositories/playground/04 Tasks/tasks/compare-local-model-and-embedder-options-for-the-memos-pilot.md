---
id: "compare-local-model-and-embedder-options-for-the-memos-pilot"
type: "todo"
repo_slug: "playground"
title: "Compare local model and embedder options for the MemOS pilot"
status: "active"
created: "2026-04-29"
updated: "2026-04-29"
owner: "morten"
summary: "The MemOS pilot only makes sense if the local model and embedding path is practical enough to run without paid providers or excessive setup friction."
tags: []
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-29"
  expires_after: null
  keep: false
ai_appetite: 80
priority: "P2"
source: "[run-a-fully-local-memos-pilot-with-one-client.md](</Users/macbook/personal/playground/vault/00 Repositories/playground/04 Tasks/tasks/run-a-fully-local-memos-pilot-with-one-client.md>)."
---

## Why

The MemOS pilot only makes sense if the local model and embedding path is
practical enough to run without paid providers or excessive setup friction.

## Outcome

A short recommendation identifies the best local-only model and embedder path
for a first MemOS pilot in this environment, including tradeoffs and fallback
options.

## Details

## Constraints

- local-only inference path
- no paid APIs
- no cloud embeddings
- prefer options that are realistic on this machine
- optimize for setup simplicity and acceptable retrieval quality over theoretical
  maximum performance

## Acceptance Criteria

- at least two viable local model paths are compared
- at least two viable local embedding paths are compared
- hardware and runtime assumptions are stated clearly
- one recommended default stack is chosen for the pilot
- one fallback stack is named in case the preferred path is too heavy or brittle
- the recommendation is captured in the vault before pilot implementation starts
