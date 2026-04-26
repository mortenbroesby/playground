# ai-context-engine-alpha-release-spec.md

## Status

Proposed on 2026-04-26.

Checked against the repo on 2026-04-26.

## 1. Objective

Make `@playground/ai-context-engine` releasable in an npm alpha state and
usable from an installed repo without relying on workspace-only assumptions.

This slice should harden two specific gaps:

1. repo-local configuration should be discoverable from the installed package
2. observability should stay optional rather than feeling like a required part
   of the core retrieval runtime

## 2. Target User

- a repo maintainer who installs `@playground/ai-context-engine` from npm
- an agent or developer running the installed `ai-context-engine` bin inside a
  normal Git repo

## 3. Constraints

- keep stdio MCP, CLI retrieval, and library exports working without any config
  file
- keep observability opt-in and local-only
- do not require Bun for normal indexing, CLI, or MCP use
- keep the repo-root runtime contract under `.ai-context-engine/`
- preserve current repo-root auto-resolution through the enclosing Git worktree

## 4. Non-Goals

- publishing to npm in this slice
- redesigning the retrieval API surface
- adding remote observability, auth, or browser control
- moving all CLI behavior behind a daemon

## 5. Proposed Contract

## 5.1 Repo config file

Add an optional root-level file:

- `ai-context-engine.config.json`

The installed package should look for this file at the resolved repo root.

Initial supported shape:

```json
{
  "summaryStrategy": "doc-comments-first",
  "observability": {
    "enabled": false,
    "host": "127.0.0.1",
    "port": 4318,
    "recentLimit": 100,
    "snapshotIntervalMs": 1000
  }
}
```

Rules:

- all fields are optional
- missing config must behave exactly like today
- invalid config must fail clearly with one actionable error
- repo-level CLI and MCP calls may inherit config defaults, but explicit CLI
  flags still win

## 5.2 Config loading behavior

The package should expose a small config loader that:

1. resolves the effective repo root
2. checks for `ai-context-engine.config.json` at that root
3. validates the file with a narrow schema
4. returns merged defaults plus overrides

Initial use sites:

- engine config construction
- observability command defaults

## 5.3 Optional observability

Observability remains optional in three senses:

1. no config file is required for core usage
2. no Bun runtime is required unless the observability command is invoked
3. the viewer/web server remains a debug surface, not part of MCP or CLI
   correctness

## 5.4 MVP web server

Add a tiny built-in viewer page to the observability server.

Scope:

- serve a minimal HTML page at `/`
- connect to `/events`
- poll or fetch `/health` and `/recent`
- show current health, recent events, and live incoming events
- keep the page dependency-free and static

This page is an operator/debug surface only. It is not a framework app.

## 6. Acceptance Criteria

1. `pnpm exec ai-context-engine observability --repo /abs/repo` serves a page
   at `/` that shows current health and live events.
2. The viewer still works when the package is run through the published-style
   bin wrapper, not just source files.
3. A repo with no `ai-context-engine.config.json` behaves like current default
   behavior.
4. A repo with `ai-context-engine.config.json` can set observability defaults
   and summary strategy defaults.
5. Explicit CLI flags override config-file defaults.
6. Invalid config files fail with a narrow validation error instead of silent
   fallback.
7. Core CLI and MCP paths still work when Bun is not installed, as long as the
   observability command is not invoked.

## 7. Verification

- `pnpm --filter @playground/ai-context-engine type-check`
- `pnpm --filter @playground/ai-context-engine type-lint`
- `pnpm --filter @playground/ai-context-engine test -- --run tests/engine-contract.test.ts tests/interface.test.ts`
- `pnpm markdown:check .specs/ai-context-engine-alpha-release-spec.md tools/ai-context-engine/README.md`

## 8. Implementation Order

1. add validated repo-root config loading plus tests
2. thread config defaults into engine config and observability command parsing
3. add the dependency-free viewer at `/`
4. document npm-alpha expectations and the optional Bun boundary
