# AI Context Engine Review Fixes

## Summary

Address the first code-review pass on `feat/ai-context-engine-phase1` by fixing
repo-boundary enforcement, public wrapper gaps, benchmark result integrity, and
missing regression coverage across the engine and benchmark harness packages.

## Implemented

- enforced repo-root confinement for engine file-path inputs and added
  realpath-based symlink escape checks
- made indexing respect `.gitignore` when `respectGitIgnore` is enabled
- fixed fresh-repo `init`/`diagnostics` behavior so storage is created before
  opening SQLite
- exposed `searchSymbols` `kind` and `limit` through the CLI and MCP wrappers
- fixed aliased import parsing for dependency selection in context bundles
- prevented exported symbols from receiving a positive search score when the
  query does not match
- enforced hard token-budget caps in `getContextBundle`
- tightened benchmark corpus task-path containment
- removed misleading `tracePath` output until trace files actually exist
- corrected benchmark success evaluation and corpus/run provenance reporting
- added regression tests for traversal rejection, `.gitignore`, alias imports,
  wrapper filters, and corpus path escapes

## Verification

- `pnpm --filter @playground/ai-context-engine type-check`
- `pnpm --filter @playground/ai-context-engine test`
- `pnpm --filter @playground/ai-context-engine-bench type-check`
- `pnpm --filter @playground/ai-context-engine-bench test`

## Follow-up

- do one more review pass on top of these fixes before merging
- if that pass is clean, the remaining work should stay in the next planned
  phase rather than extend this branch again
