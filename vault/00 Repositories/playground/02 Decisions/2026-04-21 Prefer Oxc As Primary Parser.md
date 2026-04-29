---
id: "mem-20260421-prefer-oxc-as-primary-parser"
type: "architecture-record"
repo_slug: "playground"
title: "Prefer Oxc As Primary Parser"
status: "accepted"
created: "2026-04-21"
updated: "2026-04-29"
owner: "morten"
summary: "Use Oxc as the primary JS/TS parser in `ai-context-engine`; keep Tree-sitter only as a bounded fallback behind the parser facade."
tags:
  - "type/decision"
  - "repo/playground"
keywords:
  - "ai-context-engine"
  - "oxc"
  - "tree-sitter"
  - "parser"
links:
  parents: []
  children: []
  related:
    - "mem-20260421-ai-context-engine-oxc-parser-migration"
    - "mem-20260421-ai-context-engine-parser-bench-replacement-spec"
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-10-26"
  expires_after: null
  keep: true
decided_on: "2026-04-21"
decision_id: "DEC-2026-04-21-oxc-primary-parser"
related_paths:
  - "tools/ai-context-engine/src/parser.ts"
  - "tools/ai-context-engine/scripts/benchmark-small.mjs"
---

`ai-context-engine` should use Oxc as the primary JS/TS parsing backend.

Tree-sitter remains only as a bounded compatibility fallback behind the parser
facade during migration. It is not a co-equal runtime architecture and should
not leak into the main indexing contract.

This keeps the primary parser path explicit, measurable, and easier to evolve.
