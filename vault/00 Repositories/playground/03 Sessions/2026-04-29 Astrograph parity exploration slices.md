---
id: "mem-20260429-2026-04-29-astrograph-parity-exploration-slices"
type: "session"
repo_slug: "playground"
title: "2026-04-29 Astrograph parity exploration slices"
status: "active"
created: "2026-04-29"
updated: "2026-04-29"
owner: "agent"
summary: "Captured the April 29 Astrograph parity slices: exploration tools, readiness-stage reporting, fallback summaries, and the first explicit language-registry wiring."
tags: []
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-13"
  expires_after: "2026-10-26"
  keep: false
---

## Summary

- tightened the Astrograph code-index MCP parity spec into an execution-ready
  proposal
- landed the first exploration-surface slice in `tools/ai-context-engine`
- landed the next status and fallback-summary slice in
  `tools/ai-context-engine`
- started the shallow-first readiness and deepening lifecycle slice in
  `tools/ai-context-engine`

## Key changes

- added first-class exploration tools and adapters for:
  - `find_files`
  - `search_text`
  - `get_file_summary`
  - `get_project_status`
- kept `query_code` as the structured retrieval path instead of collapsing the
  new exploration surface into it
- made file summaries distinguish:
  - the tier actually used for the returned summary
  - the broader set of tiers the file class supports
- added deterministic fallback summary strategies for discovery-only files such
  as Markdown, JSON, YAML, SQL, shell, and plain-text paths
- added explicit readiness-stage reporting so status flows can distinguish:
  - not-ready
  - discovery-ready
  - deepening
  - deep-retrieval-ready
- made slow and mutation-smoke integration coverage opt-in so default package
  tests stay focused on normal verification:
  - `test:slow`
  - `test:mutation-smoke`
- started the explicit language-registry slice so support tiers, summary
  strategies, and tool availability stop depending on scattered hard-coded
  assumptions
- completed the core registry wiring so runtime support-tier decisions and CLI
  language validation read from the explicit registry rather than duplicated
  constants

## Verification

- `pnpm agents:check`
- `pnpm --filter @astrograph/astrograph type-check`
- `pnpm --filter @astrograph/astrograph test`
- `pnpm --filter @astrograph/astrograph test:package-bin`

## Known limitation

- the readiness slice is only partially complete in the current checkpoint; the
  code and tests are being pushed before the full `STORY-4` closeout because
  the user requested a clean branch checkpoint
- the language-registry slice is being pushed as a checkpoint before the full
  `STORY-5` closeout; the registry is centralized in code, but broader
  verification and any remaining docs polish still need completion
- package-smoke verification for the registry closeout is still blocked in the
  temp install step because `pnpm add <packed tgz>` needs registry access
