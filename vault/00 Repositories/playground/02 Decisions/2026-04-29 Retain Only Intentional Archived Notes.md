---
id: "mem-20260429-retain-only-intentional-archived-notes"
type: "architecture-record"
repo_slug: "playground"
title: "Retain Only Intentional Archived Notes"
status: "accepted"
created: "2026-04-29"
updated: "2026-04-29"
owner: "morten"
summary: "Archived notes should exist only when they preserve compact historical context that still helps the repo; otherwise obsolete notes should be trimmed or deleted."
tags:
  - "type/decision"
  - "repo/playground"
keywords:
  - "retention"
  - "archive"
  - "vault"
  - "cleanup"
links:
  parents: []
  children: []
  related:
    - "mem-20260429-archived-specs"
    - "mem-20260429-superpowers-archive"
    - "clean-up-vault-notes-that-are-no-longer-relevant"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-10-26"
  expires_after: null
  keep: true
decided_on: "2026-04-29"
decision_id: "DEC-2026-04-29-intentional-archived-notes"
related_paths:
  - "vault/00 Repositories/playground"
---

Archived notes are not a default resting place for stale memory.

Keep a note in `archived` status only when at least one of these is true:

- it preserves compact historical context that would otherwise be hard to
  reconstruct
- it records a shipped spec or plan whose outcome still helps orient later work
- it is explicitly superseded by a current decision or architecture note and is
  still useful as a short historical breadcrumb

Trim or delete a note instead of archiving it when:

- it is mostly transient execution log with no durable learning
- its content is fully superseded by a current decision, architecture note, or
  task
- keeping it would add retrieval noise without adding meaningful context

The preferred order is:

1. promote durable policy or structure into a decision or architecture note
2. keep only a compact archived breadcrumb when the history still matters
3. delete or remove the rest
