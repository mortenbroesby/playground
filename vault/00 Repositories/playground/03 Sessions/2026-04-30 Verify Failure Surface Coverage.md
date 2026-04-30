---
id: "mem-20260430-verify-failure-surface-coverage"
type: "session"
repo_slug: "playground"
title: "Verify Failure Surface Coverage"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Added direct `rag:verify` failure-surface coverage for broken typed indexes, including fast-mode failure JSON, unresolved-link reporting, synthetic-id counts, and nonzero CLI exit behavior."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "verify"
  - "cli"
  - "failures"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-rag-verify-mode-split"
    - "mem-20260430-doctor-cli-coverage"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-14"
  expires_after: "2026-10-27"
  keep: false
branch: "feat/agent-facing-rag-rebuild-foundation"
touched_paths:
  - "tools/obsidian-memory/tests/verify-obsidian-rag.test.mjs"
---

## Goal

Cover the broken-index `rag:verify` contract directly so the verify CLI is
tested for failure output as well as success output.

## Actions taken

- added a broken typed-memory fixture with unresolved links and synthetic-id
  style validation issues
- added direct `runVerification` assertions for failed fast-mode verification
- added CLI assertions for fast-mode failure JSON and exit code `1`
- kept the existing happy-path and full-mode retrieval-fixture coverage intact

## Tests run

- `node --test ./tools/obsidian-memory/tests/verify-obsidian-rag.test.mjs`
- `pnpm --filter @playground/obsidian-memory test:retrieval`
- `pnpm knowledge:check`

## Findings

- verify’s failure contract already matched the intended governance behavior;
  the missing piece was explicit broken-index coverage at the outer surface
- registry-driven validation issues are sufficient to drive the failure path
  without relying on diagnostics fallbacks in the fixture

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next thin slice should likely move back to implementation rather than more
surface tests, for example tightening shared governance output helpers or
starting the next ADR-backed behavior change in the write/migration path.
