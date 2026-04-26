---
type: session-note
repo: playground
date: 2026-04-25
summary: Hardened ai-context-engine MCP startup, migrated the server to the official MCP SDK, made the MCP tool manifest the single source of truth, and restored jcodemunch as the repo-local fallback navigation MCP.
tags:
  - type/session
  - repo/playground
  - ai-context-engine
  - jcodemunch
  - mcp
---

# MCP Startup Hardening And Jcodemunch Fallback

## What changed

- changed the `ai-context-engine` wrapper to prefer source files in the
  workspace and only fall back to built `dist/` artifacts for packaged installs
- changed the MCP server to lazy-load the engine module on tool execution
  instead of during `initialize` and `tools/list`
- migrated `ai-context-engine` from a hand-rolled MCP loop to the official
  TypeScript SDK stdio server and client test path
- extracted the MCP tool definitions into one manifest so server registration,
  tool dispatch, and interface tests all share the same contract
- aligned package scripts and docs around MCP as the primary interface, with
  CLI retained as a secondary debug and benchmark surface
- changed repo-local MCP and hook callers to invoke the installed
  `ai-context-engine` bin through `pnpm exec` instead of `node <script>` so
  workspace use matches the package contract
- refactored `storage.ts` so `query_code` shares one per-request engine context
  and SQLite handle across its internal retrieval steps instead of reopening
  storage for each sub-call, and memoized repo-root plus storage setup work per
  process
- added session-start hook bootstrap for a detached repo-local
  `ai-context-engine` watch process so fresh indexing starts automatically and
  continues updating after later edits or external file changes
- implemented process-lifetime SQLite connection reuse plus prepared-statement
  caching in `ai-context-engine`, with explicit cache reset for fixture teardown
  so the first performance-priority slice is now partially delivered in code
- removed skipped-file counting from normal index and watch responses to avoid
  the extra repo walk on hot indexing paths
- pushed initial symbol discovery candidate filtering for `query_code` and
  symbol search down into SQLite by prefiltering on language, kind, and query
  terms before JS-side scoring
- added FTS-backed shortlist tables for symbols and file content, wired index
  maintenance to keep them fresh on update and delete, and used them to reduce
  normal-case symbol and text-search candidate loading while preserving current
  ranking and preview behavior through fallback
- added a regression test that proves substring-only queries still remain
  discoverable even when FTS tokenization is too narrow to find them on its own
- moved direct `index-folder` and `index-file` requests onto a child-process
  execution path so explicit reindex work no longer has to monopolize the main
  MCP server process, while keeping the existing public contracts intact
- closed the remaining performance-priority question by documenting that
  RxJS-style orchestration and progress streaming stay out of scope until there
  is a concrete UX need that the current MCP plus watch model cannot satisfy
- revisited that decision specifically for `watchFolder()` and replaced the
  hand-rolled debounce, pending-path, and active-flush coordination with an
  RxJS pipeline that batches changed paths after a quiet period, dedupes them,
  and serializes reindex work explicitly
- tested a `chokidar` transport underneath that RxJS pipeline and rejected it
  for now after it produced `EMFILE` watch exhaustion in the repo’s mutation
  smoke coverage, keeping the existing native watch plus polling fallback as
  the event source
- swapped the storage backend adapter from `node:sqlite` to `better-sqlite3`
  while keeping the same internal `IndexBackendConnection` contract so the
  engine no longer depends on Node’s experimental SQLite runtime surface
- added opt-in structured diagnostics with `pino`, gated by
  `AI_CONTEXT_ENGINE_LOG_LEVEL`, and limited the first instrumentation slice to
  MCP tool dispatch, watch lifecycle, and child index worker execution so
  normal stdout-facing contracts remain unchanged by default
- added an interface test that asserts MCP startup stays free of backend stderr
  side effects before the first tool call
- restored a repo-local `jcodemunch` MCP server entry in `.codex/config.toml`
  as the fallback navigation path if `ai-context-engine` fails to load
- updated repo guidance and code-navigation guard messaging to point agents at
  `jcodemunch` before broad shell-based exploration when the primary engine is
  unavailable
- included the current root `package.json` `ctrl:daemon` adjustment in the same
  commit because the user requested committing all pending changes

## Why

The startup timeout warning was only the surface symptom. The immediate startup
path was doing extra work and could emit backend-related stderr before the MCP
server had even finished its handshake path. At the same time, the repo no
longer had a checked-in fallback MCP configuration after the earlier
ai-context-engine adoption work.

This slice makes MCP startup lighter and more predictable, moves protocol
handling onto the supported SDK path, reduces future drift in the exposed tool
surface, reintroduces a practical fallback path for code navigation when the
primary engine is unavailable, and now also makes the long-lived watch path
more explicit and maintainable without changing the repo’s proven watch-source
fallback behavior. The backend swap also removes an unnecessary dependency on
Node experimental APIs from the core index path. The logging slice makes it
easier to inspect long-lived local behavior without turning observability into
a mandatory runtime concern for every MCP or CLI call.

