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
- Added a repo-local append-only `.astrograph/events.jsonl` sink and
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

- Added a repo-root `astrograph.config.json` contract so the installed
  package can inherit summary-strategy and observability defaults from the
  enclosing repository without changing the core `.astrograph/` runtime
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

## Shared theme adoption follow-up (2026-04-26)

- The old top queue item in `IDEAS.md` was stale: the repo already had a shared
  token and theme package in `packages/ui`, so the right first slice was
  adoption, not creating another token system.
- Astrograph observability is now the first consumer migration target:
  - `tools/ai-context-engine` now depends on `@playground/ui`
  - the React observability client imports the shared `theme.css`
  - the viewer now uses the repo's terminal design language instead of its
    previous standalone light theme
- Rewrote the remaining design-system queue into smaller follow-ups:
  - migrate `apps/host`
  - migrate `apps/admin`
  - then define the `@astrolux` branding and package-evolution plan

## Host public shell adoption outcome (2026-04-26)

- `apps/host` already had the shared theme import; the real remaining
  inconsistency was host-owned public chrome rather than page-body content.
- The highest-value adoption slice was `PublicLayout` plus the `public` branch
  in `MobileDrawer`, because those two files still carried a simpler bespoke
  nav, menu, and footer treatment while the playground shell already used the
  terminal design language.
- Migrating that slice to shared `@playground/ui` `Panel`, `Badge`, and
  `Button` primitives was enough to make the main-site shell feel aligned with
  the rest of the design system without crossing into remote app styling.

## Astrograph version policy and storage-root cleanup (2026-04-26)

- Renamed the repo-local runtime directory from `.ai-context-engine/` to
  `.astrograph/` and kept it gitignored as local cache/runtime state.
- Added a storage version marker at `.astrograph/storage-version.json` so the
  engine can backfill, reset, or eventually migrate repo-local storage
  deliberately instead of guessing from file presence.
- Renamed the repo-root config contract to `astrograph.config.json`.
- Made `tools/ai-context-engine/package.json` the canonical Astrograph version
  source and moved the package to npm-compatible alpha prerelease semver:
  `major.minor.patch-alpha.increment`.
- Added an Astrograph-specific pre-commit gate: commits staging
  `tools/ai-context-engine/` must advance the version, and every Astrograph
  commit must at least change the `increment` value.

## Default ship behavior update (2026-04-26)

- Updated the shared repo workflow so implementation work should normally end
  with a commit and push instead of stopping at a local dirty tree.
- The default branch rule is now explicit:
  - if a feature branch was explicitly agreed, commit and push that branch
  - otherwise commit on the current branch and push `main`

## Astrograph support posture and license note (2026-04-26)

- Added an explicit status/disclaimer section to `tools/ai-context-engine/README.md`:
  Astrograph is still a personal tool, support should not be expected yet, and
  it is not intended to become a paid product.
- Added a package-local MIT `LICENSE` file and declared `license: "MIT"` in
  `tools/ai-context-engine/package.json` so the package carries its own license
  artifact when published.
- Bumped Astrograph from `0.0.1-alpha.0` to `0.0.1-alpha.1` because the
  package-facing metadata and release posture changed.

## Astrograph repo-local observability shortcuts (2026-04-26)

- Added root package scripts for local Astrograph observability:
  - `pnpm astrograph:observability` starts the viewer server for this repo
  - `pnpm astrograph:open` starts the server, waits for the resolved fallback
    port, and opens the viewer in the browser automatically
- This keeps the repo-level entrypoint aligned with Astrograph's dynamic
  `34323-35322` port scan instead of hardcoding a stale browser URL.
- Refined `pnpm astrograph:open` so it now prefers an existing healthy
  repo-local server recorded in `.astrograph/observability-server.json` and
  only spawns a new server when that status file is missing or stale.
- Bumped Astrograph from `0.0.1-alpha.1` to `0.0.1-alpha.2` for this
  observability-process behavior change.

