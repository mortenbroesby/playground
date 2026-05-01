---
id: "mem-20260501-remove-astrograph-observability-server-from-core"
type: "architecture-record"
repo_slug: "playground"
title: "Remove Astrograph Observability Server From Core"
status: "accepted"
created: "2026-05-01"
updated: "2026-05-01"
owner: "morten"
summary: "Astrograph should not require Bun for package consumers; the Bun-backed observability server is removed from the core package and playground startup path."
tags:
  - "type/decision"
  - "repo/playground"
  - "astrograph"
keywords:
  - "astrograph"
  - "observability"
  - "bun"
  - "node"
  - "package extraction"
links:
  parents: []
  children: []
  related:
    - "vault/00 Repositories/playground/04 Tasks/Extract Astrograph To Standalone Repo.md"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-10-28"
  expires_after: null
  keep: true
decided_on: "2026-05-01"
decision_id: "DEC-2026-05-01-astrograph-no-bun-core"
related_paths:
  - ".agents/hooks/lib/ai-context-engine.mjs"
  - ".agents/hooks/session-start.mjs"
  - ".specs/astrograph-repo-extraction-spec.md"
  - "package.json"
---

Astrograph's public package runtime is Node 24, not Bun.

The historical Bun-backed observability server should not ship as part of the
core `@mortenbroesby/astrograph` package because that makes an optional local
debugging surface feel like an end-user runtime requirement.

The playground startup path should therefore not auto-start Astrograph
observability. Shared hooks may keep bootstrapping the Astrograph watch process,
but they should not call `astrograph observability` or read
`.astrograph/observability-server.json`.

Retained engine events under `.astrograph/events.jsonl` remain useful for local
diagnostics and privacy-safe debugging. A future observability UI can return as
a separate optional package or app, but it must not reintroduce Bun as a core
consumer requirement.
