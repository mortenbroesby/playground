# ai-context-engine-rag-improvement-spec.md

## Status

Proposed on 2026-04-22.

This spec captures the findings from comparing `@playground/ai-context-engine`
against Mastra and VoltAgent's RAG patterns.

Current local implementation already includes:

- symbol and text discovery
- exact symbol source retrieval
- ranked context candidates
- bounded context assembly
- token-savings benchmarking

Current gap:

- retrieval primitives exist, but the engine still lacks an explicit retrieval
  pipeline contract of the kind Mastra and VoltAgent expose more clearly

## 1. Purpose

Turn the current `ai-context-engine` retrieval features into a clearer,
first-class code RAG pipeline without losing exact code grounding.

The goal is to improve:

1. retrieval architecture
2. agent-facing retrieval ergonomics
3. citation and provenance clarity
4. benchmarkability

The goal is not to turn the engine into generic document RAG.

## 2. Findings From The Comparison

Compared with Mastra:

- Mastra is stronger on explicit stage boundaries such as retrieve, filter,
  rerank, and tool-based query surfaces
- `ai-context-engine` has the raw ingredients for this, but the stages are
  still partly implicit inside storage-layer functions

Compared with VoltAgent:

- VoltAgent is stronger on runtime ergonomics through always-on retrieval
  versus tool-driven retrieval
- VoltAgent also treats references as an explicit runtime artifact
- `ai-context-engine` exposes exact retrieval, but not yet a clearer retrieval
  mode contract above the tool layer

Where `ai-context-engine` is stronger:

- exact source retrieval is first-class
- code-aware discovery is first-class
- token-savings benchmarking already exists
- retrieval is grounded in code structure, not document chunks alone

Where it is weaker:

- no explicit `retrieve -> rerank -> assemble` contract
- no first-class citation/reference bundle
- no clear `always-on` versus `on-demand` retrieval mode
- no semantic recall layer if lexical and symbol search miss

## 3. Decision

Keep exact code retrieval as the system of truth.

Improve the engine by borrowing:

- Mastra's explicit pipeline boundaries
- VoltAgent's retrieval modes and reference tracking

Do not copy:

- document-first chunk/embed/vector assumptions as the primary model
- opaque string-returning retrievers

## 4. Scope

### 4.1 In scope

- explicit retrieval pipeline interfaces
- structured candidate and citation objects
- clearer ranked retrieval and assembly surfaces
- benchmark updates for pipeline quality
- CLI/MCP surfaces that reflect retrieval mode deliberately

### 4.2 Out of scope

- replacing exact source retrieval with embeddings
- generic document chunking as the primary retrieval unit
- hosted vector services
- broad multi-language redesign beyond the current JS/TS-focused engine scope

## 5. Retrieval Pipeline Contract

Add an explicit retrieval pipeline above the current raw primitives.

Recommended stages:

1. `retrieveCandidates`
2. `rerankCandidates`
3. `assembleContext`
4. `getRetrievalDiagnostics`

### 5.1 Candidate contract

Each candidate should include:

- `symbol`
- `score`
- `reason`
- `sourceKind`
- `selected`
- `retrievalStage`

`sourceKind` should distinguish where the candidate came from, for example:

- `symbol-search`
- `text-search`
- `dependency-expansion`
- `manual-symbol-id`

### 5.2 Assembly contract

The assembled context result should include:

- `query`
- `tokenBudget`
- `candidateCount`
- `selectedCount`
- `usedTokens`
- `truncated`
- `items`
- `references`

Each reference should include:

- `symbolId`
- `filePath`
- `startLine`
- `endLine`
- `reason`
- `score`

## 6. Retrieval Stages

### 6.1 Stage 1: candidate retrieval

The current engine already has candidate sources:

- `search_symbols`
- `search_text`
- explicit `symbolIds`
- import/dependency expansion in bundle assembly

This stage should become explicit and inspectable rather than remaining partly
buried inside context-bundle logic.

### 6.2 Stage 2: reranking

The engine already has ranking behavior through `get_ranked_context`, but it
should become a clear rerank stage over a candidate set.

This rerank stage should support:

- deterministic score composition
- reason strings that explain inclusion
- clear distinction between "candidate retrieved" and "candidate selected"

### 6.3 Stage 3: assembly

Assembly should stay budget-aware and exact-source-based.

The assembled result must:

- preserve exact source snippets
- keep token accounting explicit
- avoid duplicate source where possible
- explain truncation and exclusion clearly

## 7. Retrieval Modes

Borrow VoltAgent's shape here.

Expose two intended usage modes:

1. `always-on retrieval`
   recommended for code-assistant flows that should ground every answer in repo
   context
2. `on-demand retrieval`
   recommended for more general agent flows that may or may not need code
   lookup

This can be expressed through documentation, CLI/MCP entrypoints, or a thin
library-level strategy abstraction. It does not require adopting VoltAgent
itself.

## 8. References And Provenance

Exact code grounding is already a strength. The missing piece is a clearer
provenance contract.

Every assembled retrieval result should make it easy to answer:

1. which symbols were considered
2. which symbols were selected
3. why each selected item was included
4. exactly where each snippet came from

This should be first-class in result shapes, not reconstructed downstream.

## 9. Why Not Copy Document RAG

Mastra and VoltAgent are optimized for general document retrieval patterns.

That is not our primary problem.

For `ai-context-engine`:

- symbol and file boundaries matter more than paragraph chunks
- exact source spans matter more than semantically similar text alone
- deterministic provenance matters more than a convenient text blob

Embeddings or vector search may become useful later for semantic recall, but
they must remain additive to exact retrieval, not a replacement for it.

## 10. Benchmarks And Diagnostics

The benchmark story should evolve with the retrieval pipeline.

Add or preserve reporting for:

- candidate count
- selected count
- dropped-by-budget count
- token savings
- exact source retrieval rate
- citation/reference coverage
- top-1 and top-3 success
- latency by stage when practical

Diagnostics should make retrieval quality visible, not only storage freshness.

## 11. Acceptance Criteria

This spec is done when:

1. the engine exposes an explicit retrieval pipeline contract
2. ranked retrieval is clearly separated from assembly
3. assembled results include first-class references
4. the benchmark can report candidate, selection, and citation quality signals
5. exact source retrieval remains the system of truth
6. CLI and MCP surfaces can support clear always-on or on-demand usage modes

## 12. Non-Goals And Guardrails

Do not:

- degrade exact source retrieval into document-style chunk retrieval
- return only opaque text blobs from the retrieval surface
- make embeddings mandatory for the main path
- let fallback semantic retrieval obscure provenance

If a future semantic layer is added, it should feed candidate generation or
reranking and then hand off to exact symbol/source retrieval for final context.

## 13. Verification Commands

Expected verification once implemented:

1. `pnpm --filter @playground/ai-context-engine type-check`
2. `pnpm --filter @playground/ai-context-engine test`
3. `pnpm --filter @playground/ai-context-engine bench:small`
4. any focused benchmark-harness workflow checks added for retrieval-pipeline
   metrics