## Admin chrome shared-theme migration (2026-04-26)

- Migrated the outer `apps/admin` shell onto the shared `@playground/ui`
  terminal theme instead of leaving the top-level frame on its older
  admin-only visual treatment.
- Imported `@playground/ui/theme.css` in the admin entrypoint and aligned the
  Mantine theme fonts with the shared sans/mono token pair.
- Replaced the top-level header, quick-add, toolbar, and board wrapper `Paper`
  chrome with shared `Panel` surfaces while keeping Mantine for the editable
  board controls and task widgets.
- Removed the completed `apps/admin` chrome migration item from `IDEAS.md`.

## Shared Mantine field wrapper slice (2026-04-26)

- Started following the "Mantine for interaction, `@playground/ui` for look"
  split in code instead of keeping it as advice only.
- Added shared Mantine-backed field wrappers to `packages/ui`:
  `FieldInput`, `FieldSelect`, and `FieldTextarea`.
- Moved the admin board to those repo-owned wrappers for its common form
  controls, so input chrome now flows through the shared design system while
  Mantine still provides the interaction mechanics underneath.

## Shared scrollbar chrome pass (2026-04-26)

- Promoted the shared terminal scrollbar treatment from an opt-in utility to a
  global app-level default in `packages/ui/src/theme.css`.
- Added shared scrollbar tokens for track, thumb, and hover states, then wired
  them through both Firefox `scrollbar-color` and WebKit pseudo-elements.
- Mantine scroll areas now inherit the same scrollbar chrome automatically,
  which keeps admin, host, and Astrograph surfaces more coherent without an
  extra dependency layer.

## Astrograph observability scrollbar follow-up (2026-04-26)

- Tightened the Astrograph observability app specifically by moving its long
  event feeds and health inspector onto explicit inset scroll frames instead of
  relying on raw overflowing lists and `pre` blocks.
- Applied the shared terminal scrollbar chrome directly to those observability
  regions, which makes the viewer feel more intentional and less like default
  browser scrollbars pasted onto a custom shell.
- Bumped Astrograph from `0.0.1-alpha.2` to `0.0.1-alpha.3` for the package UI
  behavior change.

## Astrograph generated viewer artifact cleanup (2026-04-26)

- Stopped tracking `tools/ai-context-engine/observability-dist/` in git so the
  built observability viewer no longer churns committed generated files.
- Kept the package-level `files` allowlist intact for npm packaging, but moved
  the repo policy to source-only tracking plus local/generated build output.
- Bumped Astrograph from `0.0.1-alpha.3` to `0.0.1-alpha.4` to record the repo
  packaging and git-tracking policy change under the package version gate.

## Astrograph smart refresh and observability simplification (2026-04-26)

- Added a first smart-refresh slice around git checkpoints instead of trying to
  replace watch mode outright:
  - `post-commit`
  - `post-checkout`
  - `post-merge`
  - `pre-push`
- The refresh planner is intentionally conservative:
  - use `index-file` for small supported-source change sets
  - fall back to `index-folder` for deletes, renames, or structural files
- Captured the longer-term architecture in
  `.specs/astrograph-smart-refresh-spec.md`: keep watch mode for immediacy,
  then add Merkle hashes and dependency fan-out later instead of overbuilding a
  realtime database now.
- Simplified the observability viewer into a single readable ledger of MCP tool
  calls, with plain-English summaries and estimated token-saved metrics only
  when Astrograph has a defensible raw-vs-compact baseline.
- Bumped Astrograph from `0.0.1-alpha.4` to `0.0.1-alpha.5` for the combined
  observability and refresh behavior change.

## Astrograph observability daemon bootstrap (2026-04-26)

- The observability server no longer needs to keep a foreground terminal open
  just to be useful in this repo.
- `pnpm astrograph:open` now ensures a healthy background server exists, then
  opens the browser against that daemon instead of attaching the terminal to a
  long-lived child process.
