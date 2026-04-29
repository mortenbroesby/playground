---
id: "mem-20260427-ai-context-engine-symbol-reference-expansion"
type: "session"
repo_slug: "playground"
title: "AI Context Engine Symbol Reference Expansion"
status: "done"
created: "2026-04-27"
updated: "2026-04-27"
owner: "agent"
summary: "Later-phase retrieval follow-up for Astrograph graph-aware expansion."
tags: []
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-11"
  expires_after: "2026-10-24"
  keep: false
project: "playground"
---

Later-phase retrieval follow-up for Astrograph graph-aware expansion.

Goal:

- add a stronger importer follow-up path that follows exact symbol references, not just file-level importer edges

Landed:

- added `includeReferences` to `query_code`
- expanded graph-aware discover and bundle assembly through importer files whose persisted import specifiers explicitly reference the matched symbol
- kept broad `includeImporters` behavior intact as the file-level fallback path
- reused the existing persisted import specifier data rather than introducing a new graph store
- added behavior coverage proving symbol-reference expansion does not spill into unrelated importer files

Why:

- the remaining Phase 5 gap called out stronger importer follow-up flows
- file-level importers were already available, but exact symbol references give better precision for graph expansion
