---
id: "mem-20260417-keep-vault-as-canonical-repo-memory"
type: "architecture-record"
repo_slug: "playground"
title: "Keep Vault As Canonical Repo Memory"
status: "accepted"
created: "2026-04-17"
updated: "2026-04-29"
owner: "morten"
summary: "Keep `vault/` plus `obsidian-memory` as the canonical durable repo memory path; treat MemOS only as an optional assistive layer."
tags:
  - "type/decision"
  - "repo/playground"
keywords:
  - "memory"
  - "vault"
  - "obsidian-memory"
  - "memos"
links:
  parents: []
  children: []
  related:
    - "mem-20260417-memos-evaluation-ideas"
    - "mem-20260429-repo-memory-architecture"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-10-26"
  expires_after: null
  keep: true
decided_on: "2026-04-17"
decision_id: "DEC-2026-04-17-vault-canonical-memory"
related_paths:
  - "vault/00 Repositories/playground"
  - "tools/obsidian-memory"
---

Durable repo memory stays in `vault/` and is indexed through
`obsidian-memory`.

MemOS, if it is used at all, is limited to optional assistive preference or
continuity recall. It is not a source of truth for architecture, task state,
release state, or reviewable repo history.

This keeps canonical memory reviewable in git, queryable through the local
memory toolchain, and separate from speculative preference-memory experiments.