- SessionStart now also bootstraps Astrograph observability automatically when
  `astrograph.config.json` sets `observability.enabled: true`, mirroring the
  existing watcher bootstrap pattern.

## Astrograph standalone npm install surface (2026-04-26)

- Renamed the package itself to `astrograph` so the standalone npm identity now
  matches the product name instead of the old monorepo-local package name.
- Kept `ai-context-engine` as a compatibility bin alias, but made
  `astrograph` the primary CLI and packaging surface.
- Added `astrograph install --ide codex`, which writes a managed Astrograph MCP
  block into `.codex/config.toml` for an arbitrary git repo.
- Removed the last workspace-only runtime dependency from the observability
  client by replacing the `@playground/ui` theme import with package-local
  terminal theme CSS.
- Extended the packed tarball smoke to prove both:
  - `pnpm exec astrograph cli index-folder --repo ...`
  - `pnpm exec astrograph install --ide codex --repo ...`
- Bumped Astrograph from `0.0.1-alpha.5` to `0.0.1-alpha.6` for the standalone
  packaging and installer slice.

## Astrograph built-runtime default (2026-04-27)

- Switched the main Astrograph runtime contract to prefer built JavaScript in
  `dist/` instead of defaulting to source-mode TypeScript execution whenever
  the workspace `src/` tree is present.
- The package scripts `cli` and `mcp` now run `dist/cli.js` and `dist/mcp.js`
  directly, while source-mode remains available only as an explicit dev path.
- The runtime wrapper now requires an opt-in
  `ASTROGRAPH_USE_SOURCE=1` to prefer source files over built artifacts.
- The child index worker path in `storage.ts` now also prefers built CLI output
  when `dist/cli.js` exists, which removes another hidden dependency on Node's
  `--experimental-strip-types` for normal users.
- Bumped Astrograph from `0.0.1-alpha.6` to `0.0.1-alpha.7` for the runtime
  contract change.

## Astrograph scoped package identity (2026-04-27)

- Kept the product and CLI command as `@astrograph` and `astrograph`, but moved
  the publishable npm package identity from the unscoped `astrograph` to the
  scoped `@astrograph/astrograph`.
- Updated the standalone installer to write
  `args = ["@astrograph/astrograph", "mcp"]` into the managed Codex MCP block
  so external repos resolve the intended scoped package.
- Switched repo-local workspace references and hook verification commands to
  target the scoped package name while preserving the existing `astrograph` bin.
- Bumped Astrograph from `0.0.1-alpha.7` to `0.0.1-alpha.8` for the package
  identity change.

## Astrograph benchmark harness Phase 1 contract (2026-04-27)

- Expanded the checked-in corpus benchmark from a single smoke task to six
  golden queries covering corpus loading, runner artifacts, token accounting,
  the CLI entrypoint, bundle retrieval, and strict snapshot enforcement.
- Kept the existing `tools/ai-context-engine/bench` scaffold, but changed the
  Phase 1 result contract to report more than pass/fail:
  - recall-like target hit rates
  - first relevant rank, reciprocal rank, and precision at 3
  - exact and estimated token totals
  - tool-call counts and latency
- Documented `pnpm --filter @astrograph/astrograph bench:corpus` as the
  default one-command local benchmark entrypoint.
- Standardized the corpus-run artifacts under
  `.benchmarks/ai-context-engine/latest/`:
  - `results.json`
  - `report.md`
  - `corpus.lock.json`
- Bumped Astrograph from `0.0.1-alpha.8` to `0.0.1-alpha.9` for the benchmark
  contract and docs update.

## Astrograph hook invocation and observability bootstrap fix (2026-04-27)

- Fixed the shared hook helper to resolve Astrograph through the repo-local
  workspace wrapper at
  `tools/ai-context-engine/scripts/ai-context-engine.mjs` before falling back
  to `node_modules/.bin/astrograph` or `pnpm exec astrograph`.
- This removes the false `Command "astrograph" not found` failures from the
  repo refresh hooks in workspace development, where the root-level bin shim is
  not guaranteed to exist.
