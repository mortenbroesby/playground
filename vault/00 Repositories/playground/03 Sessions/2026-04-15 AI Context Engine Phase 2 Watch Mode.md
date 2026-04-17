# AI Context Engine Phase 2 Watch Mode

## Summary

Start the next engine phase on `feat/ai-context-engine-phase2-watch` by adding
debounced live refresh support, then reconcile the engine and benchmark specs so
they describe the implemented watch-mode slice and the current benchmark
artifact surface accurately.

## Implemented

- added a public `watchFolder` API that emits `ready`, `reindex`, `error`, and
  `close` events
- added a `watch` CLI command with debounce and timeout controls
- implemented polling-backed changed-path detection with debounced changed-file
  refreshes for local development
- added watch-mode regression coverage for both library and CLI entry points
- updated the engine spec to document debounced watch support, current security
  guarantees, and the remaining worktree-aware watching gap
- updated the benchmark specs to remove stale trace artifact claims and list the
  full checked-in test surface
- tightened engine CLI and MCP boundary validation so malformed numeric and kind
  arguments fail fast instead of degrading into silent empty-result behavior

## Verification

- `pnpm --filter @playground/ai-context-engine type-check`
- `pnpm --filter @playground/ai-context-engine test`
- `pnpm --filter @playground/ai-context-engine-bench type-check`
- `pnpm --filter @playground/ai-context-engine-bench test`

## Follow-up

- decide whether watch mode should eventually surface health/status through MCP
- worktree-aware watch detection beyond the current polling snapshot loop
