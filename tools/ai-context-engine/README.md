# Astrograph (`@playground/ai-context-engine`)

Local deterministic context engine for AI-assisted code exploration.

`Astrograph` is the human-facing name for this engine inside the repo. The
published package name, runtime directory, MCP server id, and CLI command stay
`ai-context-engine` for compatibility.

## What it does

This package is the repo-owned code retrieval layer for agent workflows in this
workspace.

In practice it helps an agent answer questions like:

- "Where is this behavior implemented?"
- "What symbols look relevant to this query?"
- "Show me the exact source for these symbols."
- "Give me a bounded bundle of the most relevant code under a token budget."
- "Is the local index fresh, and is watch mode healthy?"

It does that by indexing a repo locally, storing symbol and file metadata in
SQLite, and exposing retrieval surfaces over that index through a stdio MCP
server, with a CLI and small TypeScript API as secondary debug and development
surfaces.

The runtime artifacts for a given repo live at the repo root in
`.ai-context-engine/`. That directory is the durable runtime contract for local
use:

- `index.sqlite` for the current index backend
- `repo-meta.json` and `integrity.sha256` for repo-local metadata
- `events.jsonl` for append-only observability events
- `raw-cache/` for supporting source cache state

By contrast, package build output stays inside this workspace at `dist/`. The
repo-root directory is for engine runtime state, not npm publishing artifacts.

Current capabilities:

- repo-local indexing under `.ai-context-engine/`
- exact symbol and source retrieval as the truth layer
- ranked, budgeted context assembly for agent use
- stdio MCP entrypoint backed by the official MCP TypeScript SDK
- CLI entrypoint for local debugging and benchmarks
- local benchmark scripts for latency and token-savings measurement
- watch-mode refresh with native filesystem watching and polling fallback
- opt-in localhost observability over Bun's uWebSockets-backed server runtime

The framing is intentionally "context engine", not generic code intelligence.
The package exists to give agents the minimum high-signal code context they need
without broad file reads.

## How an agent uses it

The typical flow is:

1. index the repo with `index-folder`
2. start with `query-code` in auto mode for the normal agent path
3. fall back to `get-repo-outline`, `get-file-tree`, `get-file-outline`,
   `search-symbols`, or `search-text` when you need the lower-level surfaces
4. pull exact code with `query-code --intent source`, or let auto mode infer
   source retrieval from explicit file or symbol targets, then fall back to
   `get-symbol-source` or
   `get-file-content`
5. assemble bounded context with `query-code --intent assemble`, or let auto
   mode infer assembly from a token budget or ranked-candidate request, then
   fall back to
   `get-context-bundle`, or `get-ranked-context`
6. check freshness or watch status with `diagnostics`

This keeps retrieval discovery-first and source-anchored instead of jumping
straight to broad file reads.

## Implementation highlights

Current implementation includes:

- package scaffold and storage/config contract
- Oxc as the primary parser for TypeScript and JavaScript source, including
  `.ts`, `.tsx`, `.js`, `.mjs`, `.cjs`, and `.jsx`
- temporary Tree-sitter fallback contained behind the parser facade
- SQLite as the current index backend behind an internal storage boundary
- WAL-mode file, symbol, import, and content-blob storage for the current
  backend
- JSON CLI entrypoint in `src/cli.ts`
- stdio MCP server in `src/mcp.ts`
- `index_folder` and `index_file`
- `get_repo_outline`, `get_file_tree`, and `get_file_outline`
- `search_symbols` and `search_text`
- `get_context_bundle` for bounded, query-driven context assembly
- `get_ranked_context` for inspectable query ranking plus bounded selection
- `get_file_content`, batched `get_symbol_source`, and `diagnostics`
- direct ranked candidate retrieval and bounded context benchmarking in
  `bench:small`
- fixture-backed tests proving indexing and exact retrieval
- diagnostics defaults to cheap metadata reads, with optional live drift
  scanning when callers explicitly request freshness checks
- diagnostics includes indexed timestamps, snapshot hashes, and live drift
  counts so stale metadata can be distinguished from a fresh index
- diagnostics also persists the latest watch-session state so agents can inspect
  recent watch health without being attached to the live CLI event stream
- watch mode now prefers a native filesystem watcher and falls back to the
  internal polling detector when native watching is unavailable or errors
- direct `index-folder` and `index-file` requests now offload the heavy index
  pass into a child process so explicit reindex work does not monopolize the
  main MCP server process
- symbol search now supports `language` and `filePattern` filters, and text
  search supports `filePattern`
- repo inputs anchored to any Git subdirectory resolve to the enclosing worktree
  root for storage and indexing

## Retrieval surfaces

The main retrieval surfaces are:

- `query_code`
  preferred umbrella surface for discovery, exact retrieval, and bounded
  assembly with one intent-driven contract across the MCP boundary. When the
  intent is omitted, auto mode resolves to discover, source, or assemble from
  the provided arguments.
- `diagnostics`
  metadata-first health and freshness reporting, with optional full drift scan

