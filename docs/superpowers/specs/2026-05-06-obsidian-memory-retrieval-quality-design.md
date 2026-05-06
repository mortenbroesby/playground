# Obsidian Memory Retrieval Quality Design

**Date:** 2026-05-06
**Status:** Approved for implementation

## Goal

Improve `tools/obsidian-memory` so repo-local memory retrieval becomes more
useful for agents in real work, especially when queries use different wording
than the stored note text and when the current hybrid retrieval stack returns
plausible but noisy context.

The first implementation slice should not jump straight to algorithm changes.
It should add enough observability to learn from real agent retrieval behavior,
then use those findings to upgrade ranking in a way that preserves the current
typed-memory architecture.

## Scope

This design covers:

1. retrieval observability for `memory_search`, `memory_context`, and
   `memory_unfold`
2. a clearer usefulness model based on weak-vs-strong usage signals
3. a lexical retrieval upgrade from heuristic token boosts to BM25-style
   ranking
4. a safer hybrid fusion strategy for lexical, vector, and graph candidates
5. an optional higher-cost quality mode with broader retrieval plus second-pass
   reranking
6. an evaluation loop driven first by real usage, then by a judged query set

This design does not cover:

1. changing the vault schema
2. replacing the current typed note registry or graph index model
3. introducing a remote retrieval service
4. making global Codex memory the source of truth for repo retrieval

## Current State

`tools/obsidian-memory` already has a useful structure:

- `rag-index.ts` writes separate lexical, vector, and graph artifacts
- `obsidian-rag.mjs` retrieves lexical, vector, and graph candidates separately
- candidate sets are fused with reciprocal-rank fusion
- a policy rerank pass adds note-type, status, recency, and integrity shaping

This means the main problem is not that retrieval is purely naive. The main
problem is that the lexical lane is still mostly heuristic token scoring and
the current fusion stack does not yet have enough evidence to distinguish
helpful semantic recall from confident noise.

## Primary Problems

- The current lexical search relies on fixed boosts for text/path/tag/title
  token matches, exact text inclusion, and a few query-intent heuristics. That
  is simple but brittle.
- The system does not currently capture enough retrieval telemetry to tell
  whether an agent merely saw a note, unfolded it, or effectively ignored it.
- The repo does not yet have a retrieval-quality loop grounded in real agent
  tasks and failures.
- Hybrid retrieval can surface semantically related chunks that sound good but
  are weakly supported by the query.
- The current fusion strategy is safe enough for a first hybrid pass, but it is
  not yet tuned for the user's preferred failure mode: avoid impressive but
  wrong context even at the cost of extra compute in a quality path.

## Product Direction

Use the following defaults.

- Optimize for usefulness over pure efficiency.
- Learn from real usage first rather than designing only from imagined queries.
- Keep the repo-local `obsidian-memory` vault as the retrieval target.
- Add observability before changing ranking.
- Track note use as a gradient, not a binary flag.
- Preserve a fast default path, but allow a slower higher-quality path.
- Allow semantic promotion only when another signal supports it.
- Treat noisy confidence as a worse failure than simple recall misses.

## Approach Options

### Option A: BM25 only

Replace the current lexical heuristics with BM25 and leave the rest of the
pipeline mostly unchanged.

Pros:

- smallest ranking change
- easy to explain
- likely immediate precision improvement for keyword-heavy queries

Cons:

- does not solve observability
- does not explain whether semantic and graph lanes help or hurt
- too narrow for mixed repo-memory queries

### Option B: Observability first, then safer hybrid retrieval

First add retrieval telemetry and evaluation capture. Then upgrade lexical
ranking to BM25/BM25F, adjust fusion to remain lexical-first, and tighten graph
and semantic promotion rules.

Pros:

- grounded in real agent behavior
- improves quality without discarding current architecture
- gives a durable basis for later rerank experiments

Cons:

- more work than a lexical-only replacement
- requires some new data plumbing and reporting

### Option C: Heavy retrieval stack immediately

Add multiple new retrieval algorithms and a second-pass reranker in the first
slice without first building observability.

Pros:

- largest short-term quality upside if lucky

Cons:

- high risk of tuning blind
- harder to tell which stage is actually helping
- easiest way to ship persuasive but noisy results

## Chosen Approach

Choose Option B.

The retrieval stack already has enough structure that it should be improved, not
replaced. The next correct move is to instrument real use, upgrade the lexical
lane, and make fusion stricter before adding heavier ranking stages.

## Design

### Phase 1: Retrieval observability

Add a repo-local retrieval event log for the MCP search surfaces.

Events should be emitted for:

- `memory_search`
- `memory_context`
- `memory_unfold`

For the first slice, capture:

- timestamp
- tool name
- normalized query text when present
- retrieval mode
- top candidates with rank, score, score breakdown, and retrieval sources
- whether each note/chunk received a weak use signal
- whether each note/chunk received a strong use signal

Weak and strong use should mean:

- weak use: the note/chunk appeared in a returned search/context bundle
- strong use: the agent explicitly unfolded or opened it afterward

The event model should leave room for a later stronger signal, such as whether
the final answer cited or clearly depended on a note, but that is not required
in the first slice.

### Phase 1: Reporting and review loop

Add a small reporting surface that groups retrieval behavior by query and by
usefulness outcome.

