# graphify-integration-design.md

## Status

Proposed on 2026-04-22.

This design doc evaluates whether
[`safishamsi/graphify`](https://github.com/safishamsi/graphify) should improve
or replace parts of the repo's current retrieval stack.

Primary sources reviewed:

- Graphify README:
  <https://github.com/safishamsi/graphify/blob/v4/README.md>
- Graphify repository overview:
  <https://github.com/safishamsi/graphify>

Current local systems in scope:

- Obsidian repo-memory RAG:
  [tools/rag-index.ts](/Users/macbook/personal/playground/tools/rag-index.ts:1)
- Code retrieval engine:
  [packages/ai-context-engine](/Users/macbook/personal/playground/packages/ai-context-engine/README.md:1)

## 1. Executive Summary

`graphify` is strong enough to justify an experiment, but not strong enough to
become the primary retrieval engine for this repo today.

Recommended decision:

1. use `graphify` as an optional sidecar graph layer first
2. target the Obsidian and mixed-doc memory path before the code engine
3. do not replace `ai-context-engine` exact symbol/source retrieval with
   `graphify`
4. only consider replacing pieces after a benchmark-backed comparison

The right frame is:

- `graphify` for relationship discovery, graph traversal, and mixed-corpus
  synthesis
- our existing systems for deterministic exact retrieval and repo-owned storage

## 2. What Graphify Actually Provides

Confirmed from the upstream README:

- local graph build from folders containing code, docs, PDFs, images, video,
  and audio
- persistent outputs including `graph.json`, `GRAPH_REPORT.md`, and
  `graph.html`
- deterministic AST extraction for code
- semantic extraction for docs, papers, images, and transcripts through the
  underlying assistant/model platform
- relationship labels marked `EXTRACTED`, `INFERRED`, or `AMBIGUOUS`
- local query commands such as `graphify query`, `graphify path`, and
  `graphify explain`
- MCP server mode via `--mcp`
- optional Obsidian export via `--obsidian`
- incremental update and watch modes

Inference from those sources:

- the most valuable thing for this repo is not its HTML graph or report, but
  the persistent graph artifact plus explicit relationship typing
- the most risky thing is that its semantic layer is not purely deterministic,
  because it uses upstream model APIs for non-code extraction

## 3. Current Problem Split In This Repo

We do not have one RAG system. We have two:

### 3.1 Obsidian repo-memory RAG

Current shape:

- local markdown corpus
- heading-based chunking
- frontmatter metadata
- lexical retrieval verification

Current weakness:

- weak relationship modeling
- no graph traversal
- no explicit inferred-versus-extracted distinction

### 3.2 `ai-context-engine`

Current shape:

- exact code indexing
- symbol/text discovery
- exact source retrieval
- ranked bounded context assembly

Current weakness:

- relationship navigation is still narrower than it should be
- retrieval architecture is less explicit than best-in-class RAG toolkits

## 4. Fit Assessment

## 4.1 Strong fit: Obsidian and mixed-doc memory

`graphify` is a strong fit here because:

- it already handles docs, markdown, PDFs, images, and mixed corpora
- it explicitly models relationships instead of just chunk retrieval
- it distinguishes extracted versus inferred edges
- it can create a persistent graph without requiring hosted infrastructure

This aligns with the memory-side need to answer:

- what decisions connect to this architecture note
- what sessions touched this workflow
- what concepts recur across notes and docs

## 4.2 Weak fit: exact code retrieval replacement

`graphify` is a weak fit as a direct replacement for `ai-context-engine`
because:

- our code engine depends on exact symbol/source retrieval as the truth layer
- `graphify` is optimized for graph structure and cross-artifact relationships,
  not exact snippet retrieval contracts
- its code extraction is tree-sitter-based, while we intentionally moved
  `ai-context-engine` away from tree-sitter
- it is a Python-first toolchain rather than a TypeScript-native library

## 4.3 Medium fit: code graph sidecar

`graphify` may still help the code engine as a sidecar if used for:

- relationship discovery
- shortest-path exploration
- architectural clustering
- rationale extraction across docs and code together

This would be additive to `ai-context-engine`, not a replacement for it.

## 5. Replacement Options

## 5.1 Option A: do not use graphify

Pros:

- simplest stack
- no Python dependency
- no new graph artifact ownership

Cons:

- we miss a ready-made graph layer
- we keep rebuilding relationship logic ourselves

## 5.2 Option B: use graphify for Obsidian/memory only

Pros:

- highest fit
- lowest risk
- gives us graph traversal and richer relationship discovery for memory
- does not threaten exact code retrieval

Cons:

- introduces another artifact pipeline
- creates some overlap with `.rag/`

## 5.3 Option C: use graphify as a sidecar for both memory and code

Pros:

- unified graph across notes, docs, and code
- opens graph-based retrieval experiments
- could improve “why” and architecture-question retrieval

Cons:

- more moving parts
- higher maintenance burden
- risk of confusing graph traversal with exact retrieval

## 5.4 Option D: replace major parts of `ai-context-engine` with graphify

Pros:

- faster path to broad graph semantics

Cons:

- wrong truth model for exact source retrieval
- Python runtime mismatch
- tree-sitter parser mismatch
- unclear runtime API stability for our package contract

Decision:

- reject Option D
- prefer Option B first
- consider Option C only after successful benchmarking

## 6. Recommended Architecture

### 6.1 Keep existing owned systems

Retain:

- `.rag/` as the repo-owned portable Obsidian corpus
- `ai-context-engine` as the repo-owned exact code retrieval layer

### 6.2 Add graphify as an optional graph sidecar

Recommended artifact location:

- `graphify-out/` for upstream-standard graph outputs

Recommended corpus targets:

1. `vault/`
2. selected repo docs and specs
3. later, an optional mixed `vault + docs + code` experiment

### 6.3 Introduce a small adapter rather than hard coupling

Do not make internal runtime code depend directly on `graphify` command output
format everywhere.

Instead, add one narrow adapter layer that can:

1. detect whether `graphify-out/graph.json` exists
2. load graph nodes and edges into a repo-owned result shape
3. surface graph evidence separately from exact retrieval evidence

This keeps removal or replacement possible.

## 7. What To Replace Versus What To Keep

### 7.1 Obsidian RAG

Can be improved or partially replaced by `graphify` in these areas:

- concept/relationship extraction
- graph traversal
- related-note discovery
- mixed-corpus reasoning across markdown and other artifact types

Should not be replaced by `graphify` in these areas:

- repo-owned corpus indexing contract
- deterministic frontmatter extraction
- simple lexical fallback retrieval

Recommended end state:

- keep `.rag/` as the canonical corpus
- optionally enrich memory retrieval with graph-derived candidates and edges

### 7.2 `ai-context-engine`

Can be improved by `graphify` in these areas:

- graph-based hints
- relationship expansion
- architectural cluster suggestions
- cross-file rationale discovery when docs and code interact

Should not be replaced by `graphify` in these areas:

- parser/index storage
- exact symbol lookup
- exact source retrieval
- token-budgeted source assembly

Recommended end state:

- `ai-context-engine` remains the exact retrieval system
- `graphify` may become an optional graph enrichment source

## 8. Retrieval Model With Graphify In The Stack

If adopted, retrieval should work like this:

1. exact retrieval first when the query is code-specific
2. graph expansion second when the user needs relationships, rationale, or
   mixed-corpus context
3. memory graph retrieval first when the question is architectural or
   historical
4. all graph-derived evidence must remain visibly distinct from exact-source
   evidence

This is the most important guardrail.

Graph evidence can guide or enrich. It must not silently pretend to be exact.

## 9. Benchmark Plan

Before any deeper adoption, benchmark `graphify` against our current systems.

### 9.1 Obsidian/memory benchmark

Compare:

1. current `.rag` lexical retrieval
2. current `.rag` plus rerank if we build it
3. `graphify` query/path retrieval on the same vault corpus

Measure:

- top-1 hit
- top-3 hit
- citation/reference quality
- token savings
- latency
- extracted versus inferred evidence ratio

### 9.2 Code benchmark

Compare:

1. `ai-context-engine` exact workflows
2. `graphify` query/path workflows
3. combined workflows where graphify only seeds relationships

Measure:

- exact target hit rate
- exact source retrieval rate
- token savings
- false-positive relationship rate

`graphify` only deserves deeper code-engine adoption if it improves query
success without degrading exactness.

## 10. Operational Costs

Expected costs:

- Python dependency management
- another artifact directory in the repo
- more indexing/update steps
- more benchmark surface area
- some overlap with existing local RAG tooling

Expected benefits:

- mixed-corpus graph relationships without building them from scratch
- explicit extracted versus inferred evidence
- graph traversal and shortest-path retrieval
- fast experimentation without committing core engine code to a new graph model

## 11. Decision And Phased Plan

### Phase 1: evaluation only

1. run `graphify` on `vault/`
2. inspect `graph.json` quality and query behavior
3. benchmark it against current Obsidian retrieval

### Phase 2: memory-side sidecar

1. add a repo-owned adapter over `graphify-out/graph.json`
2. expose graph-derived references for memory queries
3. keep `.rag/` as fallback and canonical corpus

### Phase 3: optional mixed-corpus experiment

1. run `graphify` on `vault/ + docs/ + selected code`
2. test whether graph traversal improves architecture and rationale questions

### Phase 4: code-side enrichment only if earned

1. let graph outputs seed candidate relationships
2. hand off final retrieval to `ai-context-engine`

Do not skip directly to Phase 4.

## 12. Recommendation

Adopt `graphify` only as an experiment-first, optional graph sidecar.

Recommended concrete choice:

1. yes for Obsidian/memory evaluation
2. maybe later for mixed-corpus enrichment
3. no as a direct replacement for `ai-context-engine`

That gives us the upside of graph-based retrieval without collapsing the repo's
exact retrieval guarantees into a graph tool that was not designed to own them.

## 13. Verification

If this design proceeds, the first validation should be:

1. run `graphify` on the vault corpus
2. capture representative query results
3. compare against current `pnpm rag:verify` behavior
4. document whether graph edges improve real memory retrieval enough to justify
   the extra stack complexity
