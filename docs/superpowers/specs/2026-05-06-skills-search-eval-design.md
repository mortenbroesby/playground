# Skills Search Evaluation Design

**Date:** 2026-05-06
**Status:** Implemented and Evolved

## Goal

Improve the readability and reliability of `tools/agent-skills` search and
routing logic without blindly adding dependencies. Keep the current custom
system in the short term, then run a small, measurable prototype to determine
whether `minisearch` is a real improvement.

## Recommendation

Short term:

- keep the custom search/routing system
- cache the search index
- split the text-search logic out of the main routing file
- remove implicit source-body fallback from default search behavior
- add relevance eval fixtures

Medium term:

- prototype `minisearch` behind the current CLI
- compare it against the current custom system with `tinybench`
- compare both result quality and code size before deciding whether to adopt it

Current state:

- the search corpus, benchmark harness, and MiniSearch implementation now
  exist
- `skills:search` uses MiniSearch as the only supported search engine
- routing no longer uses the BM25 layer either; the runtime is now MiniSearch
  plus repo-specific query mapping and policy logic

## Background

The current `agent-skills` runtime already works and is small enough to reason
about, but the main routing file bundles several concerns together:

- tokenization and normalization
- query expansion and lightweight stemming
- BM25 indexing
- metadata scoring
- routing policy
- rule and note injection

That makes the system harder to tune than it needs to be. At the same time, the
catalog is small enough that we do not need a heavyweight search stack yet.
Because of that, the next move should be evidence-driven rather than a
dependency-first rewrite.

## Scope

In scope:

- refactor search-related code into smaller modules
- keep CLI behavior stable unless explicitly improved
- add an evaluation corpus for search/routing relevance
- add a benchmark harness for comparing implementations
- prototype `minisearch` for `skills:search`

Out of scope:

- replacing the routing policy model (`group + tier`)
- changing the checked-in skill metadata contract
- changing `skills:read` source-backed behavior
- introducing embeddings, vector search, or remote services

## Short-Term Design

### 1. Keep the custom system

The current custom system stays as the source of truth for search and route
behavior during this phase.

Rationale:

- the current catalog is small
- the system is already explainable
- refactoring and measurement will produce cleaner decision-making than a direct
  swap

### 2. Split text-search logic from routing logic

Move reusable search internals into a dedicated module boundary. The target
shape is:

- `src/lib/skills-text-search.ts`
  - normalization
  - tokenization
  - query expansion
  - BM25 model construction
  - text/list scoring helpers
- `src/lib/skills-routing.ts`
  - metadata scoring orchestration
  - tier gating
  - list/search/route ranking policy
  - route-specific rule and note injection

This should reduce the surface area of `skills-routing.ts` and make later
experiments easier to isolate.

### 3. Cache the search index

The BM25 index should not be rebuilt from scratch for every search and route
call inside the same process when the registry array is unchanged.

Preferred short-term approach:

- cache the built model by registry array identity in-process
- avoid any filesystem cache or persisted index
- keep invalidation trivial by rebuilding only when a new registry load occurs

This keeps the behavior deterministic and removes unnecessary repeated work
without introducing hidden state.

### 4. Remove magic fallback from default search

`skills:search` should be metadata-first and predictable by default.

Target behavior:

- `pnpm skills:search <query>`:
  - search only metadata-backed fields and ranking logic
  - return non-zero when metadata yields no match
- `pnpm skills:search --content <query>`:
  - allow fallback to source-body content scans
  - label those results explicitly as content fallback

Rationale:

- default search should stay explainable
- hidden fallback to arbitrary prose weakens confidence in why a result matched
- explicit `--content` keeps the broader escape hatch available

### 5. Add relevance eval fixtures

Introduce a checked-in fixture corpus that makes search quality measurable.

Suggested file:

- `tools/agent-skills/tests/fixtures/search-evals.json`

Suggested schema:

