# ai-context-engine-benchmark-spec.md

## Status

Last checked against the repo on 2026-04-15.

Implemented now:
- local benchmark package at `packages/ai-context-engine-bench`
- fixed workflows for `baseline`, `discovery-first`, `symbol-first`, `text-first`, and an experimental `bundle` path
- deterministic corpus loading, strict snapshot checks, token accounting with `tiktoken`, and markdown/JSON reporting

Still future:
- a broader multi-slice corpus across the repo
- richer trace output and bundle-quality metrics
- higher-order ranking and correctness metrics such as `precision@k`

## 1. Purpose

Define a local benchmark for `@playground/ai-context-engine` that measures how efficiently the engine can help an agent find the right code, structure, and context in the `playground` repo.

This benchmark is about retrieval, navigation, and bounded context assembly. It is not a full agent benchmark and it is not a code generation benchmark.

The benchmark should answer three questions:

1. How much token budget does a retrieval workflow consume versus reading the relevant repo slice directly?
2. How often does the workflow surface the correct symbol, file, or snippet on the first attempt?
3. How reproducible are those results across runs, machines, and repo snapshots?

## 2. Scope

The benchmark covers local, deterministic workflows for the `playground` repo only.

In scope now:

1. repo outline and file-tree discovery
2. file outline and symbol search
3. exact symbol and file retrieval
4. text search for literals, config, and comments
5. bounded context assembly through an experimental bundle workflow
6. strict snapshot cleanliness and pinned-SHA validation

Still future:
- broader freshness and incremental-refresh benchmarking beyond snapshot validation

Out of scope:

1. LLM answer quality beyond retrieval relevance
2. interactive chat behavior
3. remote/cloud retrieval services
4. mandatory semantic search
5. GUI or IDE workflows

## 3. Corpus

The benchmark corpus should be a frozen snapshot of the `playground` repo at a pinned git SHA.
That mechanism is implemented today; the checked-in corpus manifest records a pinned SHA.

Longer term, the corpus should cover representative code-navigation tasks from these slices:

1. `apps/host`
2. `packages/remotes/todo-app`
3. `packages/remotes/uplink-game`
4. `packages/ui`
5. `packages/types`
6. `packages/config`
7. `packages/ai-context-engine`
8. repo-level workflow and docs files where they affect agent behavior

The corpus should contain task cards, not ad hoc prompts. Each task card should define:

1. a stable task id
2. the natural-language query or intent
3. the expected target symbol, file, or evidence
4. accepted alternate answers if the implementation has more than one valid entry point
5. the repo slice or path filters the task is allowed to use
6. the retrieval workflow(s) to compare

Recommended task categories:

1. symbol lookup by name
2. implementation lookup by behavior
3. cross-package wiring lookup
4. config or policy lookup
5. text-only lookup for literals, flags, or comments
6. multi-symbol context assembly

The current corpus is intentionally tiny: one self-hosted task for the benchmark package.

The next corpus expansion should still stay small enough to run frequently, but broad enough to catch regressions in:

1. parser coverage
2. ranking quality
3. exact snippet retrieval
4. path filtering and exclusion rules
5. context budgeting

## 4. Baseline

The baseline is a read-all approach for the same repo slice the task requires.

Baseline definition:

1. concatenate all eligible source files for the task slice
2. tokenize the concatenated text with `tiktoken` using `cl100k_base`
3. count that as the baseline token cost for the task

Rules for the baseline:

1. do not include files excluded by the engine's configured ignore rules
2. do not include generated artifacts or build output
3. do not include index build time in the retrieval baseline
4. do not count static system prompts or tool schema that are identical across workflows

The baseline is a lower bound on naive file reading, not a claim about every possible human workflow.

## 5. Retrieval Workflows To Compare

The benchmark should compare a small set of fixed retrieval workflows.

### 5.1 Baseline workflow

Read all eligible files for the task slice.

### 5.2 Discovery-first workflow

Current minimal sequence:

1. `get_file_tree`
2. `get_file_outline`

Target fuller sequence:

1. `get_repo_outline`
2. `get_file_tree`
3. `get_file_outline`
4. `search_symbols`
5. `get_symbol_source` or `get_file_content`

This workflow measures whether the engine helps an agent narrow down the search before opening code.

### 5.3 Symbol-first workflow

Recommended sequence:

1. `search_symbols`
2. `get_symbol_source`

This is the closest comparison to the upstream jcodemunch-style symbol workflow.

### 5.4 Text-first workflow

Recommended sequence:

1. `search_text`
2. `get_file_content` or `get_symbol_source`

This covers string literals, config values, comments, and other cases where symbol search is not enough.

### 5.5 Context-bundle workflow

Use `get_context_bundle`.

Current status:
- implemented as an experimental workflow in the harness
- useful for smoke coverage, but not yet rich enough for full bundle-quality evaluation

This workflow should be treated as a later phase until the engine can reliably:

