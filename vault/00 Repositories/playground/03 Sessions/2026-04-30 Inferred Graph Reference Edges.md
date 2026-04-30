---
id: "mem-20260430-inferred-graph-reference-edges"
type: "session"
repo_slug: "playground"
title: "Inferred Graph Reference Edges"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Extended typed memory graph building to parse resolvable Markdown links and Obsidian wikilinks as inferred `references` edges while keeping frontmatter links canonical."
tags:
  - "type/session"
  - "repo/playground"
keywords:
  - "rag"
  - "obsidian-memory"
  - "graph-index"
  - "wikilinks"
  - "markdown-links"
links:
  parents: []
  children: []
  related:
    - "mem-20260430-vector-retrieval-and-query-planning"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-14"
  expires_after: "2026-10-27"
  keep: false
branch: "feat/agent-facing-rag-rebuild-foundation"
touched_paths:
  - "tools/obsidian-memory/src/note-registry.mjs"
  - "tools/obsidian-memory/tests/note-registry.test.mjs"
  - "tools/obsidian-memory/tests/rag-index.test.mjs"
---

## Goal

Close the remaining graph-discovery gap by teaching the typed memory graph to
use resolvable Markdown links and Obsidian wikilinks as inferred relationships
without weakening the canonical frontmatter-link rules.

## Actions taken

- added Markdown link parsing for body-level links that resolve to known notes
- added Obsidian wikilink parsing for title and path-like note references
- resolved inferred links against the registry by ID, normalized path, basename,
  and unique title where safe
- emitted inferred graph-only `references` edges while leaving
  `outbound_links`, `inbound_links`, and unresolved-link failures tied to
  canonical frontmatter `links.*`
- added focused registry and index tests to prove inferred edge creation and
  deduplication

## Tests run

- `node --test ./tools/obsidian-memory/tests/note-registry.test.mjs`
- `node --test ./tools/obsidian-memory/tests/rag-index.test.mjs`
- `node --test ./tools/obsidian-memory/tests/obsidian-rag.test.mjs`

## Findings

- the safest place to add inferred relationships is graph assembly, not the
  canonical registry link fields
- title-based wikilink resolution needs uniqueness checks; otherwise it is too
  easy to create ambiguous inferred edges in a larger vault

## Decisions that need ADRs

- none in this slice

## Todos created

- none in this slice

## Next handoff

The next retrieval slice should implement an explicit lexical/vector/graph
fusion stage now that vector retrieval and inferred graph references both exist
in the typed pipeline.
