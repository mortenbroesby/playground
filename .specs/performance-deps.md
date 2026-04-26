# Performance Dependencies Implementation Spec

**Recommended filename:** `performance-dependencies-implementation-spec.md`

## Mission

Improve the indexing, refresh, watch-mode, and profiling performance of `tools/ai-context-engine` by introducing a small set of targeted npm dependencies and integrating them behind measurable benchmarks and safety checks.

The implementation should prioritize low-risk performance wins first, avoid unnecessary architectural churn, and preserve existing CLI, MCP, and SQLite behavior.

## Repository Scope

Work inside:

```text
tools/ai-context-engine
```

Likely relevant files and areas:

```text
src/filesystem-scan.ts
src/storage.ts
src/parser.ts
src/config.ts
src/cli.ts
src/watch.ts
src/diagnostics.ts
tests/
benchmarks/
package.json
README.md
```

Verify actual paths before editing.

## Proposed Dependencies

### Runtime Dependencies

Add the following first:

```bash
pnpm add fdir picomatch p-map @node-rs/xxhash
```

If native binary risk is a concern, use this instead of `@node-rs/xxhash`:

```bash
pnpm add xxhash-wasm
```

Add later, after baseline benchmarks:

```bash
pnpm add piscina @parcel/watcher
```

Optional, only if profiling justifies them:

```bash
pnpm add @vscode/ripgrep msgpackr fast-json-stringify
```

Optional for future semantic retrieval work, not for the first performance pass:

```bash
pnpm add sqlite-vec
```

### Development Dependencies

Add profiling tools:

```bash
pnpm add -D clinic 0x
```

## Non-Goals

Do not replace `better-sqlite3`.

Do not replace Oxc as the primary parser.

Do not introduce semantic/vector retrieval in this performance pass.

Do not make SQLite writes concurrent from multiple workers.

Do not remove existing watch-mode or polling fallbacks until replacement behavior is proven.

## Implementation Phases

---

## Phase 1 â Baseline Performance Measurement

### Objective

Create a baseline before changing implementation details. This lets later dependency additions prove their value.

### Tasks

Add benchmark scripts that measure at least:

```text
cold index time
warm refresh time with no changes
warm refresh time with a small changed-file set
query_code latency for common queries
file discovery time
file hashing time
parser/symbol extraction time
SQLite write time
watch event-to-refresh latency where practical
```

Suggested package scripts:

```json
{
  "bench:perf": "node ./benchmarks/perf.mjs",
  "bench:perf:index": "node ./benchmarks/perf-index.mjs",
  "bench:perf:query": "node ./benchmarks/perf-query.mjs",
  "bench:profile:index": "clinic flame -- node ./benchmarks/perf-index.mjs",
  "bench:flame:index": "0x -- node ./benchmarks/perf-index.mjs"
}
```

Adapt the commands to the projectâs actual runtime setup.

### Benchmark Output

Emit both human-readable and JSON output.

Example JSON shape:

```json
{
  "schemaVersion": "1.0",
  "repoRoot": "/path/to/repo",
  "commit": "abc123",
  "runs": {
    "coldIndexMs": 4210,
    "warmNoopRefreshMs": 140,
    "fileDiscoveryMs": 310,
    "hashingMs": 780,
    "parseMs": 1700,
    "sqliteWriteMs": 420,
    "queryCodeP50Ms": 18,
    "queryCodeP95Ms": 44
  }
}
```

### Acceptance Criteria

```text
- A developer can run one command to collect baseline performance metrics.
- Benchmark output includes timing for discovery, hashing, parsing, and database writing where feasible.
- JSON output is available for regression comparison.
- Existing tests still pass.
```

---

## Phase 2 â Faster File Discovery with `fdir`

### Objective

Replace or augment custom recursive file discovery with `fdir` to improve cold indexing and freshness scans.

### Dependency

```bash
pnpm add fdir
```

### Tasks

Integrate `fdir` into the file discovery path.

The implementation should:

```text
- enumerate candidate source files quickly
- preserve existing repository-root safety checks
- preserve `.gitignore` behavior
- preserve supported-language filtering
- preserve skip rules for generated, vendor, build, and dependency directories
- avoid returning files outside the repository root
```

Do not remove the existing scanner immediately. Keep a fallback path until behavior is verified.

Suggested adapter:

```ts
export interface FileDiscoveryOptions {
  repoRoot: string;
  include?: string[];
  exclude?: string[];
  respectGitignore?: boolean;
  maxFileBytes?: number;
}

export interface DiscoveredFile {
  absolutePath: string;
  relativePath: string;
  language: string;
  sizeBytes?: number;
}

export async function discoverSourceFiles(
  options: FileDiscoveryOptions
): Promise<DiscoveredFile[]> {
  // fdir-backed implementation
}
```