- Tightened observability bootstrap reporting so it surfaces the actual startup
  failure reason from `.astrograph/observability.log` instead of timing out with
  a generic unhealthy-startup message.
- Session bootstrap now treats known local-environment limitations like
  `Failed to listen at 127.0.0.1` as `unavailable` rather than as a misleading
  hard error, while explicit force-start paths still fail loudly.

## Astrograph Codex install block repair (2026-04-27)

- Repaired the repo-local Codex MCP block so Astrograph no longer relies on the
  broken workspace-root command `pnpm exec astrograph mcp`.
- Local workspace repos now install Astrograph into Codex through the
  deterministic wrapper command:
  `node tools/ai-context-engine/scripts/ai-context-engine.mjs mcp`
- Standalone external repos still receive the npm-oriented install block using
  `npx @astrograph/astrograph mcp`.
- The installer now replaces legacy unmarked `[mcp_servers.astrograph]` blocks
  instead of appending duplicate Astrograph sections when re-run.
- Bumped Astrograph from `0.0.1-alpha.9` to `0.0.1-alpha.10` for the Codex
  installer and config repair.

## Astrograph doctor command Phase 2 (2026-04-27)

- Added `astrograph cli doctor --repo ...` with a text report for engineers and
  `astrograph cli doctor --repo ... --json` for machine-readable output.
- Kept `doctor` thin by building it on top of `diagnostics` plus direct SQLite
  counts for indexed import totals and parser-health metadata.
- Extended file indexing metadata to persist:
  - `parser_backend`
  - `parser_fallback_used`
  - `parser_fallback_reason`
- `doctor` now reports:
  - repo root, storage path, storage backend/mode, schema version
  - index status and freshness counts
  - indexed file, symbol, and import totals
  - parser fallback rate and unknown parser-health coverage
  - observability status and watch status
  - warnings plus suggested next actions
- Bumped Astrograph from `0.0.1-alpha.10` to `0.0.1-alpha.11` for the Phase 2
  doctor contract and parser-health metadata slice.

## Astrograph parser coverage Phase 3 (2026-04-27)

- Broadened the primary Oxc parser path to cover more of the JS/TS constructs
  from the refactor spec without needing a new parser layer:
  - export specifiers that mark prior declarations as exported
  - named re-exports like `export { foo as bar } from "./dep"`
  - anonymous default function/class exports
  - class constructors, accessors, fields, and methods
  - object-literal callable members on exported constants
  - TypeScript namespaces with nested exported declarations
- Added a focused parser golden test to lock those constructs down directly at
  the parser layer instead of relying only on indexing behavior tests.
- Promoted parser health into `diagnostics` so the lower-level engine surface
  now reports fallback counts, unknown coverage, and grouped fallback reasons
  per indexed repository.
- Bumped Astrograph from `0.0.1-alpha.11` to `0.0.1-alpha.12` for the Phase 3
  parser coverage and diagnostics slice.

## Astrograph graph-aware retrieval Phase 4 (2026-04-27)

- Extended `query_code` so discover and assemble flows can now opt into
  bounded graph expansion with:
  - `includeDependencies`
  - `includeImporters`
  - `relationDepth`
- Graph-aware results now carry explicit explanation reasons instead of opaque
  ranking text:
  - `exact_symbol_match`
  - `query_match`
  - `text_match`
  - `imports_matched_file`
  - `imported_by_match`
  - `reexport_match`
- Discover mode now returns structured match metadata instead of only flat
  symbol/text arrays, while still preserving the older `symbolMatches` and
  `textMatches` surfaces for compatibility.
- Preserved backward compatibility for the older `get_context_bundle` and
  `get_ranked_context` APIs by keeping dependency expansion on by default there,
  even though graph traversal is opt-in on the newer `query_code` discover
  surface.
- Added focused behavior coverage for dependency/importer reasons, bounded
  graph expansion in assembled bundles, and the aliased-import dependency path.