1. assemble related symbols and imports
2. respect a token budget
3. avoid duplicating source
4. explain what it included and why

## 6. Metrics

The benchmark should report both efficiency and correctness signals.

### 6.1 Primary metrics

1. token cost per task
2. token reduction versus baseline
3. task success rate

### 6.2 Secondary metrics

1. precision@k for returned symbols
2. top-1 and top-3 hit rate
3. latency to first useful result
4. total tool-call count
5. exact source retrieval rate

### 6.3 Context quality metrics

For workflows that return code snippets or bundles:

1. snippet relevance
2. bundle completeness for the target symbol
3. bundle duplication rate
4. budget adherence

### 6.4 Aggregate reporting

Implemented report summary:

1. per-task metrics
2. per-workflow averages
3. grand total across the corpus

Still future:

1. per-slice averages once the corpus spans multiple slices
2. richer ambiguity and miss classification

Report at least:

1. per-task metrics
2. per-workflow averages
3. per-slice averages
4. grand total across the corpus

## 7. Methodology

The benchmark harness is deterministic in its current slice.

Required methodology:

1. pin the repo to a specific git SHA
2. run on a clean checkout with no uncommitted changes
3. use the same tokenizer for all workflows
4. use the same corpus and task ordering for all runs
5. serialize request and response payloads deterministically before tokenization
6. exclude index build time from retrieval-only comparisons
7. run the same task against every selected workflow
8. record the repo SHA, machine profile, and run id

Current limitation:
- engine and benchmark versions are still hardcoded to `0.0.1`

The benchmark should not depend on network access after the repo snapshot is prepared.

If the benchmark includes an indexing phase, report it separately from retrieval. Do not mix index time into token-efficiency numbers unless the report explicitly says it is an end-to-end indexing benchmark.

## 8. Reporting Format

The benchmark should produce a markdown report and a machine-readable artifact.

Current report contents:

1. benchmark name and version
2. repo SHA
3. engine version
4. tokenizer used
5. corpus size and slice breakdown
6. workflow definitions
7. per-task table
8. per-workflow summary table
9. grand total summary
10. failure notes

Still future:
- richer ambiguity handling

Recommended per-task table columns:

1. task id
2. repo slice
3. workflow
4. target
5. token cost
6. baseline tokens
7. reduction percentage
8. latency
9. success or miss
10. notes

Recommended machine-readable artifact:

1. JSON results file with the same fields as the markdown report
2. stable ordering so diffs are easy to review

## 9. Reproducibility

The benchmark is repeatable by another developer without hidden state within the current narrow corpus.

Required reproducibility rules:

1. keep the corpus definition in version control
2. keep the benchmark harness deterministic
3. record the pinned repo SHA in the results
4. avoid depending on cached local knowledge outside the repo
5. avoid manual edits to the corpus after a run has started
6. keep the tokenizer and serialization format fixed
7. make skipped files and exclusions explicit in the report

If the harness needs fixtures or snapshot metadata, store them under `.specs/benchmarks/` or another `.specs` subtree, not in engine source.

## 10. Fairness Constraints

The benchmark must compare workflows on equal footing.

Rules:

1. all workflows get the same corpus and repo snapshot
2. all workflows use the same path exclusions
3. all workflows use the same success criteria
4. no workflow may receive extra oracle context unless the task explicitly allows it

## 11. Harness Implementation Spec

The concrete harness plan lives in [`ai-context-engine-benchmark-harness-spec.md`](./ai-context-engine-benchmark-harness-spec.md).

Use that file as the implementation-facing reference for the current harness slice; keep this benchmark policy doc as the higher-level contract and evaluation frame.
5. no manual cherry-picking after seeing results
6. do not compare a workflow that can use a feature another workflow does not have
7. do not count static prompts or shared schema overhead when comparing retrieval efficiency

If a capability is not implemented yet, the benchmark should mark it as `future` or `na` rather than silently substituting a different workflow.

That rule still applies to:
- richer bundle evaluation
- broader freshness benchmarking
- expanded corpus slices

## 11. Open Questions

These remain intentionally unresolved after the first harness slice.

1. Should `get_context_bundle` be part of the first released benchmark, or only a future suite?
2. Should freshness and watch-mode behavior be benchmarked separately from retrieval?
3. Should the corpus stay entirely within the `playground` repo, or later add external fixture repos for generalization checks?
4. Should semantic ranking be benchmarked as a separate optional workflow once it exists?
5. Should docs and vault notes be included in the same corpus as code, or tracked in a separate slice?
6. Should exact-source retrieval be measured only for direct symbol hits, or also for indirect path discovery?

## 12. Success Criteria

The benchmark spec is good enough when a harness can be built from it without inventing hidden rules.

That means:

1. the corpus is well defined
2. the baseline is unambiguous
3. the workflows are concrete
4. the metrics are measurable
5. the report format is fixed
6. reproducibility and fairness rules are explicit
7. unresolved engine capabilities are called out instead of assumed
