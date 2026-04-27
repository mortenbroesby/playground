# @astrograph (`@astrograph/astrograph`)

Local deterministic context engine for AI-assisted code exploration.

`@astrograph/astrograph` is the npm package name and `astrograph` is the primary CLI command.
`ai-context-engine` still exists as a compatibility bin alias during the transition.

## Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Security](#security)
- [How to Contribute](#how-to-contribute)
- [What's Next](#whats-next)
- [Documentation](#documentation)
- [License](#license)
- [Acknowledgements](#acknowledgements)
- [Author](#author)

## About

Astrograph is the repo-owned code retrieval layer for agent workflows in this workspace.

It exists to answer questions like:

- where is this behavior implemented?
- what symbols look relevant to this query?
- show me the exact source for these symbols
- give me a bounded bundle of the most relevant code under a token budget
- is the local index fresh, and is watch mode healthy?

It does that by indexing a repo locally, storing file and symbol metadata in SQLite, and exposing
retrieval surfaces through a stdio MCP server, JSON CLI, and small TypeScript API.

The package is currently a personal tool:

- it exists first to support workflow inside this repo
- it is MIT-licensed, but that is not a support commitment
- it is not positioned as a supported public product yet

## Features

- Repo-local indexing under `.astrograph/`
- Exact symbol and source retrieval as the primary truth layer
- Ranked, token-budgeted context assembly for agent use
- `query_code` umbrella surface for discovery, source retrieval, and assembly
- `diagnostics` and `doctor` flows for freshness, health, and repair guidance
- Watch-mode refresh with `@parcel/watcher`, `fs.watch`, and polling fallback paths
- Live-disk text fallback via ripgrep when discovery text search is requested on
  a missing or stale index
- Stdio MCP server backed by the official MCP TypeScript SDK
- CLI and library entry points for local debugging, benchmarks, and packaging checks
- Local observability server for recent events and watch health

## Tech Stack

- `TypeScript`
- `Node 24`
- `SQLite` via `better-sqlite3`
- `oxc-parser` as the primary parser
- temporary `tree-sitter` fallback behind the parser facade
- `@modelcontextprotocol/sdk` for the MCP server surface
- `tsup` for build output
- `Vitest` and package-local benchmark scripts for verification
- `Bun` for the observability server runtime

## Architecture

Astrograph is built around a local repo index and a narrow retrieval contract.

High-level flow:

1. Index a repo into `.astrograph/` at the repo root.
2. Persist file, symbol, import, and metadata state in SQLite.
3. Serve exact retrieval and ranked assembly from that indexed state.
4. Expose the same core capabilities through CLI, MCP, and library entry points.

Runtime artifacts for a given repo live under `.astrograph/`:

- `index.sqlite` for the current index backend
- `repo-meta.json` and `integrity.sha256` for repo-local metadata
- `events.jsonl` for append-only observability events
- `raw-cache/` for supporting source cache state

Package build output stays in `dist/`. Repo-root `.astrograph/` data is runtime state, not npm
publish output.

## Project Structure

```text
src/
  index.ts                Library entry point
  cli.ts                  JSON CLI entry point
  mcp.ts                  Stdio MCP server
scripts/
  ai-context-engine.mjs   Bin wrapper for built/runtime selection
  install.mjs             Standalone installer flow
  observability-server.mjs
observability/            Local observability frontend and config
bench/                    Benchmark sources
tests/                    Package tests
dist/                     Built JavaScript and type output
```

## Getting Started

### Requirements

- Node `24.x`
- `pnpm`

### Install In This Monorepo

```bash
pnpm install
pnpm --filter @astrograph/astrograph build
```

### Common Commands

```bash
pnpm --filter @astrograph/astrograph build
pnpm --filter @astrograph/astrograph test
pnpm --filter @astrograph/astrograph type-check
pnpm --filter @astrograph/astrograph bench:small
pnpm exec astrograph mcp
pnpm exec astrograph observability --repo /abs/repo
```

### Basic CLI Examples

```bash
pnpm exec astrograph cli index-folder --repo /abs/repo
pnpm exec astrograph cli query-code --repo /abs/repo --query Greeter --include-text
pnpm exec astrograph cli query-code --repo /abs/repo --intent source --symbols id1,id2 --context-lines 2 --verify
pnpm exec astrograph cli diagnostics --repo /abs/repo
pnpm exec astrograph cli doctor --repo /abs/repo
```

### Verification Baseline

```bash
pnpm --filter @astrograph/astrograph type-check
pnpm --filter @astrograph/astrograph test
pnpm --filter @astrograph/astrograph test:package-bin
```

## Configuration

### Interfaces

You can use Astrograph through:

- the stdio MCP server in `src/mcp.ts`
- the JSON CLI in `src/cli.ts`
- the library exports in `src/index.ts`
- the Bun-backed observability server in `scripts/observability-server.mjs`

### Runtime Notes

- Built JavaScript in `dist/` is the default runtime path.
- The `astrograph` wrapper prefers `dist/*` when those files exist.
- Source-mode execution is an explicit dev opt-in:

```bash
ASTROGRAPH_USE_SOURCE=1 pnpm exec astrograph ...
```

### Repo Config

Astrograph reads optional repo-local defaults from `astrograph.config.json`:

```json
{
  "summaryStrategy": "doc-comments-first",
  "performance": {
    "fileProcessingConcurrency": "auto",
    "workerPool": {
      "enabled": false,
      "maxWorkers": "auto"
    }
  },
  "watch": {
    "backend": "auto",
    "debounceMs": 100
  }
}
```

- `watch.backend` can force `parcel`, `node-fs-watch`, or `polling`
- `watch.debounceMs` sets the default debounce window for `watchFolder()`
- `performance.workerPool.enabled` opt-ins CPU-heavy parse/hash analysis through
  Piscina worker threads during folder indexing
- `performance.workerPool.maxWorkers` bounds the worker pool when that path is
  enabled
- explicit library or CLI options still override repo-config defaults

### Standalone Codex Install

Astrograph supports a standalone Codex bootstrap flow:

```bash
npx @astrograph/astrograph install --ide codex
```

That installer resolves the repo root, writes a managed Astrograph MCP block into
`.codex/config.toml`, and preserves unrelated Codex config content.

### Versioning

Astrograph treats `package.json` as its canonical version source and uses npm-compatible prerelease
semver:

- `major.minor.patch-alpha.increment`

Those values map to:

- `major` for breaking MCP, storage, or library contract changes
- `minor` for backward-compatible feature additions
- `patch` for backward-compatible fixes and internal changes
- `increment` for each Astrograph commit on the same base semver line

## Security

- Treat `.astrograph/` as local runtime state, not a place for secrets.
- Do not store credentials in observability output or test fixtures.
- Keep repo-root runtime artifacts separate from package build output in `dist/`.
- Prefer local-only observability when debugging repo indexing and watch behavior.

## How to Contribute

- Keep the MCP surface narrow and source-anchored.
- Optimize for exact retrieval first; ranking and assembly should build on top of exact source.
- Preserve the repo-local runtime contract under `.astrograph/`.
- When changing package behavior or workflow, update this README and related repo docs in the same
  change.
- If staged changes under `tools/ai-context-engine/` require a version bump, follow the package's
  version policy.

Useful local commands:

- `pnpm --filter @astrograph/astrograph test`
- `pnpm --filter @astrograph/astrograph type-check`
- `pnpm --filter @astrograph/astrograph bench:perf -- --repo /abs/repo --runs 10`
- `pnpm --filter @astrograph/astrograph mcp`

## What's Next?

Current priorities are clear:

- keep proving the repo-owned retrieval path on normal agent tasks
- strengthen freshness, observability, and repair flows
- keep the source of truth local, deterministic, and cheap to inspect
- continue narrowing the gap between discovery, exact retrieval, and bounded assembly

## Documentation

The main entry points are:

- this README for package overview and usage
- the root [README](../../README.md) for repo context
- the root [AGENTS.md](../../AGENTS.md) for agent workflow expectations

Core commands and surfaces worth knowing:

- `query_code` for discovery, source retrieval, and bounded assembly
- `diagnostics` for metadata-first health and freshness reporting
- `doctor` for operator-facing warnings and suggested repair actions

## License

MIT. See [LICENSE](./LICENSE).

## Acknowledgements

- `Oxc` for the primary parser path
- `SQLite` and `better-sqlite3` for the local index backend
- the official `Model Context Protocol` TypeScript SDK for the MCP surface
- `Bun` for the local observability server runtime

## Author

Built and maintained by [Morten Broesby](https://github.com/mortenbroesby).