The package is optimized around exact retrieval first. Ranking and assembly sit
on top of exact indexed source; they do not replace it.

For agent ergonomics, the MCP surface is intentionally narrow: use
`query_code`, structural inspection tools, and `diagnostics`. The older
granular retrieval commands remain available through the library and CLI for
debugging, benchmarks, and engine development.

## Repo workflow role

In this repo, `ai-context-engine` is the default code retrieval layer for agent
work. The intended split is:

- use `ai-context-engine` for code search, exact source retrieval, bounded
  context assembly, and freshness checks
- use `obsidian-memory` for architecture, decisions, and historical repo memory
- use `jcodemunch` when you need importer, reference, or blast-radius style
  navigation that the local engine does not cover yet

That dogfood split is deliberate. The engine should prove itself on normal code
tasks without replacing the repo's durable memory layer.

## Package interfaces

You can use the engine through:

- the stdio MCP server in `src/mcp.ts`, which is the primary agent interface
  and exposes indexing tools, structural outline tools, `query_code`, and
  `diagnostics`
- the Bun-backed observability server in `scripts/observability-server.mjs`,
  which exposes `/health`, `/recent`, and `/events` for local live debugging
- the library exports in `src/index.ts`
- the JSON CLI in `src/cli.ts` for local debugging, packaging smoke tests, and
  benchmarks

The shortest local entrypoint is usually `pnpm exec ai-context-engine ...`.

For packaging, the published bin is the same `ai-context-engine` command. The
workspace wrapper falls back to `src/*.ts` during local development, but
`prepack` now builds `dist/` so installed consumers execute plain built
JavaScript instead of repo-local TypeScript sources.

## Commands

- `pnpm exec ai-context-engine cli index-folder --repo /abs/repo`
- `pnpm exec ai-context-engine cli get-repo-outline --repo /abs/repo`
- `pnpm exec ai-context-engine cli search-symbols --repo /abs/repo --query Greeter --language ts --file-pattern 'src/*.ts'`
- `pnpm exec ai-context-engine cli get-symbol-source --repo /abs/repo --symbols id1,id2 --context-lines 2`
- `pnpm exec ai-context-engine cli query-code --repo /abs/repo --query Greeter --include-text`
- `pnpm exec ai-context-engine cli query-code --repo /abs/repo --intent source --symbols id1,id2 --context-lines 2 --verify`
- `pnpm exec ai-context-engine cli query-code --repo /abs/repo --query Greeter --budget 120 --include-ranked`
- `pnpm exec ai-context-engine cli get-context-bundle --repo /abs/repo --query Greeter --budget 120`
- `pnpm exec ai-context-engine cli get-ranked-context --repo /abs/repo --query Greeter --budget 120`
- `pnpm exec ai-context-engine cli diagnostics --repo /abs/repo`
- `pnpm exec ai-context-engine cli diagnostics --repo /abs/repo --scan-freshness`
- `pnpm exec ai-context-engine mcp`
- `pnpm exec ai-context-engine observability --repo /abs/repo`
- `pnpm --filter @playground/ai-context-engine bench:small`
- `pnpm --filter @playground/ai-context-engine bench:cli`
- `pnpm --filter @playground/ai-context-engine build`
- `pnpm --filter @playground/ai-context-engine test:package-bin`
- `pnpm --filter @playground/ai-context-engine cli -- index-folder --repo /abs/repo`
- `pnpm --filter @playground/ai-context-engine cli -- get-repo-outline --repo /abs/repo`
- `pnpm --filter @playground/ai-context-engine cli -- search-symbols --repo /abs/repo --query Greeter --language ts --file-pattern 'src/*.ts'`
- `pnpm --filter @playground/ai-context-engine cli -- get-symbol-source --repo /abs/repo --symbols id1,id2 --context-lines 2`
- `pnpm --filter @playground/ai-context-engine cli -- query-code --repo /abs/repo --query Greeter --include-text`
- `pnpm --filter @playground/ai-context-engine cli -- query-code --repo /abs/repo --intent source --symbols id1,id2 --context-lines 2 --verify`
- `pnpm --filter @playground/ai-context-engine cli -- query-code --repo /abs/repo --query Greeter --budget 120 --include-ranked`
- `pnpm --filter @playground/ai-context-engine cli -- get-context-bundle --repo /abs/repo --query Greeter --budget 120`
- `pnpm --filter @playground/ai-context-engine cli -- get-ranked-context --repo /abs/repo --query Greeter --budget 120`
- `pnpm --filter @playground/ai-context-engine cli -- diagnostics --repo /abs/repo`
- `pnpm --filter @playground/ai-context-engine cli -- diagnostics --repo /abs/repo --scan-freshness`
- `pnpm --filter @playground/ai-context-engine mcp`

The CLI prints JSON for each command. The MCP server runs over stdio using the
official MCP TypeScript SDK and a narrow repo-owned tool surface.

## Live observability

The package now includes an opt-in local observability surface intended for
developer debugging rather than agent retrieval.

- start it with `pnpm exec ai-context-engine observability --repo /abs/repo`
- add `--dev` in workspace development to force the Vite dev client and React
  Fast Refresh path explicitly