The report should support questions like:

- which queries returned only weak-use results
- which top-ranked results were never strongly used
- which unfolded notes came from lower-ranked candidates
- which query classes are causing semantic-only false positives

The first evaluation set should be built from observed queries and misses, not
invented upfront. After the first observation pass, promote representative
examples into a durable judged query set.

### Phase 2: Lexical retrieval upgrade

Replace the current heuristic lexical scoring with a field-aware BM25-style
ranker.

The recommended target is BM25F or an equivalent field-aware scoring model over
at least:

- chunk text
- note title
- source path
- note tags
- note keywords
- chunk summary when present

Field weights should reflect trust:

- title/path/keywords are strong evidence
- chunk text is broad evidence
- tags and summary are supportive evidence

Exact path, title, and note-id matches should remain explicit boosts layered on
top of the lexical ranker rather than being left entirely to BM25.

### Phase 2: Safer hybrid fusion

Keep the multi-source retrieval structure, but change the ranking contract.

Recommended contract:

- lexical retrieval is the primary precision anchor
- vector retrieval is mainly a recall helper
- graph retrieval is a targeted expansion mechanism
- final promotion requires support, not just semantic plausibility

Specific changes:

- replace equal-feeling RRF inputs with weighted fusion
- favor lexical rank and exact-match evidence more strongly
- penalize semantic-only candidates with weak lexical support unless another
  high-trust signal exists
- require graph expansion to start from strong lexical seeds
- keep policy rerank separate from source fusion

The system should prefer missing an uncertain semantic stretch over confidently
ranking it near the top.

### Phase 2: Retrieval modes

Introduce two explicit retrieval modes.

#### Default mode

Purpose:

- routine agent retrieval
- safer and cheaper everyday use

Behavior:

- BM25/BM25F lexical retrieval
- vector retrieval enabled but constrained
- graph expansion only for query classes that benefit from it
- weighted fusion
- no heavy reranker by default

#### Quality mode

Purpose:

- highest-quality retrieval when latency and cost are acceptable

Behavior:

- broader candidate generation from lexical, vector, and graph lanes
- larger candidate pool before truncation
- second-pass reranking over a small candidate set
- stronger support checks before semantic promotion
- richer scoring traces for later analysis

The quality mode exists because the user's stated preference is to spend more
per query if that materially reduces missed paraphrase matches and noisy
confident results.

### Phase 2: Heavy ranking candidates

The spec should leave room for two heavy-path families and compare them during
implementation:

1. multi-retriever candidate generation plus a second-pass reranker
2. richer weighted fusion without a learned reranker

The default recommendation is to implement the architecture so both remain
possible, but prefer a second-pass reranker only after BM25-style lexical
ranking and telemetry show where the remaining failures are.

### Query-class shaping

Observed query classes should eventually be separated at least into:

- architecture and decision lookup
- recent session and work-history lookup
- task or follow-up lookup
- broad exploratory research queries

Routing can then tune:

- graph expansion eligibility
- archive tolerance
- recency weighting
- quality-mode auto-escalation

This should be data-informed. The first slice should expose query classes in
telemetry before trying to overfit routing rules.

## Non-Goals

- No immediate replacement of the typed retrieval architecture
- No heavy learned reranker as a mandatory default path
- No attempt to optimize solely for benchmark elegance
- No mixing of repo-local memory retrieval with unrelated global memory systems

## Verification

Implementation should verify three things separately:

1. retrieval correctness
2. observability correctness
3. usefulness improvement

Expected verification surfaces:

- existing `@playground/obsidian-memory` retrieval tests
- new tests for telemetry emission and use-signal tracking
- targeted ranking tests for lexical-vs-semantic disagreements
- judged-query regression tests after the first observed-query set is built
- manual inspection of retrieval reports from real agent usage

Baseline note from this design pass:

- `pnpm --filter @playground/obsidian-memory rag:test` was not clean in the
  fresh worktree before any retrieval-quality changes
- observed baseline failures included missing `yaml` resolution in one test path
  and multiple MCP integration tests timing out

Those failures are pre-existing verification noise for this branch setup and
should not be conflated with the retrieval-quality project itself.

## Rollout Notes

- Keep observability repo-local.
- Avoid collecting full answer bodies in the first slice.
- Start with append-only retrieval events and derived reports rather than a
  heavy new storage system.
- Keep the fast path as the default user-facing behavior until observed data
  proves the quality path should absorb more traffic.

## Risks And Mitigations

- Risk: telemetry adds complexity without actionable learning
  Mitigation: restrict first-slice events to query, candidates, and use signals
  that directly support ranking decisions.

- Risk: BM25 improves lexical precision but hurts current hybrid recall
  Mitigation: keep vector and graph lanes, compare with judged queries, and
  tune weighted fusion rather than flipping to lexical-only.

- Risk: quality mode becomes a noisy showcase
  Mitigation: require cross-signal support before semantic promotion and audit
  high-ranked semantic-only outcomes explicitly.

- Risk: the implementation overfits imagined queries
  Mitigation: build the durable query set from observed agent usage first.

- Risk: retrieval modes confuse callers
  Mitigation: keep the default safe path stable and expose quality mode as an
  explicit escalation rather than a silent behavior change.
