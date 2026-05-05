---
id: "rebuild-astrograph-style-code-intelligence-layer"
type: "todo"
repo_slug: "playground"
title: "Rebuild Astrograph-style code intelligence layer"
status: "active"
created: "2026-04-29"
updated: "2026-05-05"
owner: "morten"
summary: "Existing solutions are either paid, immature, or fragmented; rebuilding a minimal, open, AST-based retrieval system provides control, extensibility, and long-term leverage."
tags: []
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-29"
  expires_after: null
  keep: false
ai_appetite: 80
priority: "P1"
source: "synthesized from Astrograph, LSP systems, and Tree-sitter-based OSS patterns."
---

## Why

Existing solutions are either paid, immature, or fragmented; rebuilding a
minimal, open, AST-based retrieval system provides control, extensibility, and
long-term leverage.

## Outcome

A working system that parses a repo, indexes symbols, and exposes a retrieval
API usable by AI agents such as via MCP, achieving token-efficient, precise
code access comparable to Astrograph.

## Details

Spec-driven regeneration or spec-first reconstruction.

### Scope

- Parse codebase using Tree-sitter with multi-language support where possible
- Extract symbols such as functions, classes, exports, and imports
- Store in lightweight index such as SQLite
- Implement retrieval interface:
  - `findSymbol(name)`
  - `getDefinition(symbol)`
  - `search(query)`
- Return minimal, structured snippets optimized for LLM consumption
- Support incremental updates through file watching or re-indexing strategy
- Optional: integrate LSP for improved accuracy and edge cases
- Optional: add semantic search as a secondary layer
- Optional: expose via an MCP-compatible interface

### Constraints

- Must be fully local and open source
- Prioritize correctness and token efficiency over feature breadth
- Keep initial version simple and avoid over-engineering

### Non-goals

- Full IDE replacement
- Complex UI
- Enterprise-scale indexing

Note: Maybe leverage ideas from <https://github.com/safishamsi/graphify>.
Worth a Ralph loop.
