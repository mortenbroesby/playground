---
id: mem-__TODAY_COMPACT__-__REPO_SLUG__-home
type: repo-home
repo_slug: __REPO_SLUG__
title: __REPO_SLUG__
repo_path: __REPO_PATH__
status: active
created: __TODAY__
updated: __TODAY__
summary:
keywords: []
stack: []
owner: __OWNER__
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: __REVIEW_AFTER_180_DAYS__
  expires_after: null
  keep: true
source_of_truth:
  - README.md
  - AGENTS.md
active_focus:
last_reviewed: __TODAY__
tags:
  - type/repo
  - state/active
  - repo/__REPO_SLUG__
---

## What This Repo Is

Short summary of what this repository exists to do.

## Source Of Truth

- `README.md`
- `AGENTS.md`

Add or remove entries so this list matches the real operating docs for this repository.
If you know the actual repo path, update `repo_path` and add direct file links here.

## Current Architecture

- primary app or package layout
- ownership boundaries
- key seams or contracts

## Active Focus

- current product or architecture direction
- risky area worth resuming carefully
- what to check first after time away

## Recent Sessions

```dataview
TABLE started_at, goal, outcome, next_step
FROM "00 Repositories/__REPO_SLUG__/03 Sessions"
WHERE type = "session"
SORT started_at DESC
LIMIT 10
```

## Key Decisions

```dataview
TABLE title, status, updated
FROM "00 Repositories/__REPO_SLUG__/02 Decisions"
WHERE type = "architecture-record"
SORT updated DESC
```

## Next Actions

- add a one-paragraph repo summary
- replace placeholder architecture bullets with repo-specific notes
- capture a session under `03 Sessions/` only when it leaves useful future context
- keep inbox-style capture in the repo's scratch file, not in the vault

## Related Repo Files

- important directories
- key packages or apps
- docs worth opening first
