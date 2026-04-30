---
id: "mem-20260430-doctor-registry-integrity-adoption"
type: "session"
repo_slug: "playground"
title: "Doctor Registry Integrity Adoption"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Updated rag:doctor governance helpers to consume note-level validation issues stored on registry rows, with diagnostics retained as fallback for older generated artifacts."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "rag:doctor"
  - "governance"
  - "validation"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-note-registry-builder-extraction"
    - "mem-20260430-rag-registry-validation-status"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-14"
  expires_after: "2026-10-27"
  keep: false
branch: "feat/agent-facing-rag-rebuild-foundation"
touched_paths:
  - "tools/obsidian-memory/src/rag-governance.mjs"
  - "tools/obsidian-memory/tests/rag-governance.test.mjs"
---

## Goal

Make governance checks consume the shared note-level integrity surface emitted by
the typed registry instead of depending only on global diagnostics.

## Actions taken

- taught `buildCleanupReport()` to derive invalid frontmatter backlog from
  registry `validation_issues`
- taught `verifyTypedMemory()` to count synthetic IDs and unresolved-link notes
  from registry rows first, with diagnostics as compatibility fallback
- added focused tests for registry-driven cleanup and verification behavior when
  diagnostics are sparse

## Tests run

- `node --test ./tools/obsidian-memory/tests/rag-governance.test.mjs`
- `pnpm --filter @playground/obsidian-memory test:retrieval`

## Findings

- this moves `rag:doctor` onto the shared integrity output without forcing a
  live rebuild or direct builder invocation inside governance
- keeping diagnostics fallback preserves compatibility with older generated
  artifact sets while the branch evolves

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next thin slice should either remove more duplicated integrity derivation
from governance in favor of registry-row fields or add deterministic chunk ID
formatting that matches the ADR’s recommended `chunk:${note_id}:...` scheme.
