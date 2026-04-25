# ai-context-engine-performance-priorities-spec.md

## Status

Proposed on 2026-04-25.

This spec captures the local research that led to the recommended next
performance refactor order for `@playground/ai-context-engine`.

## 1. Decision

The highest-value performance work for `ai-context-engine` should happen in
this order:

1. repo-root and SQLite connection cache
2. remove `countSkippedFiles()` from normal index and watch responses
3. SQL or FTS-backed discovery path for `query_code`
4. optional workerized indexing
5. progress streaming or RxJS-style abstractions only after the above

## 2. Why This Order

The current bottlenecks are primarily repeated setup work, whole-repo scans,
and in-memory discovery over broad symbol sets. They are not primarily
transport-level or reactive-composition problems.

The current MCP surface is already narrow and correct. The biggest wins now are
in the engine request path and indexing path beneath MCP.

## 3. Research Basis

### 3.1 Repeated repo-root resolution and storage setup

`resolveRepoRoot()` still shells out to `git rev-parse --show-toplevel` in
[tools/ai-context-engine/src/storage.ts](/Users/macbook/personal/playground/tools/ai-context-engine/src/storage.ts:211),
and `ensureStorage()` is used broadly as the first step in engine operations in
[tools/ai-context-engine/src/storage.ts](/Users/macbook/personal/playground/tools/ai-context-engine/src/storage.ts:230).

Even after the recent request-context refactor, this remains a real class of
cost because many public entrypoints still begin by re-establishing repo and
storage state.

### 3.2 SQLite open/close is still on many request paths

Most engine surfaces still create a database connection per public call via
`openDatabase()` and close it in `finally`, for example:

- [getRepoOutline](/Users/macbook/personal/playground/tools/ai-context-engine/src/storage.ts:1567)
- [getFileTree](/Users/macbook/personal/playground/tools/ai-context-engine/src/storage.ts:1590)
- [getFileOutline](/Users/macbook/personal/playground/tools/ai-context-engine/src/storage.ts:1612)
- [suggestInitialQueries](/Users/macbook/personal/playground/tools/ai-context-engine/src/storage.ts:1642)
- [searchSymbols](/Users/macbook/personal/playground/tools/ai-context-engine/src/storage.ts:1703)
- [searchText](/Users/macbook/personal/playground/tools/ai-context-engine/src/storage.ts:1741)
- [diagnostics](/Users/macbook/personal/playground/tools/ai-context-engine/src/storage.ts:2066)

`query_code` now shares one engine context inside one logical request, but
process-level connection reuse is still the next straightforward win.

### 3.3 Indexing still performs extra whole-repo work for skipped-file counts

Normal indexing returns `skippedFiles` by calling `countSkippedFiles()` in:

- [indexFolder](/Users/macbook/personal/playground/tools/ai-context-engine/src/storage.ts:1207)
- watch flush summaries in
  [watchFolder](/Users/macbook/personal/playground/tools/ai-context-engine/src/storage.ts:1395)

`countSkippedFiles()` recursively walks the repo again in
[tools/ai-context-engine/src/storage.ts](/Users/macbook/personal/playground/tools/ai-context-engine/src/storage.ts:1215).

That work is not on the critical path for MCP usefulness and is a poor trade on
normal index and watch operations.

### 3.4 Discovery still loads and ranks broad symbol sets in JS

`searchSymbols()` loads symbol rows and scores them in memory in
[tools/ai-context-engine/src/storage.ts](/Users/macbook/personal/playground/tools/ai-context-engine/src/storage.ts:1671),
and `query_code` discover delegates directly into that path in
[tools/ai-context-engine/src/storage.ts](/Users/macbook/personal/playground/tools/ai-context-engine/src/storage.ts:1747).

The current ranking helpers also operate over loaded symbol rows in JS in:

- [loadSymbolRows](/Users/macbook/personal/playground/tools/ai-context-engine/src/storage.ts:640)
- [scoreSymbolRow](/Users/macbook/personal/playground/tools/ai-context-engine/src/storage.ts:575)
- [resolveRankedSeedCandidates](/Users/macbook/personal/playground/tools/ai-context-engine/src/storage.ts:915)

That is acceptable at small scale but will not be the right foundation if MCP
becomes the main navigation surface for larger repos.

### 3.5 Freshness scanning is intentionally expensive

`diagnostics({ scanFreshness: true })` performs a full filesystem snapshot and
content hashing pass through
[tools/ai-context-engine/src/storage.ts](/Users/macbook/personal/playground/tools/ai-context-engine/src/storage.ts:2078)
and
[tools/ai-context-engine/src/filesystem-scan.ts](/Users/macbook/personal/playground/tools/ai-context-engine/src/filesystem-scan.ts:157).

That is an explicit slow path and should remain one. The lesson is not “make
diagnostics more reactive.” The lesson is “reduce how often callers need the
slow path by making normal indexing and watch behavior cheaper and more
reliable.”

### 3.6 Watch mode already exists and is operational

