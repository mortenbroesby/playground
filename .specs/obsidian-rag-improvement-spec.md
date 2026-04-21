# obsidian-rag-improvement-spec.md

## Status

Proposed on 2026-04-22.

This spec captures the findings from comparing the repo's Obsidian-backed RAG
path against Mastra and VoltAgent.

Current local implementation:

- vault corpus generation from `vault/` via [tools/rag-index.ts](/Users/macbook/personal/playground/tools/rag-index.ts:1)
- deterministic markdown chunking by note and `##` heading
- frontmatter-enriched chunks written to `.rag/`
- lexical verification and scoring in [scripts/verify-obsidian-rag.mjs](/Users/macbook/personal/playground/scripts/verify-obsidian-rag.mjs:1)

Current gap:

- this is an indexed notes corpus with lightweight lexical retrieval, not yet a
  full RAG system in the same class as Mastra or VoltAgent

## 1. Purpose

Upgrade the repo's Obsidian RAG path from a corpus builder plus verifier into a
small, explicit retrieval system for repo memory.

The goal is not to build a generic hosted knowledge base. The goal is to make
repo memory retrieval:

1. structured
2. inspectable
3. benchmarkable
4. easy to plug into agent workflows

## 2. Findings From The Comparison

Compared with Mastra:

- Mastra has explicit `chunk -> embed -> store -> retrieve -> rerank` stage
  boundaries
- our Obsidian RAG currently has `chunk -> serialize -> lexical search`
- Mastra is ahead on retrieval architecture, filtering, and reranking

Compared with VoltAgent:

- VoltAgent exposes retrieval as either always-on or tool-driven
- VoltAgent treats retrieved references as a first-class runtime artifact
- our Obsidian RAG currently has no equivalent runtime retrieval contract

Where our current path is better:

- deterministic
- local-only
- cheap to rebuild
- tailored to repo-memory metadata such as `type`, `repo`, `status`, `summary`,
  and `keywords`

Where our current path is weaker:

- no semantic recall
- no reranking stage
- no structured retrieval API
- no first-class citations surface
- no analytics or retrieval observability beyond the verification script

## 3. Decision

Improve the Obsidian RAG path in small local steps:

1. add a real retrieval contract over the `.rag` corpus
2. add structured references/citations to retrieval results
3. add reranking over lexical candidates
4. only then decide whether embeddings are justified

Do not jump directly to an embeddings or vector-store stack in this slice.

## 4. Scope

### 4.1 In scope

- a package-local retrieval API for Obsidian corpus search
- structured result objects instead of ad hoc string matching
- lexical candidate generation over indexed chunks
- deterministic reranking over those candidates
- reference/citation output
- benchmark and verification improvements for retrieval quality

### 4.2 Out of scope

- hosted or managed vector infrastructure
- automatic document ingestion beyond the existing local vault
- replacing the vault as durable repo memory
- broad agent-framework integration work outside a small retrieval surface
- LLM-based reranking in the first implementation slice

## 5. Retrieval Contract

Add a small retrieval surface above the current corpus files.

Recommended contract:

1. `retrieveMemoryCandidates`
2. `rerankMemoryCandidates`
3. `assembleMemoryContext`
4. `getMemoryDiagnostics`

### 5.1 Candidate shape

Each candidate should include:

- `chunkId`
- `sourceFile`
- `sourcePath`
- `heading`
- `noteType`
- `repoSlug`
- `tags`
- `keywords`
- `summary`
- `score`
- `matchReasons`
- `text`

### 5.2 Context result shape

The assembled result should include:

- `query`
- `candidateCount`
- `selectedCount`
- `truncated`
- `items`
- `references`
- `estimatedTokens`

Each reference should include:

- `sourceFile`
- `sourcePath`
- `heading`
- `noteType`
- `score`

## 6. Retrieval Pipeline

### 6.1 Stage 1: lexical candidate generation

Use the existing strengths of the corpus:

- path token matches
- exact phrase matches
- keyword matches
- summary matches
- frontmatter boosts such as `type: repo-decision` for decision-oriented
  queries

This is already partially present in
[scripts/verify-obsidian-rag.mjs](/Users/macbook/personal/playground/scripts/verify-obsidian-rag.mjs:1),
but it should move into a reusable retrieval module rather than living only in
verification code.

### 6.2 Stage 2: deterministic reranking

Rerank lexical candidates using repo-memory-specific signals:

- exact query phrase in chunk text
- exact match in heading
- query token density
- note-type affinity
- recency when `type` or date metadata matters
- path and repo affinity

This rerank stage should stay deterministic and local in the first slice.

### 6.3 Stage 3: context assembly

Assemble a bounded result with:

- selected chunk text
- source references
- token accounting
- truncation reporting

This should be the equivalent of a lightweight memory bundle, not raw corpus
dumping.

## 7. Retrieval Modes

Borrow the shape, not the infrastructure, from VoltAgent.

Expose two intended usage modes:

1. `always-on memory retrieval`
   use when answering architecture/history/decision questions
2. `on-demand memory retrieval`
   use when an agent chooses to consult memory selectively

This does not require a framework dependency. It only requires the retrieval
surface to make those two modes possible.

## 8. Why Not Add Embeddings First

Embeddings may help later, but they are not the right first move.

Reasons:

- the current corpus is already metadata-rich and can support stronger lexical
  retrieval first
- deterministic retrieval is easier to validate and debug
- embeddings would add complexity before we have a clean retrieval contract
- many repo-memory queries are title/path/type-sensitive, where lexical and
  metadata signals already matter a lot

Embeddings become justified only if, after lexical retrieval plus reranking:

- recall is still materially weak
- the benchmark shows repeated misses on semantically phrased queries
- metadata-aware lexical search is no longer the dominant quality bottleneck

## 9. Benchmarks And Verification

The current verification script proves that indexing works and a few retrieval
queries land. That is not enough once retrieval becomes a real surface.

Add verification for:

1. candidate generation correctness
2. rerank ordering on seeded queries
3. citation/reference completeness
4. token-bounded context assembly
5. deterministic results across repeated runs on the same corpus

Add benchmark reporting for:

- candidate count
- top-1 hit
- top-3 hit
- retrieved token count
- token reduction versus reading full matched notes
- reference count
- latency

## 10. Acceptance Criteria

This spec is done when:

1. the Obsidian RAG path exposes a reusable retrieval API instead of only a
   corpus generator and verifier
2. retrieval results include structured references
3. deterministic reranking exists and is covered by tests
4. a bounded context assembly path exists for repo-memory responses
5. verification covers both retrieval success and reference correctness
6. the retrieval path remains local-only and deterministic

## 11. Non-Goals And Guardrails

Do not:

- introduce hosted RAG infrastructure in this slice
- replace the vault with a vector database as the system of record
- make this dependent on external APIs
- return unstructured blob strings as the only retrieval output
- conflate repo-memory retrieval with code retrieval

The Obsidian RAG path should remain the repo-memory layer. It should improve in
quality and structure without turning into a generic knowledge-base platform.

## 12. Verification Commands

Expected verification once implemented:

1. `pnpm rag:index --json`
2. `pnpm rag:verify`
3. targeted tests for the new retrieval module
4. markdown/spec lint if the repo adds a spec-only check
