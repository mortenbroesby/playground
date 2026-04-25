# ai-context-engine-tree-sitter-language-expansion-spec.md

## Status

Proposed on 2026-04-25.

This spec evaluates whether `@playground/ai-context-engine` should leverage
Tree-sitter for files beyond the current JS/TS scope, and defines the
recommended path if the repo chooses to expand language coverage.

## 1. Decision

Use Tree-sitter for non-JS/TS languages only through explicit per-language
adapters behind the existing parser facade.

Do not attempt a generic "support any Tree-sitter grammar" expansion.

Do not replace the current Oxc-first JS/TS path.

If this work is started, the first implementation slice should be a pilot for
one high-value non-JS/TS language with reduced scope:

- file discovery and indexing
- symbol extraction for repo outlines and file outlines
- exact source retrieval for indexed symbols

Cross-language import/dependency expansion and parity with the current JS/TS
ranking path should be deferred until the pilot proves useful.

## 2. Short Answer

This is feasible, but it is not a cheap "install more grammars" task.

The current engine is hard-coded around a JS/TS-shaped parser contract:

- `SupportedLanguage` only includes `ts`, `tsx`, `js`, and `jsx` in
  [tools/ai-context-engine/src/types.ts](/Users/macbook/personal/playground/tools/ai-context-engine/src/types.ts:1)
- file support is extension-gated in
  [tools/ai-context-engine/src/parser.ts](/Users/macbook/personal/playground/tools/ai-context-engine/src/parser.ts:1066)
- indexing expects `parseSourceFile()` to return `symbols`, `imports`, byte
  spans, and a small fixed `SymbolKind` set in
  [tools/ai-context-engine/src/parser.ts](/Users/macbook/personal/playground/tools/ai-context-engine/src/parser.ts:1084)
  and
  [tools/ai-context-engine/src/storage.ts](/Users/macbook/personal/playground/tools/ai-context-engine/src/storage.ts:1031)
- ranking and dependency expansion assume symbol/import data that maps cleanly
  onto the current JS/TS model in
  [tools/ai-context-engine/src/storage.ts](/Users/macbook/personal/playground/tools/ai-context-engine/src/storage.ts:820)
  and
  [tools/ai-context-engine/src/storage.ts](/Users/macbook/personal/playground/tools/ai-context-engine/src/storage.ts:1747)

So the real work is parser-contract expansion plus per-language extraction
logic, not just parser installation.

## 3. Why This Could Be Worth Doing

Tree-sitter is already in the package and already used as the fallback parser
inside the parser facade in
[tools/ai-context-engine/src/parser.ts](/Users/macbook/personal/playground/tools/ai-context-engine/src/parser.ts:998).

That means the repo already has:

- a parser abstraction boundary
- byte/line span handling
- AST traversal patterns for symbol extraction
- existing storage and retrieval surfaces that could benefit from more indexed
  files

If this engine becomes the main MCP navigation layer, non-JS/TS coverage would
improve repo-wide usefulness for:

- Python tooling
- shell scripts
- Go services
- Rust crates
- infrastructure/config-heavy repos that still include source code outside the
  JS/TS slice

## 4. Why This Is Not Free

### 4.1 The language model is fixed today

`SupportedLanguage` is a closed union and propagates into:

- storage schema consumers
- diagnostics language counts
- CLI validation
- retrieval filtering

Relevant files:

- [tools/ai-context-engine/src/types.ts](/Users/macbook/personal/playground/tools/ai-context-engine/src/types.ts:1)
- [tools/ai-context-engine/src/validation.ts](/Users/macbook/personal/playground/tools/ai-context-engine/src/validation.ts:13)
- [tools/ai-context-engine/src/config.ts](/Users/macbook/personal/playground/tools/ai-context-engine/src/config.ts:8)

### 4.2 The symbol taxonomy is also fixed

The engine currently uses a narrow `SymbolKind` union:

- `function`
- `class`
- `method`
- `constant`
- `type`

That is a reasonable fit for JS/TS, but it is not obviously sufficient for
other languages without forcing lossy mappings.

Relevant file:

- [tools/ai-context-engine/src/types.ts](/Users/macbook/personal/playground/tools/ai-context-engine/src/types.ts:25)

### 4.3 Dependency expansion is language-sensitive

The current context-bundle path depends on stored imports and a JS/TS-like file
resolution model in
[tools/ai-context-engine/src/storage.ts](/Users/macbook/personal/playground/tools/ai-context-engine/src/storage.ts:698).

That logic will not generalize cleanly to every Tree-sitter language.

### 4.4 Search/ranking assumes extracted symbols are good

The engine’s ranked retrieval quality depends heavily on symbol signatures,
summaries, export signals, and import-derived dependencies. Weak extraction for
a new language would technically "work" while still degrading the main MCP use
case.

## 5. Recommendation

### 5.1 Recommended path

Implement this only as a staged pilot:

1. expand parser support to one non-JS/TS language
2. keep Oxc-first parsing for JS/TS unchanged
3. add a Tree-sitter-backed adapter for the pilot language
4. support outlines, symbol source, and file content first
5. defer dependency expansion and ranked bundle parity unless the pilot proves
   useful