The engine already has a real watch flow in
[tools/ai-context-engine/src/storage.ts](/Users/macbook/personal/playground/tools/ai-context-engine/src/storage.ts:1270),
and recent hook work now bootstraps it at session start.

That means streaming progress is not the first missing capability. The more
important issue is the cost and consistency of the indexing work the watcher
already performs.

## 4. Why RxJS Or Streaming Is Not First

The repo already has:

- stdio MCP transport
- narrow tool surfaces
- watch-mode indexing
- persisted watch diagnostics

The main problems are not orchestration expressiveness. They are:

- repeated setup work
- extra whole-repo scans
- broad in-memory ranking work
- single-process coupling between cheap requests and heavy indexing

Adding RxJS now would mostly rearrange control flow around the wrong hot spots.
It would increase surface area before the dominant costs are reduced.

Progress streaming may still be useful later for UX, but it is not the next
highest-value engineering move.

## 5. Priority 1: Repo-Root And SQLite Connection Cache

### Objective

Reduce repeated repo resolution and repeated database open/close overhead across
MCP-driven request traffic.

### Scope

- memoize resolved repo roots across the process
- reuse SQLite connections per repo for the MCP server lifetime
- optionally cache prepared statements for the hottest read paths

### In scope

- engine-internal cache or context manager
- safe cleanup on process exit
- preserving current public CLI, library, and MCP contracts

### Out of scope

- schema changes
- query semantics changes
- new tool surfaces

### Acceptance criteria

- repeated `query_code`, `get_file_outline`, and `diagnostics` calls avoid
  reopening SQLite on every call
- repo-root resolution is not re-shelling to git unnecessarily during a healthy
  server lifetime
- existing interface and engine tests still pass

## 6. Priority 2: Remove `countSkippedFiles()` From Normal Index And Watch Responses

### Objective

Stop spending full-repo traversal cost on metadata that is not essential to the
main MCP workflow.

### Scope

- remove or defer `skippedFiles` from normal `indexFolder`, `indexFile`, and
  watch reindex summaries
- if needed, move skipped-file counting to an explicit diagnostics or benchmark
  path

### Acceptance criteria

- normal indexing does not recurse the repo just to count non-supported files
- watch flush summaries avoid that same extra traversal
- response compatibility impact is explicit in docs or tests

## 7. Priority 3: SQL Or FTS-Backed Discovery For `query_code`

### Objective

Move discovery from broad JS-side row loading toward database-backed candidate
selection.

### Scope

- push filters like `kind`, `language`, and file-path constraints lower
- reduce the number of rows ranked in JS
- evaluate SQLite FTS for text and symbol discovery

### Acceptance criteria

- `query_code` discover and `searchSymbols` no longer depend on loading the
  broad symbol corpus into memory for normal queries
- search quality is preserved or explicitly benchmarked
- fixture and interface tests still pass

## 8. Priority 4: Optional Workerized Indexing

### Objective

Keep cheap MCP requests responsive while heavier indexing work runs in an
isolated execution path.

### Scope

- optional worker thread or child-process indexer
- main MCP server remains responsible for request handling and diagnostics
- index progress and lifecycle can remain internal at first

### Why Optional

This is only worth doing after the cheaper hot-path improvements above. If
connection reuse and scan reduction are enough, workerization may not be
necessary yet.

### Acceptance criteria

- read-oriented MCP requests remain responsive during heavy reindex work
- watch and session-start bootstrap semantics remain intact
- failure handling for the worker path is explicit

## 9. Priority 5: Progress Streaming Or RxJS Abstractions

### Objective

Improve user experience only after the main engine costs are reduced.

### Candidate uses

- progress updates for long `index_folder` runs
- progressive assembly or ranking output
- richer watch-event subscriptions

### Explicit non-goal

Do not introduce RxJS or streaming abstractions as a substitute for fixing
storage, indexing, and discovery costs.

## 10. Constraints

- Preserve the current MCP-first interface direction.
- Keep the `ai-context-engine` package repo-owned and deterministic.
- Do not regress exact source retrieval semantics.
- Avoid widening the public tool surface to compensate for internal
  inefficiencies.

## 11. Verification Plan

For each phase, use the narrowest relevant checks:

- `pnpm --filter @playground/ai-context-engine type-check`
- `pnpm --filter @playground/ai-context-engine test -- --run tests/interface.test.ts`
- targeted engine tests when indexing or watcher behavior changes
- lightweight before/after timing samples for:
  - repeated `query_code`
  - repeated `diagnostics`
  - `index_folder`
  - watch-driven refresh

## 12. Recommendation Summary

The next performance work should focus on storage and indexing mechanics, not
reactive libraries.

The correct sequence is:

1. cache repo-root resolution and SQLite connections
2. remove skipped-file counting from normal index/watch responses
3. move discovery toward SQL or FTS-backed candidate selection
4. isolate indexing work only if needed afterward
5. consider streaming or RxJS only once the dominant costs are already reduced