- Bumped Astrograph from `0.0.1-alpha.12` to `0.0.1-alpha.13` for the Phase 4
  graph-aware retrieval slice.

## Astrograph schema migration and incremental metadata Phase 5A (2026-04-27)

- Replaced the old ad hoc schema drift checks with an explicit DB
  `schemaVersion` stored in SQLite `meta`, plus a small migration runner that
  upgrades legacy local indexes in place.
- Left the repo-root storage version file in place as a separate concern:
  `storageVersion` still describes the `.astrograph/` runtime contract, while
  `schemaVersion` now reports the live SQLite layout.
- Added new persisted file metadata fields on `files`:
  - `size_bytes`
  - `mtime_ms`
  - `symbol_signature_hash`
  - `import_hash`
- `index_file` / `index_folder` now skip obvious no-op files earlier by
  comparing stored size and mtime before rereading source, and they backfill
  the new hash fields when a migrated row is touched even if content did not
  materially change.
- Promoted `schemaVersion` into both `diagnostics` and `doctor`, and added a
  regression test that boots a legacy DB layout and verifies Astrograph
  migrates it before serving health data.
- The interface test harness now forces `ASTROGRAPH_USE_SOURCE=1` when it boots
  the package wrapper so source-only contract changes are exercised directly in
  branch work without relying on a rebuilt `dist/`.
- Bumped Astrograph from `0.0.1-alpha.13` to `0.0.1-alpha.14` for this first
  Phase 5 slice.

## Astrograph single-file deletion cleanup follow-up (2026-04-27)

- Tightened the next incremental-refresh edge case after Phase 5A:
  `index-file` now removes an existing index row cleanly when the targeted path
  was deleted, renamed away, newly ignored, or otherwise no longer indexable,
  instead of surfacing a missing-file error.
- That makes one-file repair flows line up with existing watch-mode and
  full-folder cleanup behavior, which is important for commit-hook and
  selective-refresh automation.
- Added focused behavior coverage for the deleted/renamed case and bumped
  Astrograph from `0.0.1-alpha.14` to `0.0.1-alpha.15`.

## Astrograph persisted dependency edges follow-up (2026-04-27)

- Added a persisted `file_dependencies` table to the SQLite schema and bumped
  the DB `schemaVersion` from `2` to `3`.
- Finalize steps now rebuild resolved file-to-file dependency edges from the
  current `imports` table, instead of making importer/dependency traversal rely
  only on ad hoc path resolution during query time.
- `pickDependencyRows` and `pickImporterRows` now read those persisted edges,
  which means a single-file importer refresh invalidates stale dependency
  relations immediately when the importer changes which target or symbol it
  pulls in.
- Added a focused regression where `consumer.ts` switches from
  `bestFormatter` to `firstFormatter`; after `index-file consumer.ts`,
  Astrograph now returns the new dependency and stops returning the old one.
- Bumped Astrograph from `0.0.1-alpha.15` to `0.0.1-alpha.16` for this
  dependency-edge invalidation slice.

## Astrograph unresolved importer warnings follow-up (2026-04-27)

- Extended `doctor` with dependency-graph health for unresolved relative
  imports.
- The doctor surface now reports:
  - `brokenRelativeImportCount`
  - `affectedImporterCount`
  - `sampleImporterPaths`
- Added warnings and suggested actions when relative imports no longer resolve,
  so broken importer files are visible even before broader dependent-file
  orchestration lands.
- Added a focused regression around `src/broken-consumer.ts` importing a
  missing target and bumped Astrograph from `0.0.1-alpha.16` to
  `0.0.1-alpha.17`.

## Astrograph unresolved importer diagnostics follow-up (2026-04-27)

- Promoted unresolved relative imports from a `doctor`-only warning into the
  core `diagnostics` surface.
- `diagnostics` now returns dependency-graph health and marks the index stale
  with `staleReasons: ["unresolved relative imports"]` when importer edges are
  broken, even without an explicit filesystem drift scan.
