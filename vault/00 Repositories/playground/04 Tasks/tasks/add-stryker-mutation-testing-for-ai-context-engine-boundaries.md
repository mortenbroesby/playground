---
id: "add-stryker-mutation-testing-for-ai-context-engine-boundaries"
type: "todo"
repo_slug: "playground"
title: "Add Stryker mutation testing for `ai-context-engine` boundaries"
status: "done"
created: "2026-04-29"
updated: "2026-05-01"
owner: "morten"
summary: "`@playground/ai-context-engine` now has a few important boundary contracts that are easy to look covered while still being weak:"
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
ai_appetite: 85
priority: "P1"
source: "Follow-up from `tools/ai-context-engine` runtime-boundary review and StrykerJS docs."
---

## Why

Historical note: this task was completed while Astrograph lived inside
`playground`. The current source of truth is now the standalone `../astrograph`
checkout published as `@mortenbroesby/astrograph`; the old playground package
and `tools/ai-context-engine` paths below are retained only as historical
context.

Astrograph had a few important boundary contracts that were easy to look
covered while still being weak:

- CLI argument parsing and validation
- MCP request validation and transport handling
- search/filter boundary behavior
- watch-mode freshness and file-change behavior

Mutation testing is a good fit here because it answers whether the current
tests actually kill bad boundary changes instead of only exercising the happy
path.

StrykerJS docs describe this exact use case: mutate production code and confirm
the tests fail when behavior is altered.

## Outcome

A first StrykerJS setup exists for `tools/ai-context-engine`, runs against a
small high-signal boundary slice, and produces a concrete list of surviving
mutants that can drive immediate test hardening.

## Details

## Constraints

- start with `tools/ai-context-engine` only
- do not broaden to the whole monorepo in the first pass
- keep the first mutate scope narrow and high-value
- prefer `vitest` integration if supported cleanly by StrykerJS in this setup
- optimize for actionable survivors, not maximum initial coverage
- do not let the initial config mutate generated files, docs, or test fixtures

## Acceptance Criteria

- StrykerJS is installed and configured for `tools/ai-context-engine`
- the initial mutate scope is limited to boundary-heavy source files:
  - `src/cli.ts`
  - `src/mcp.ts`
  - `src/config.ts`
  - relevant watch/runtime boundary slices in `src/storage.ts`
- the initial run completes successfully in this repo
- the resulting report identifies surviving mutants in current boundary logic
- at least the most obvious survivors are converted into concrete follow-up test
  tasks or fixes
- the chosen config and first-run findings are written back into the vault

## Suggested First Slice

Focus on mutations that should be killed by boundary tests:

- missing-value CLI flags
- invalid numeric parsing
- unsupported `kind` / summary strategy values
- MCP argument validation
- watch-mode file deletion and refresh behavior

## Source Notes

- Stryker introduction: [docs](https://stryker-mutator.io/docs/)
- StrykerJS getting started:
  [docs](https://stryker-mutator.io/docs/stryker-js/getting-started/)
- StrykerJS configuration:
  [docs](https://stryker-mutator.io/docs/stryker-js/configuration/)
