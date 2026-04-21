# ai-context-engine-parser-replacement-spec.md

## Status

Proposed on 2026-04-21.

This spec replaces the current Tree-sitter-based JavaScript and TypeScript
parsing path in `@playground/ai-context-engine` with a JS/TS-specific Rust
parser stack exposed through Node bindings.

## 1. Decision

Replace the current JS/TS parsing layer with:

- [`oxc-parser`](https://oxc.rs/docs/guide/usage/parser) as the primary
  JavaScript / TypeScript / JSX / TSX parser
- [`oxc-resolver`](https://oxc.rs/docs/guide/usage/resolver) as the primary
  Node-compatible import resolution layer

Do **not** adopt `@swc/core` as a runtime dependency for this slice.

Tree-sitter should remain available as a temporary fallback during migration,
but only behind the parser facade and only for concrete parse failures or
unsupported constructs. Tree-sitter should be removed from the
`@playground/ai-context-engine` runtime path once the Oxc-based parser path
reaches feature parity for the current package scope.

## 2. Why This Change

The current engine has already crossed the point where Tree-sitter is helping
less than it is hurting for the actual scope of this package.

Observed locally in this repo:

- the current Node Tree-sitter path throws `Invalid argument` on larger TS
  files such as `src/storage.ts`
- the package now needs chunking and overlap logic to work around that binding
  limit
- those workarounds introduce correctness complexity around chunk boundaries

That is the wrong complexity profile for an engine whose current supported
languages are only:

- `ts`
- `tsx`
- `js`
- `jsx`

The package is not currently getting meaningful value from Tree-sitter's
language-generic abstraction, because the product scope is still JS/TS-only in
practice.

## 3. Primary Source Basis

### 3.1 Oxc

The official Oxc parser docs describe `oxc-parser` as:

- production ready
- able to parse `.js(x)` and `.ts(x)`
- exposed as a Node binding
- returning ESM information directly

Sources:

- https://oxc.rs/docs/guide/usage/parser
- https://oxc.rs/docs/guide/benchmarks
- https://oxc.rs/docs/guide/what-is-oxc

The official Oxc resolver docs describe `oxc-resolver` as:

- Node.js CJS and ESM path resolution
- aligned with webpack/enhanced-resolve behavior
- exposed as a Node binding

Sources:

- https://oxc.rs/docs/guide/usage/resolver
- https://oxc.rs/docs/contribute/resolver

### 3.2 SWC

SWC remains a credible fast Rust-based parser and compiler platform, and
`@swc/core` exposes `parse`, `parseSync`, `parseFile`, and `parseFileSync`.

Sources:

- https://swc.rs/docs/usage/core
- https://swc.rs/
- https://rustdoc.swc.rs/swc_ecma_parser/

However, the current package need is parsing plus import/module resolution for
retrieval, not compilation or transforms. On that narrower problem, Oxc is the
better fit.

## 4. Recommended Dependency Set

### 4.1 Runtime dependencies

Add:

- `oxc-parser`
- `oxc-resolver`

Remove:

- `tree-sitter`
- `tree-sitter-javascript`
- `tree-sitter-typescript`

### 4.2 Not part of the runtime slice

Do not add these yet:

- `@swc/core`
- any Rust FFI wrapper maintained in-repo
- Babel parser

If we later need a transform or print pipeline, that should be a separate
decision. It should not be smuggled into the parsing replacement.

## 5. Why Oxc Over SWC

### 5.1 Oxc fits the actual product surface better

The engine currently needs:

- fast JS/TS parsing
- symbol extraction
- import extraction
- module-resolution support
- predictable Node integration
- benchmark-friendly runtime behavior

Oxc is a better fit because its official surface explicitly includes:

- parser
- resolver
- one coherent JS toolchain

That lets the engine adopt one family of dependencies instead of mixing parser
and resolver choices across ecosystems.

### 5.2 Oxc is the cleaner dependency story

For this package, Oxc lets us say:

- parser comes from Oxc
- resolver comes from Oxc
- future JS/TS toolchain expansion can stay inside the same ecosystem

SWC would be reasonable if the package immediately needed:

- transforms
- code generation
- broader compiler-pipeline behavior

That is not the current need.

### 5.3 Tree-sitter chunking is already a warning sign

We have already had to add chunking logic to compensate for current parser
failure behavior on larger files. Even if overlap-aware chunking works, it is
still a workaround around the wrong parser foundation for this scope.

The design goal should be:

- one parse of one file
- one AST
- one symbol extraction pass

not:

- chunk large file
- overlap chunks
- assign ownership
- dedupe chunk-level symbols

## 6. Scope Of The Replacement

### 6.1 In scope

Replace the parsing implementation used by:

- `indexFile`
- `indexFolder`
- watch-mode reindexing
- import extraction
- symbol extraction
- summary/signature extraction inputs

Preserve the current storage and retrieval model:

- SQLite schema shape
- persisted file/content blobs
- byte-offset-based exact retrieval
- CLI and MCP surface

### 6.2 Out of scope

This spec does not redesign:

- ranking
- context bundle assembly
- diagnostics semantics
- watcher architecture
- benchmark policy

Those can all remain while the parser backend changes.

## 7. New Parsing Contract

The replacement parser layer should expose a package-local interface that keeps
the rest of the engine insulated from parser choice.

### 7.1 Required outputs

For each indexed file, the parser layer must still return:

- `language`
- `contentHash`
- `symbols`
- `imports`

Each symbol must still include:

- stable symbol id
- name
- qualified name when applicable
- kind
- signature
- summary source input
- `startLine`
- `endLine`
- `startByte`
- `endByte`
- exported signal

### 7.2 Required behavioral guarantees

The new parser path must:

- parse a file in one pass
- not rely on chunk splitting for large-file correctness
- support `.js`, `.jsx`, `.ts`, and `.tsx`
- preserve exact source retrieval using stored offsets into the persisted file
  content
- surface imports robustly enough to keep current dependency expansion working

### 7.3 Fallback contract during migration

During migration only, the parser facade may fall back to Tree-sitter when:

- Oxc throws for a specific file
- Oxc does not support a construct we need to index correctly
- Oxc span data proves insufficient for exact retrieval on a specific file

That fallback must follow these rules:

- fallback happens inside `src/parser.ts`, not in storage or indexing code
- fallback is per-file, not a global mode switch
- fallback use must be observable in diagnostics or benchmark output
- fallback use must be counted so we can drive it to zero
- no feature may require both parsers to cooperate on the same file in normal
  operation

If a design requires mixing Oxc partial output with Tree-sitter partial output
for the same file in the steady state, that design should be treated as too
spaghetti-sloppy and rejected.

## 8. Architecture Changes

### 8.1 New parser module split

Replace the current monolithic Tree-sitter parser implementation with:

- `src/js-parser.ts`
  Purpose:
  Oxc-backed JS/TS parse and symbol extraction

- `src/js-resolver.ts`
  Purpose:
  Oxc-backed module-resolution helpers where import resolution needs to move
  beyond current file-path heuristics

- `src/parser.ts`
  Purpose:
  thin engine-facing facade; no direct Tree-sitter logic

### 8.2 Parser abstraction

`src/parser.ts` should become a backend facade with a shape like:

```ts
export type ParserBackend = "oxc" | "tree-sitter";

export interface ParsedFile {
  language: SupportedLanguage;
  contentHash: string;
  symbols: ParsedSymbol[];
  imports: ParsedImport[];
  backend: ParserBackend;
  fallbackUsed: boolean;
  fallbackReason: string | null;
}

export function parseSourceFile(input: {
  relativePath: string;
  content: string;
  language: SupportedLanguage;
  summaryStrategy?: SummaryStrategy;
}): ParsedFile;
```

The engine should not care whether the implementation is Oxc, SWC, or anything
else.

The one exception is observability: diagnostics and benchmark code may read
`backend`, `fallbackUsed`, and `fallbackReason` so the migration can be
measured and driven to completion.

## 9. Symbol Extraction Strategy With Oxc

### 9.1 Top-level declarations

Map Oxc AST nodes to the current engine symbol kinds:

- function declarations → `function`
- class declarations → `class`
- class methods → `method`
- variable declarations with named declarators → `constant`
- interfaces / type aliases / enums → `type`

### 9.2 Qualified names

Preserve current behavior:

- top-level declarations use plain symbol name
- class members use `ClassName.methodName`

### 9.3 Byte and line offsets

The replacement backend must use parser-provided spans from one AST pass.

This is a hard requirement because exact retrieval depends on persisted offsets.
If any candidate parser cannot provide reliable source spans for this purpose, it
is not acceptable as the engine parser.

### 9.4 Imports

Use Oxc parse output for import extraction first.

For path resolution:

- keep current lightweight path heuristics initially if they remain correct
- adopt `oxc-resolver` when moving import resolution from lexical extraction to
  actual Node-compatible resolution

This means parser replacement and resolver replacement can be staged, but both
should stay inside the Oxc family.

## 10. Migration Plan

### Phase 1: Introduce the new backend behind the existing facade

- add `oxc-parser`
- add `oxc-resolver`
- implement Oxc-backed `parseSourceFile`
- keep Tree-sitter as a parser-facade fallback only
- keep storage, CLI, MCP, and benchmark surfaces unchanged

Acceptance:

- all current parser-facing tests pass
- large files no longer require chunk-based fallback logic
- fallback activation is measurable per file
- benchmark output includes backend and fallback metadata for parser-facing tasks

### Phase 2: Remove Tree-sitter-specific logic

- drive fallback count to zero on the benchmark and supported package corpus
- delete Tree-sitter dependency imports
- delete chunking / overlap / ownership logic added as a workaround
- remove Tree-sitter runtime packages from `package.json`

Acceptance:

- no runtime dependency on Tree-sitter remains in the package
- no supported benchmark task requires Tree-sitter fallback

### Phase 3: Tighten import resolution with Oxc resolver

- replace current import-path heuristics where beneficial
- ensure alias and extension resolution remain correct for the package scope

Acceptance:

- current import-related behavior tests stay green
- resolver behavior is at least as correct as the current heuristic path

## 11. Benchmark Requirements

The parser replacement is only good if it improves both correctness and the
benchmark story.

The existing in-process benchmark should be used to compare before and after for:

- parser latency on `src/types.ts`
- parser latency on `src/storage.ts`
- `indexFile("src/storage.ts")`
- `indexFolder` on a clean package copy
- `searchSymbols`
- `getSymbolSource`
- `getRankedContext`

The benchmark should also report:

- whether fallback was used
- how many files required fallback
- which benchmark task triggered fallback

### 11.1 Required benchmark outcomes

Minimum required outcomes:

- `src/storage.ts` must not benchmark as fallback / empty parse
- no chunk-boundary workaround should be needed for large-file correctness
- parser latency for `src/storage.ts` should be competitive with or better than
  the current overlap-chunk workaround
- retrieval token-savings metrics should remain stable or improve
- fallback count should trend toward zero across supported package benchmarks

### 11.2 Comparison tasks against other tools

The benchmark output should be shaped so it can later be compared with tools
such as jcodemunch on the same task cards.

That means benchmark records should keep:

- task id
- retrieval path used
- latency
- result token estimate
- naive baseline token estimate
- token savings
- backend used
- fallback used

## 12. Risks

### 12.1 AST rewrite cost

Replacing Tree-sitter means rewriting symbol extraction logic against a new AST.
That cost is real, but it is bounded because the package only supports one
language family today.

### 12.2 Import extraction drift

Import extraction and path resolution may change subtly during migration. That
needs explicit regression tests.

### 12.3 Scope creep into transforms

Once Oxc or SWC is introduced, it will be tempting to add transforms, codegen,
or other compiler behaviors. That should be rejected for this slice.

### 12.4 Dual-parser rot

Allowing fallback creates a real risk that the package quietly becomes a
permanent Oxc-plus-Tree-sitter hybrid with unclear ownership.

That risk is acceptable only if:

- fallback is temporary
- fallback usage is benchmarked and visible
- the parser facade remains the only place that knows about both backends

If fallback logic starts leaking into storage, indexing, watch mode, retrieval,
or benchmark-specific branches, the migration should be considered off track.

### 12.5 False completion risk

It would be easy to declare success once Oxc parses the happy-path files while
quietly leaving Tree-sitter to handle the hard cases forever.

That is not success. A migration with a permanent hidden hard-case fallback is
just a more complex parser stack.

The replacement should therefore be judged on:

- fallback count
- fallback breadth across real files
- whether benchmark-critical tasks still require Tree-sitter

## 13. Rejected Alternatives

### 13.1 Keep Tree-sitter as the primary parser and refine chunking

Rejected because:

- it keeps the current parser failure mode in the core architecture
- it increases boundary-handling complexity
- it optimizes the workaround instead of replacing the weak foundation

### 13.1.1 Tree-sitter as a temporary fallback rail

Accepted only as a migration safety mechanism, not as the target design.

### 13.2 Switch to SWC now

Rejected for this slice because:

- it is broader than needed for the immediate problem
- the engine currently needs parser + resolver more than compiler transforms
- Oxc provides a cleaner single-family dependency story for the current scope

### 13.3 Build a Rust sidecar or custom native service now

Rejected because:

- it adds deployment and maintenance complexity too early
- Node bindings are enough for the current package stage
- the first step should be parser-family replacement, not process architecture

## 14. Stop Conditions

Pause or abort the replacement slice if any of these become true:

1. The parser facade needs more than one backend-specific code path per file
   kind to keep behavior correct.
2. Storage, indexing, watch mode, or retrieval begin branching on parser backend
   in normal operation.
3. Fallback remains required for benchmark-critical tasks after the migration
   phases that are supposed to remove it.
4. Oxc-backed symbol extraction cannot preserve stable source spans needed for
   exact retrieval.
5. The implementation starts requiring parser-specific repair logic that is as
   complex as the chunking workaround it is replacing.

If any stop condition is hit, re-evaluate before continuing. The likely next
decision would be either:

- simplify the migration scope further, or
- move to SWC as the alternative JS/TS parser family

## 15. Recommendation

Proceed with:

1. `oxc-parser`
2. `oxc-resolver`
3. temporary Tree-sitter fallback inside the parser facade only
4. Tree-sitter removal after parity and fallback count reaches zero

Do not add SWC to runtime dependencies for this migration.

If Oxc fails to meet offset correctness or extraction needs in practice, then
re-evaluate SWC as the second-choice parser family. But Oxc is the right first
replacement target for this package.

## 16. Definition Of Done

This spec is complete when the implementation can honestly claim all of the
following:

1. `@playground/ai-context-engine` uses Oxc as the normal JS/TS parser backend.
2. Exact retrieval offsets remain correct for supported files.
3. Benchmark-critical package tasks no longer require Tree-sitter fallback.
4. Benchmark output reports latency, token savings, backend, and fallback use.
5. Tree-sitter-specific chunking and overlap workarounds have been deleted.
6. Tree-sitter runtime dependencies have been removed from the package.

## 17. Note: LRU + Streaming Exploration

One possible future direction is to combine:

- an LRU-style working-set loop for parsed/indexed artifacts
- a continuous or chunked streaming read path for source ingestion

The goal would be to reduce peak memory pressure during indexing and retrieval
without going back to the current correctness problems from parser-driven file
chunking.

This is not part of the current parser replacement slice, but it is worth
keeping in view if memory efficiency becomes the next bottleneck after the
Tree-sitter replacement. The right place to evaluate it is after:

1. Oxc-based single-pass parsing is in place
2. the benchmark harness can compare memory as well as latency and token savings
3. the engine has a clearer distinction between hot working-set data and cold
   persisted retrieval state