- Added a focused diagnostics regression for the broken-import case and bumped
  Astrograph from `0.0.1-alpha.17` to `0.0.1-alpha.18`.

## Astrograph performance baseline detour Phase 1 (2026-04-27)

- Documented the main `ai-engine-refactor` branch state directly in
  `.specs/ai-engine-refactor.md` before switching to the separate
  `performance-deps` detour.
- Added the first measurement-only baseline scripts:
  - `bench:perf`
  - `bench:perf:index`
  - `bench:perf:query`
- The new baseline runs against a temporary clean repo copy, prints a compact
  human summary to `stderr`, and emits JSON to `stdout` for regression
  comparison.
- The first slice measures:
  - cold index time
  - warm noop refresh time
  - warm small changed-file refresh time
  - file discovery time
  - file hashing time
  - parser and symbol extraction time
  - approximate SQLite write cost
  - `query_code` discover and assemble latency percentiles
- Added a smoke test for the aggregate JSON output and documented current
  progress in `.specs/performance-deps.md`.
- Explicitly deferred watch event-to-refresh timing until a tighter, more
  comparable fixture exists.
- Bumped Astrograph from `0.0.1-alpha.18` to `0.0.1-alpha.19`.

## Astrograph performance dependency detour Phase 2 (2026-04-27)

- Landed the next `performance-deps` slice on the same feature branch by
  replacing the handwritten recursive candidate walk with a shared
  `fdir`-backed source discovery adapter in `filesystem-scan.ts`.
- Reused that same adapter in the perf scripts and the smaller benchmark
  harness so runtime discovery and measured discovery now share one code path.
- Added focused discovery tests covering:
  - deterministic sort order
  - junk-directory skips
  - `.gitignore` filtering
  - subtree-relative discovery
  - symlink escape safety
- Kept the scope narrow: no new glob layer yet, no watch-path changes yet, and
  no additional ranking or parser work folded into this slice.
- Bumped Astrograph from `0.0.1-alpha.19` to `0.0.1-alpha.20`.

## Temporary jCodemunch-first navigation rollback (2026-04-27)

- Verified `jcodemunch-mcp` is still installed locally and runnable in this
  repo, with the repo-local Codex MCP block already present.
- Switched the repo guidance back to `jcodemunch`-first for now, while keeping
  Astrograph installed in parallel as the secondary path during the transition.
- Updated the shared workflow surface so agents stop assuming Astrograph is the
  primary navigation tool:
  - `AGENTS.md`
  - `.agents/rules/repo-workflow.md`
  - `CLAUDE.md`
  - `scripts/ralph/prompt.md`
  - `.agents/hooks/code-navigation-guard.mjs`
- Left the repo-local `.codex/config.toml` MCP blocks intact for both engines;
  this slice changes agent preference and guardrails, not the parallel install
  topology.

## Repo-scoped jCodemunch init for Codex-safe use (2026-04-27)

- Checked `jcodemunch-mcp init --help` and confirmed it has no native Codex
  client target; it only knows MCP client registrations such as Claude Code,
  Claude Desktop, Cursor, Windsurf, and Continue.
- Used the Codex-safe subset instead of broad client registration:
  - `jcodemunch-mcp init --client none --claude-md project --index --audit --yes`
- That kept the existing repo-local `.codex/config.toml` setup untouched,
  avoided new global client registration, avoided new Claude hook changes, and
  limited repo changes to the local `CLAUDE.md` policy append plus a fresh
  index/audit run.
- The audit reported no issues and the project-local `CLAUDE.md` now contains
  the generated jCodemunch code exploration policy block.

## AGENTS.md jCodemunch policy mirror (2026-04-27)

- Added a compact `Code Exploration Policy` section to `AGENTS.md` so the
  Codex-facing repo bootstrap now mirrors the practical jCodemunch navigation
  rules that `jcodemunch-mcp init` appended into `CLAUDE.md`.
- Kept the `AGENTS.md` version shorter and repo-specific rather than copying
  the entire generated Claude block verbatim.