## Verification

- `pnpm --filter @playground/ai-context-engine test -- --run tests/interface.test.ts`
- `pnpm --filter @playground/ai-context-engine test -- --run tests/mutation-smoke.watch.test.ts tests/engine-behavior.test.ts tests/interface.test.ts`
- `pnpm --filter @playground/ai-context-engine type-lint`
- `pnpm --filter @playground/ai-context-engine type-check`
- observed that the focused test run no longer emits the `node:sqlite`
  experimental warning after the backend swap
- manual stdio MCP repro for `initialize` plus `tools/list` against
  `tools/ai-context-engine/scripts/ai-context-engine.mjs mcp`

## Durable follow-up conclusions (2026-04-26)

- Effect is not the right next move for `@playground/ai-context-engine` core
  code. The current retrieval and storage path is still better served by plain
  Promise-first TypeScript plus the existing narrow RxJS watch pipeline.
- A local developer observability surface is justified now because the package
  already emits the right signals across MCP dispatch, watch lifecycle, child
  index workers, and diagnostics, but those signals are split across stderr and
  sidecar state.
- The recommended next slice is an opt-in localhost websocket server backed by
  a repo-local append-only event log plus diagnostics-derived health snapshots.
- The no-go line is to keep that slice read-only, metadata-first, and local:
  no MCP transport rewrite, no storage rewrite, no full tracing platform, and
  no broad Effect migration as a prerequisite.

## Observability implementation outcome (2026-04-26)

- Implemented the first observability slice as `ai-context-engine
  observability --repo <root>`, launched through Bun so the transport uses
  Bun's uWebSockets-backed server runtime.
- Kept the server intentionally split-runtime: Bun owns HTTP plus websocket
  delivery, while live health snapshots delegate to the normal Node CLI
  `diagnostics` path instead of opening SQLite from Bun.
- Added a repo-local append-only `.ai-context-engine/events.jsonl` sink and
  wired current MCP tool dispatch, watch lifecycle, child index worker, and
  periodic health snapshots into that shared event log.
- Exposed three local-only endpoints:
  - `/health` for a current diagnostics snapshot
  - `/recent` for a recent in-memory tail of event envelopes
  - `/events` for a read-only websocket stream of appended events
- Added interface coverage that boots the real Bun observability command,
  verifies websocket snapshot and event delivery, and checks `/health` plus
  `/recent` against a fixture repo.

## Alpha-readiness follow-up (2026-04-26)

- Added a repo-root `ai-context-engine.config.json` contract so the installed
  package can inherit summary-strategy and observability defaults from the
  enclosing repository without changing the core `.ai-context-engine/` runtime
  artifact layout.
- Kept observability optional for publishable alpha use:
  - no config file is required for normal CLI, MCP, or library use
  - Bun is only needed when the observability command is actually invoked
  - explicit CLI flags still override repo-config defaults
- Added the first built-in viewer page at `/` on the Bun observability server
  so the existing `/health`, `/recent`, and `/events` surfaces are directly
  inspectable in a browser without introducing a separate frontend app.
- Captured the broader release-hardening direction in
  `.specs/ai-context-engine-alpha-release-spec.md`.

## React plus MessagePack observability follow-up (2026-04-26)

- Replaced the inline observability page with a Vite-built React client under
  `tools/ai-context-engine/observability/`.
- The Bun observability server now serves built viewer assets for package-style
  use and can auto-start a Vite dev server in workspace mode so the viewer gets
  React Fast Refresh without requiring a prebuild first.
- Added a MessagePack transport with JSON fallback:
  - `/health` and `/recent` now support `application/msgpack`
  - `/events` supports `?encoding=msgpack` for binary websocket frames
  - the React viewer uses the MessagePack path by default
- Kept the original split-runtime constraint intact: Bun still owns the
  observability transport layer, while Node still owns SQLite-backed
  diagnostics and health generation.

## Agent workflow follow-up (2026-04-26)

- Replaced the hard-coded direct-main push block with a repo-local boolean
  toggle in `.agents/settings.json`.
- `allowDirectMainPush: true` now allows normal `git push origin main` through
  the hook without requiring the one-shot env escape hatch, while flipping it
  back to `false` restores the block.
- Promoted `IDEAS.md` from an informal note to a real implementation queue for
  agent autopilot work.
- Expanded `.agents/commands/ideas-to-done.md` so it now treats `IDEAS.md` as a
  top-to-bottom Ralph-driven execution queue: pick the top item, spec if
  needed, implement, verify, update durable docs, delete the completed item,
  and continue until empty.
