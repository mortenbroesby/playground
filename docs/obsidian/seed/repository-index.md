---
type: dashboard
dashboard: repository-index
generated_on: __GENERATED_ON__
tags:
  - dashboard
---

# Repository Index

## Repositories

```dataview
TABLE status, active_focus, last_reviewed
FROM "02 Repositories"
WHERE type = "repo"
SORT repo_slug ASC
```

## Recent Sessions

```dataview
TABLE repo, started_at, goal, next_step
FROM "02 Repositories"
WHERE type = "repo-session"
SORT started_at DESC
LIMIT 12
```

## Open Questions

```dataview
TABLE repo, opened_on, owner
FROM "02 Repositories"
WHERE type = "repo-question" AND status != "closed"
SORT opened_on DESC
```

## Starter Repo

- [[02 Repositories/__REPO_SLUG__/00 Repo Home|__REPO_SLUG__]]