### 5.2 Explicit non-recommendation

Do not:

- add many grammars at once
- broaden `SupportedLanguage` without extraction tests
- promise cross-language `getContextBundle` parity in the first slice
- turn `parser.ts` into one giant language switch with mixed extraction logic

## 6. Target Architecture

### 6.1 Parser facade stays the boundary

`parseSourceFile()` should remain the only indexing entrypoint from storage in
[tools/ai-context-engine/src/storage.ts](/Users/macbook/personal/playground/tools/ai-context-engine/src/storage.ts:1031).

The parser layer should move toward:

- file extension to language id resolution
- parser backend selection
- language-specific symbol/import extraction adapters
- normalized `ParsedFile` output

### 6.2 New adapter split

The parser layer should distinguish:

- JS/TS adapter backed by Oxc
- JS/TS fallback adapter backed by Tree-sitter
- non-JS/TS adapters backed by Tree-sitter per language

That keeps the current high-confidence JS/TS path isolated from the more
experimental expansion path.

### 6.3 Scope tiers for new languages

Each added language should declare one of these support tiers:

- `outline-only`
  file discovery, file outline, repo outline, exact symbol source
- `retrieval`
  outline-only plus query discovery over indexed symbols
- `context-bundle`
  retrieval plus dependency expansion and ranked assembly

The first non-JS/TS pilot should target `outline-only` or `retrieval`, not
`context-bundle`.

## 7. Pilot Language Criteria

Choose the first language using these filters:

- present in this repo or adjacent repos often enough to matter
- stable Tree-sitter grammar with maintained Node package
- easy top-level symbol extraction
- useful even without full dependency graph parity

Good pilot candidates:

- Python
- Go
- Rust

Less attractive first pilots:

- shell
- SQL
- YAML

Those may still be useful later, but they fit outline/index use cases less
cleanly and tend to produce weaker symbol structures.

## 8. Scope Of A Pilot

### 8.1 In scope

- add one new `SupportedLanguage` value
- recognize the new file extension(s)
- parse the new language with a dedicated Tree-sitter grammar
- extract top-level symbols into existing normalized symbol rows
- support:
  - `index_folder`
  - `index_file`
  - `get_repo_outline`
  - `get_file_tree`
  - `get_file_outline`
  - `query_code` discover/source for the new language

### 8.2 Out of scope

- full import graph parity
- dependency-aware bundle expansion for the new language
- changing SQLite schema shape
- replacing current JS/TS parser choices
- broad multi-language rollout

## 9. Required Refactors Before Or During A Pilot

### 9.1 Language registry

Replace the hard-coded extension switch in
[tools/ai-context-engine/src/parser.ts](/Users/macbook/personal/playground/tools/ai-context-engine/src/parser.ts:1066)
with a registry that can describe per-language:

- file extensions
- parser backend
- extraction adapter
- support tier

### 9.2 Symbol-kind policy

Decide whether to:

- expand `SymbolKind`, or
- keep the current set and define explicit lossy mappings per language

This should be explicit in code and tests, not inferred ad hoc in parser logic.

### 9.3 Import semantics split

The engine should stop assuming every indexed language supports the same import
or dependency semantics. `ParsedFile.imports` may need to become optional or
tiered for languages that only support outlines at first.

## 10. Complexity Estimate

### 10.1 One-language pilot

Medium effort.

Expected work:

- parser facade cleanup
- one grammar dependency
- one extraction adapter
- tests for indexing, outlines, and source retrieval
- docs/spec updates

### 10.2 Multi-language generic rollout

High effort.

Expected work:

- language registry
- symbol taxonomy redesign or strict mapping rules
- import/dependency tiering
- broader query/ranking validation
- benchmark updates
- higher maintenance burden per grammar

## 11. Acceptance Criteria For A Pilot Spec

- one non-JS/TS language is explicitly selected
- the language registry design is named before implementation
- support tier for the pilot language is explicit
- indexing and outline retrieval pass for representative fixture files
- `query_code` discover/source behavior is tested for the pilot language
- dependency-aware bundle parity is either implemented deliberately or declared
  out of scope

## 12. Verification Plan For A Pilot

- `pnpm --filter @playground/ai-context-engine type-check`
- `pnpm --filter @playground/ai-context-engine test -- --run tests/interface.test.ts`
- focused engine tests covering:
  - `indexFolder`
  - `getFileOutline`
  - `queryCode` discover/source
  - exact symbol source spans
- one fixture repo or test fixture file set for the new language

## 13. Recommendation Summary

Tree-sitter for non-JS/TS files is worth exploring, but only as a staged
language-expansion effort behind the parser facade.

The right next step is not "support more grammars." The right next step is:

1. choose one pilot language
2. add a language registry
3. define a support tier
4. ship outline/retrieval support first

That is a reasonable amount of work.

A generic all-languages push would be too much work for the current engine
shape and would likely degrade MCP quality before it improves it.