### Tests

Add tests for:

```text
nested source files
ignored directories
generated files
unsupported extensions
symlink/path escape cases
empty repository
large directory with many non-source files
```

### Acceptance Criteria

```text
- File discovery uses `fdir` or can be switched to `fdir` through one code path.
- Existing ignore behavior is preserved.
- Discovery results are deterministic and sorted.
- Baseline benchmark shows file discovery timing before and after the change.
```

---

## Phase 3 â Compiled Glob Matching with `picomatch`

### Objective

Use compiled glob matchers for `filePattern` and future config-level include/exclude rules.

### Dependency

```bash
pnpm add picomatch
```

### Tasks

Create a small path-matching utility.

Suggested module:

```text
src/path-matcher.ts
```

Suggested API:

```ts
export interface PathMatcherConfig {
  include?: string[];
  exclude?: string[];
}

export interface PathMatcher {
  matches(relativePath: string): boolean;
}

export function createPathMatcher(config: PathMatcherConfig): PathMatcher {
  // compile picomatch matchers once
}
```

Use this utility for:

```text
file discovery include/exclude
search filePattern filtering
diagnostics filters
future index config
```

### Tests

Add tests for:

```text
single filePattern
multiple include globs
exclude precedence
Windows-style path normalization
dotfiles
generated files
fixtures
```

### Acceptance Criteria

```text
- Glob matching is centralized.
- Matchers are compiled once per config/request, not per file.
- Existing `filePattern` behavior is preserved or intentionally documented if changed.
- Tests cover include/exclude precedence.
```

---

## Phase 4 â Faster Non-Cryptographic Hashing

### Objective

Use a fast non-cryptographic hash for routine change detection while preserving SHA-256 for integrity where needed.

### Dependency

Preferred:

```bash
pnpm add @node-rs/xxhash
```

Alternative:

```bash
pnpm add xxhash-wasm
```

### Hashing Policy

Use SHA-256 for:

```text
integrity fields
explicit corruption checks
user-visible cryptographic checksum claims
```

Use xxHash for:

```text
file content fingerprints
parse fingerprints
symbol signature fingerprints
import graph fingerprints
directory snapshot fingerprints
incremental indexing skip checks
```

### Tasks

Add a hashing utility.

Suggested module:

```text
src/hash.ts
```

Suggested API:

```ts
export type HashPurpose =
  | "integrity"
  | "content_fingerprint"
  | "parse_fingerprint"
  | "symbol_signature"
  | "import_graph"
  | "directory_snapshot";

export function hashBytes(input: Uint8Array, purpose: HashPurpose): string;
export function hashString(input: string, purpose: HashPurpose): string;
```

The utility should make it clear whether the hash is cryptographic or non-cryptographic.

### Tests

Add tests for:

```text
stable hash output for same input
different hash output for changed input
hash purpose routing
empty file hashing
large file hashing
fallback behavior if wasm/native init is required
```

### Acceptance Criteria

```text
- Routine change detection no longer depends exclusively on SHA-256.
- Integrity-related behavior still uses SHA-256.
- Hashing behavior is documented.
- Performance benchmark includes hashing timing before and after the change.
```

---

## Phase 5 â Bounded Parallel I/O with `p-map`

### Objective

Improve indexing throughput by reading, hashing, and parsing multiple files concurrently while preserving single-writer SQLite semantics.

### Dependency

```bash
pnpm add p-map
```

### Tasks

Introduce bounded concurrency for file processing.

Recommended architecture:

```text
1. Discover files.
2. Use p-map to read/hash/parse files with bounded concurrency.
3. Collect plain records.
4. Write results to SQLite in a single transaction or single writer queue.
```

Suggested config:

```json
{
  "performance": {
    "fileProcessingConcurrency": "auto"
  }
}
```

`auto` can map to:

```ts
Math.max(2, Math.min(16, os.availableParallelism()))
```

Keep an override for tests and low-resource environments.

### Constraints

Do not write to SQLite from parallel file-processing tasks.

Do not allow unbounded concurrent file reads.

Do not keep large ASTs in memory longer than necessary.

### Tests

Add tests for:

```text
deterministic indexing output with concurrency 1
deterministic indexing output with concurrency >1
large file set
parse failure in one file does not corrupt entire index
SQLite writes remain transactional
```

### Acceptance Criteria

```text
- File read/hash/parse work can run with bounded concurrency.
- SQLite writes remain single-writer and transactional.
- Concurrency can be configured or disabled.
- Benchmark shows cold-index timing before and after the change.
```

---

## Phase 6 â Worker Pool for CPU-Heavy Parsing with `piscina`

