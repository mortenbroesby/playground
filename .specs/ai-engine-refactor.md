# Agent Spec — AI Context Engine Improvement Program

## Mission

Improve `tools/ai-context-engine` so it is easier to validate, easier to debug, safer on local repositories, and better at returning relevant context for coding agents.

The implementation should prioritize measurement first, then retrieval quality, then indexing scalability.

## Scope

Work inside:

tools/ai-context-engine

Inspect the existing README, package scripts, CLI, MCP contract, storage/indexing code, parser code, tests, and benchmarks before making changes.

## Primary goals

1. Add a retrieval-quality benchmark harness.
2. Add a `doctor` command.
3. Improve JS/TS parser coverage and parser diagnostics.
4. Add graph-aware retrieval to `query_code`.
5. Add schema migrations and stronger incremental indexing.
6. Expand config, privacy, observability, and result limits.
7. Update docs and tests.

## Execution order

### Phase 1 — Measurement

Add golden retrieval fixtures and a benchmark runner.

The benchmark must evaluate realistic queries against expected files/symbols and report recall-like metrics, token use, ranking quality, and latency where practical.

Add at least 5 golden queries.

### Phase 2 — Developer experience

Add:

ai-context-engine doctor --repo .
ai-context-engine doctor --repo . --json

Doctor output should report repo root, storage path, index status, schema version, freshness, indexed file/symbol/import counts, parser fallback rate, observability status, warnings, and suggested actions.

### Phase 3 — Parser coverage

Improve symbol extraction for common JS/TS constructs:

- named exports
- default exports
- re-exports
- classes
- constructors
- methods
- getters/setters
- class fields
- object methods
- object arrow functions
- namespaces where practical

Add parser golden tests.

Expose parser health in diagnostics.

### Phase 4 — Graph-aware retrieval

Persist or derive relationship edges:

- file imports file
- file imports symbol
- file exports symbol
- file re-exports file
- symbol declared in file
- reverse importer edges

Extend `query_code` so users can request relationship-aware retrieval with options such as relation depth, include dependencies, include importers, and include references.

Every returned result should include explanation reasons such as exact_symbol_match, text_match, imports_matched_file, imported_by_match, or reexport_match.

Respect token budgets and max-result limits.

### Phase 5 — Incremental indexing and migrations

Add explicit schema versioning and a migration runner.

Track per-file content hash, symbol signature hash, import hash, size, and mtime where useful.

Skip unchanged files during refresh.

Handle deleted and renamed files cleanly.

Invalidate dependent graph edges when imports or exports change.

### Phase 6 — Config, privacy, and packaging

Expand config support for:

- index include/exclude
- max file size
- ranking weights
- watch debounce
- observability redaction
- storage mode
- result limits

Make observability privacy-safe by default.

Enforce source-byte, file-count, symbol-count, and child-process-output limits.

Add non-blocking warnings for obvious secret-like source content.

Clarify package intent in docs and package metadata.

## Acceptance criteria

The project is improved when:

- Existing tests pass.
- New tests cover benchmark harness, doctor command, parser fixtures, graph traversal, migrations, incremental refresh, config defaults, and privacy limits.
- A developer can run a retrieval benchmark from one command.
- `doctor` gives useful output even before indexing.
- `query_code` can explain why it returned each result.
- Exact symbol/path matches are not buried by graph expansion.
- Token budgets are respected.
- Sensitive source text is not logged by default.
- Documentation explains the new commands and config options.

## Constraints

Do not require network access.

Do not introduce unbounded graph traversal.

Do not return files outside the repo root.

Do not silently ignore stale index corruption; report it and suggest a rebuild.

Do not make publishing changes unless package intent is clear.
