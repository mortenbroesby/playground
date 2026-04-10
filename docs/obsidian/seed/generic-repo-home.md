---
type: repo
repo_slug: __REPO_SLUG__
repo_path: __REPO_PATH__
status: active
summary:
keywords: []
stack: []
owner: __OWNER__
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

# __REPO_SLUG__

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
FROM "02 Repositories/__REPO_SLUG__/03 Sessions"
WHERE type = "repo-session"
SORT started_at DESC
LIMIT 10
```

## Open Questions

```dataview
TABLE opened_on, owner
FROM "02 Repositories/__REPO_SLUG__/04 Questions"
WHERE type = "repo-question" AND status != "closed"
SORT opened_on DESC
```

## Key Decisions

```dataview
TABLE decision_id, status, decided_on
FROM "02 Repositories/__REPO_SLUG__/02 Decisions"
WHERE type = "repo-decision"
SORT decided_on DESC
```

## Next Actions

- add a one-paragraph repo summary
- replace placeholder architecture bullets with repo-specific notes
- capture your first session under `03 Sessions/`

## Related Repo Files

- important directories
- key packages or apps
- docs worth opening first
