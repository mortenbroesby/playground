---
id: "evaluate-tsup-for-ai-context-engine-packaging"
type: "todo"
repo_slug: "playground"
title: "Evaluate tsup for ai-context-engine packaging"
status: "active"
created: "2026-04-29"
updated: "2026-04-29"
owner: "morten"
summary: "The AI context engine and benchmark harness currently run directly from TypeScript via Node strip-types mode. That is simple and works well for private workspace use, but it does not produce a distributable `dist/` contract if we later want to publish, bundle, or harden runtime startup behavior."
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
ai_appetite: 20
priority: "P2"
source: "follow-up from ai-context-engine phase 2 closeout"
---

## Why

The AI context engine and benchmark harness currently run directly from
TypeScript via Node strip-types mode. That is simple and works well for private
workspace use, but it does not produce a distributable `dist/` contract if we
later want to publish, bundle, or harden runtime startup behavior.

## Outcome

A clear decision on whether `@playground/ai-context-engine` and
`@playground/ai-context-engine` should stay on native TypeScript
execution or move to `tsup` or an equivalent packaging step.

## Details

### Scope

- Compare the current native TypeScript runtime against `tsup` for:
  - local developer ergonomics
  - CLI and MCP startup behavior
  - ESM packaging correctness
  - test and workspace compatibility
  - dist artifact expectations
- Only implement the migration if there is a concrete need for published or
  external-consumer artifacts

### Acceptance criteria

- Decision is documented with concrete tradeoffs
- If migration is justified, package scripts and export paths are updated
- If migration is not justified, the current native TypeScript approach remains
  the documented default

### Non-goals

- Bundling every workspace package in the monorepo
- Introducing generated output without an explicit distribution need