### Objective

Use worker threads for CPU-heavy parsing, symbol extraction, token estimation, or summary preparation if profiling shows CPU saturation.

### Dependency

```bash
pnpm add piscina
```

### Prerequisites

Complete Phases 1 through 5 first.

Use profiling to confirm parsing or tokenization is a bottleneck.

### Tasks

Create a worker module for file analysis.

Suggested modules:

```text
src/workers/analyze-file-worker.ts
src/file-analysis.ts
```

Worker input:

```ts
export interface AnalyzeFileInput {
  absolutePath: string;
  relativePath: string;
  language: string;
  maxFileBytes: number;
}
```

Worker output:

```ts
export interface AnalyzeFileOutput {
  relativePath: string;
  contentHash: string;
  sizeBytes: number;
  symbols: Array<{
    name: string;
    kind: string;
    startLine: number;
    endLine: number;
    exported?: boolean;
  }>;
  imports: Array<{
    specifier: string;
    kind: string;
    resolvedPath?: string;
  }>;
  tokenEstimate?: number;
  parserBackend: "oxc" | "tree-sitter" | "fallback" | "unknown";
  parserWarnings?: string[];
}
```

Main process responsibilities:

```text
file discovery
worker scheduling
SQLite connection ownership
transactional writes
diagnostics aggregation
```

Worker responsibilities:

```text
read source
hash source
parse source
extract symbols/imports
estimate tokens where useful
return serializable data only
```

### Constraints

Do not pass large ASTs between worker and main thread.

Do not share Tree-sitter parser instances across workers.

Limit worker count.

Provide a no-worker fallback for tests or unsupported environments.

### Tests

Add tests for:

```text
worker and no-worker modes produce equivalent index data
worker parse errors are captured and reported
large files do not crash worker pool
worker pool respects concurrency limits
Tree-sitter fallback remains safe
```

### Acceptance Criteria

```text
- Worker mode is optional and configurable.
- Main process remains the only SQLite writer.
- Worker mode produces equivalent indexed data.
- Profiling or benchmark output demonstrates whether the worker pool improves cold indexing.
```

---

## Phase 7 â Native Watch Backend with `@parcel/watcher`

### Objective

Improve long-running watch mode with a more reliable native recursive watcher while retaining polling fallback.

### Dependency

```bash
pnpm add @parcel/watcher
```

### Tasks

Add a watcher abstraction.

Suggested module:

```text
src/watch-backend.ts
```

Suggested API:

```ts
export type WatchBackendKind = "parcel" | "node-fs-watch" | "polling";

export interface WatchEvent {
  path: string;
  type: "create" | "update" | "delete" | "rename" | "unknown";
}

export interface WatchSubscription {
  backend: WatchBackendKind;
  close(): Promise<void>;
}

export async function subscribeRepo(
  repoRoot: string,
  onEvents: (events: WatchEvent[]) => void,
  options: WatchOptions
): Promise<WatchSubscription> {
  // prefer parcel watcher, then fallback
}
```

The watcher should:

```text
batch events
debounce bursts
normalize paths
handle create/update/delete/rename
ignore irrelevant files
respect repo-root boundaries
fall back cleanly when native watching fails
```

### Tests

Add tests for the event-normalization layer.

Where direct filesystem watch tests are flaky, test the backend abstraction with synthetic events.

Cover:

```text
create file
update file
delete file
rename file
burst of events
ignored file event
path escape event
backend fallback
```

### Acceptance Criteria

```text
- Watch mode uses `@parcel/watcher` when available.
- Existing fallback behavior remains available.
- Diagnostics report active watch backend.
- Watch refresh remains debounced and bounded.
- Tests cover event normalization and fallback selection.
```

---

## Phase 8 â Optional Ripgrep Fallback with `@vscode/ripgrep`

### Objective

Add a fast live-disk fallback for stale or missing indexes without replacing SQLite FTS.

### Dependency

```bash
pnpm add @vscode/ripgrep
```

### Use Cases

Use ripgrep for:

```text
query_code fallback when index is missing or stale
diagnostics comparison between indexed files and live files
debug command to search disk immediately
optional file enumeration during bootstrap
```

Do not use ripgrep for normal indexed retrieval when SQLite FTS is fresh.

### Tasks

Add a small ripgrep adapter.

Suggested module:

```text
src/live-search.ts
```

Results should be clearly marked:

```json
{
  "source": "live_disk_match",
  "path": "src/example.ts",
  "line": 42,
  "reason": "ripgrep_fallback"
}
```

### Constraints

Limit output bytes.

Limit number of matches.

Respect repo root.

Respect ignore behavior.

Sanitize query arguments to avoid shell injection; prefer direct process arguments, not shell strings.