- it binds to `127.0.0.1` by default and uses Bun's uWebSockets-backed server
  runtime through `Bun.serve`
- if the requested port is unavailable, startup scans `34323-35322` and uses
  the first open port in that range
- in workspace mode, if the built viewer assets are missing, the Bun server
  automatically starts a Vite dev server and serves a React client shell with
  hot reload instead of failing startup
- it exposes:
  - `/` for the React observability viewer
  - `/health` for a live `diagnostics` snapshot
  - `/recent` for the current in-memory tail of recent JSONL events
  - `/events` for a read-only websocket stream
- event producers append to `.ai-context-engine/events.jsonl`
- the Bun server does not open SQLite directly; health snapshots are delegated
  to the normal Node CLI path so the transport runtime stays separate from the
  storage runtime
- the viewer now prefers MessagePack over both HTTP and websocket paths, while
  JSON remains available as a compatibility fallback

This surface is intentionally local, metadata-first, and read-only. It exists
to help inspect MCP requests, watch behavior, child index worker activity, and
health drift without changing the MCP protocol contract.

## Repo config

The package also supports an optional repo-root config file:

- `ai-context-engine.config.json`

Initial supported shape:

```json
{
  "summaryStrategy": "doc-comments-first",
  "observability": {
    "enabled": false,
    "host": "127.0.0.1",
    "port": 34323,
    "recentLimit": 100,
    "snapshotIntervalMs": 1000
  }
}
```

Current behavior:

- missing config behaves like the current defaults
- invalid config fails clearly
- summary strategy defaults are picked up by engine operations when no explicit
  override is passed
- observability server defaults are picked up from this file, but explicit CLI
  flags still win
- Bun is only required when the observability command is actually invoked

## Structured diagnostics

Opt-in structured diagnostics now use `pino` and stay disabled by default.

- set `AI_CONTEXT_ENGINE_LOG_LEVEL=debug` or `trace` to emit JSON logs to
  `stderr`
- default behavior stays `silent`, which keeps MCP stdout clean and preserves
  JSON CLI output contracts
- the current instrumentation is intentionally narrow: MCP tool dispatch,
  watch lifecycle, and child index worker execution

## Packaging

The package now has an explicit build step for npm-style use:

- `build` emits `dist/index.js`, `dist/cli.js`, `dist/mcp.js`, and declarations
- `prepack` runs `build` automatically before `pnpm pack` or publish
- `test:package-bin` packs the workspace package into a tarball, installs it
  into a temporary project, and verifies the installed `ai-context-engine` bin
  can index a fixture repo

That means the CLI can be exercised both as a workspace command and as an
installed package command, which is the minimum contract we need before making
this publishable.

## Storage direction

SQLite is the current backend, not the promised forever architecture. The
public library, CLI, and MCP surfaces are meant to stay stable while the
internal index backend evolves.

The next storage changes should preserve:

- repo-root `.ai-context-engine/` artifacts as the runtime contract
- exact retrieval semantics and source-anchored outputs
- backend-specific details staying behind the engine's internal storage layer

## Benchmarks

Two benchmark layers exist today:

- `pnpm --filter @playground/ai-context-engine bench:small`
  in-process engine benchmark with parser microbench, retrieval latency, token
  savings, parser backend, and fallback metadata
- `pnpm --filter @playground/ai-context-engine bench:cli`
  command-level benchmark wrapper intended to run through `hyperfine`

`bench:small` is the main product benchmark. It exists to measure retrieval
value, not just raw parse speed.

`bench:cli` uses `hyperfine` and expects that binary to already be installed on
the machine. If it is missing, the script fails with an install hint instead of
silently skipping CLI benchmarks.

## Mutation testing

Early Stryker adoption is wired in two lanes:

- `pnpm --filter @playground/ai-context-engine test:mutation`
  is an informational opt-in gate. It does not run Stryker directly.
- `pnpm --filter @playground/ai-context-engine test:mutation:full`
  is the same gate for the broader profile.
- `pnpm --filter @playground/ai-context-engine mutation:smoke`
  runs the carved-down smoke profile against dedicated boundary tests only.
- `pnpm --filter @playground/ai-context-engine mutation:full`
  runs the broader boundary profile when you intentionally want a deeper
  survivor hunt.

Mutation testing is intentionally optional until the runtime story is better.
The smoke profile is intentionally narrow so it can stay under about a minute in
normal local use. The full profile is slower and is not intended for the tight
inner loop. Plain `vitest` remains the normal fast feedback loop.

## Current limits

This package is not yet a full code intelligence platform.

Current limits to keep in mind:

- retrieval is still strongest on exact symbol and lexical paths
- relationship traversal is narrower than it should be
- ranking is useful but still relatively shallow
- incremental indexing remains watch-, file-, and folder-oriented rather than
  fully fine-grained
- the engine intentionally does not expose progress streaming or RxJS-style
  orchestration yet; add that only for a concrete UX gap that the current
  MCP plus watch model cannot cover