```json
[
  {
    "query": "fix failing test",
    "expected_top_1": "debugging-and-error-recovery",
    "expected_top_3": [
      "debugging-and-error-recovery",
      "test-driven-development"
    ],
    "forbidden": [
      "gh-stack"
    ]
  }
]
```

At minimum, each case should support:

- query text
- expected top 1
- expected top N set
- forbidden matches

This fixture set should be used for both the custom implementation and any
future prototype implementation so quality comparisons stay honest.

## Medium-Term Prototype Design

### 1. Add `tinybench`

Use `tinybench` to compare:

- current custom metadata search
- current custom metadata search plus explicit content fallback path
- `minisearch` prototype

Benchmark focus:

- cold search cost in a process
- repeated search cost in the same process
- route-adjacent search cost if shared search internals are reused

### 2. Prototype `minisearch` behind `skills:search` only

Do not replace routing during the prototype.

Target prototype shape:

- current routing stays custom
- current registry format stays the same
- `skills:search` gets an internal alternative implementation using
  `minisearch`
- the prototype can be selected via a local internal switch, not a permanent
  public API change

Rationale:

- search is easier to compare than route policy
- routing currently includes policy and note injection, not just retrieval
- a narrow prototype reduces risk and evaluation noise

### 3. Compare quality and code size

The adoption decision should not be based on speed alone.

Evaluation criteria:

- does `minisearch` improve top-1 and top-3 match quality on the fixture set?
- does it simplify code enough to justify the dependency?
- does it preserve explainability of results?
- does it reduce maintenance burden?

Code-size comparison should include:

- lines removed from custom text-search logic
- lines added for integration glue
- dependency cost and conceptual weight

## Candidate Dependencies

### `tinybench`

Use for benchmark harness only.

Why:

- small and straightforward
- good fit for local developer-tool comparisons
- enough for the process-level measurements needed here

### `minisearch`

Use for prototype only at first.

Why:

- in-memory full-text search
- field boosts
- prefix and fuzzy features
- small enough to evaluate without dragging in a large platform

Why not adopt immediately:

- we do not yet have a relevance corpus
- we do not yet know whether it improves actual skill selection quality
- the current system is already serviceable after short-term cleanup

## Implementation Plan

### Phase 1: Short-term cleanup

1. split text-search helpers into a dedicated module
2. add in-process BM25 model caching
3. make content fallback explicit behind `--content`
4. update the package verification surface to cover the new default behavior

### Phase 2: Add evaluation surface

1. add search relevance fixture corpus
2. add eval assertions that run both expected-top and forbidden checks
3. keep the fixture set small but representative

### Phase 3: Add benchmark harness

1. add `tinybench`
2. create a local benchmark script under `tools/agent-skills`
3. measure current implementation first to create a baseline

### Phase 4: `minisearch` spike

1. add `minisearch`
2. build a prototype search index from the generated registry
3. compare it against the fixture corpus
4. compare it in the benchmark harness
5. decide whether to adopt, iterate, or drop

## Verification

Short-term cleanup:

- `pnpm --filter @playground/agent-skills run typecheck`
- `pnpm --filter @playground/agent-skills run build`
- `pnpm skills:search workflow`
- `pnpm skills:search ".finalMessage()"` should fail by default
- `pnpm skills:search -- --content ".finalMessage()"` should succeed

Evaluation harness:

- fixture-based search eval script passes against the current implementation

Prototype phase:

- benchmark script runs locally
- fixture comparisons are available for current and prototype implementations

## Decision Gates

Adopt `minisearch` only if it satisfies most of these:

- equal or better relevance on the fixture corpus
- equal or better perceived explainability
- simpler or meaningfully cleaner implementation
- no awkward degradation of the current CLI contract

If it only improves speed slightly but increases conceptual complexity, keep the
custom system.

## Success Criteria

- search internals are easier to read and maintain
- default search behavior is deterministic and explainable
- there is a real relevance corpus for future tuning
- there is a benchmark harness for implementation comparisons
- any dependency adoption decision is based on measured quality and code-shape
  outcomes, not guesswork