### Tests

Add tests for:

```text
missing index fallback
stale index fallback
match limit
output truncation
path safety
query with special characters
```

### Acceptance Criteria

```text
- Ripgrep fallback is optional and clearly labeled.
- Normal indexed retrieval remains the default.
- Fallback respects output limits and path safety.
```

---

## Phase 9 â Optional Serialization Optimization

### Objective

Only optimize serialization if profiling shows JSON or MessagePack overhead is material.

### Candidate Dependencies

```bash
pnpm add msgpackr fast-json-stringify
```

### `msgpackr` Use Cases

Use for internal binary payloads only:

```text
raw cache blobs
large internal analysis payloads
worker messages if serialization dominates
```

Do not use for public CLI or MCP JSON outputs.

### `fast-json-stringify` Use Cases

Use for stable response envelopes:

```text
diagnostics
repo outline
file tree
search results
query_code metadata
```

Avoid using it for arbitrary source-heavy payloads unless profiling supports it.

### Tests

Add tests for:

```text
schema-compatible JSON output
roundtrip cache serialization
large payload serialization
public API compatibility
```

### Acceptance Criteria

```text
- Public JSON contracts remain unchanged.
- Serialization optimization is gated by benchmark/profiling evidence.
- No binary format is introduced into user-facing CLI output.
```

---

## Phase 10 â Profiling Tooling

### Objective

Make performance analysis easy and repeatable.

### Dependencies

```bash
pnpm add -D clinic 0x
```

### Tasks

Add scripts for profiling:

```json
{
  "profile:index:clinic": "clinic flame -- node ./benchmarks/perf-index.mjs",
  "profile:query:clinic": "clinic doctor -- node ./benchmarks/perf-query.mjs",
  "profile:index:0x": "0x -- node ./benchmarks/perf-index.mjs",
  "profile:query:0x": "0x -- node ./benchmarks/perf-query.mjs"
}
```

Adapt to the actual runtime and CLI entry points.

Document:

```text
how to profile cold indexing
how to profile warm refresh
how to profile query_code
where generated reports are written
how to compare before/after dependency changes
```

### Acceptance Criteria

```text
- Profiling commands are available through package scripts.
- Docs explain when to use Clinic versus 0x.
- Generated profiling artifacts are gitignored.
```

---

## Configuration Additions

Add or extend config with performance-related settings.

Suggested shape:

```json
{
  "performance": {
    "fileDiscovery": "fdir",
    "hashAlgorithm": "xxhash64",
    "fileProcessingConcurrency": "auto",
    "workerPool": {
      "enabled": false,
      "maxWorkers": "auto"
    }
  },
  "watch": {
    "backend": "auto",
    "debounceMs": 150
  },
  "limits": {
    "maxFilesDiscovered": 100000,
    "maxFileBytes": 250000,
    "maxChildProcessOutputBytes": 1000000,
    "maxLiveSearchMatches": 100
  }
}
```

All settings should have safe defaults.

## Documentation Updates

Update the README or add:

```text
docs/performance.md
```

The docs should explain:

```text
which dependencies are used
which performance paths they affect
how to run benchmarks
how to run profilers
how to disable worker mode
how watch backend fallback works
why xxHash is used only for non-security fingerprints
why SQLite writes remain single-threaded
```

## Final Acceptance Criteria

The implementation is complete when:

```text
- Baseline and after-change performance benchmarks are available.
- File discovery uses or can use `fdir`.
- Path filtering uses centralized compiled glob matching.
- Routine change detection can use xxHash.
- File processing supports bounded concurrency.
- SQLite writes remain single-writer and transactional.
- Worker-pool parsing is optional and benchmarked before being enabled by default.
- Watch mode can use `@parcel/watcher` with fallback.
- Profiling scripts exist for index and query paths.
- Tests cover path safety, ignore behavior, determinism, concurrency, and fallbacks.
- Documentation explains the new dependencies and performance workflow.
```

## Recommended PR Breakdown

```text
PR 1: Baseline performance benchmarks and profiling scripts
PR 2: fdir file discovery and picomatch path matching
PR 3: xxHash fingerprinting and hashing policy
PR 4: p-map bounded file-processing concurrency
PR 5: Optional Piscina worker-pool file analysis
PR 6: @parcel/watcher watch backend
PR 7: Optional ripgrep fallback and serialization optimizations
```

## Suggested First PR Scope

Start with:

```text
- benchmark harness
- fdir discovery adapter
- picomatch path matcher
- deterministic discovery tests
```

Do not start with worker threads. Worker pools are likely valuable, but they should be justified by the baseline benchmark and introduced after the file discovery and hashing paths are already measured.
