---
id: task-corpus-loader
status: retired-pre-extraction
slice: tools/ai-context-engine/bench
query: loadBenchmarkCorpus
workflowSet: [baseline, discovery-first, symbol-first, text-first, bundle]
allowedPaths:
  - tools/ai-context-engine/bench/src/corpus.ts
targets:
  - kind: symbol
    value: loadBenchmarkCorpus
    mode: exact
  - kind: symbol
    value: loadBenchmarkTaskCard
    mode: exact
successCriteria:
  - the benchmark corpus loads from checked-in files
  - the runner can resolve the corpus with a pinned repo snapshot
  - the CLI can run a single workflow smoke test against the corpus
---

Retired source note: this task card targets the removed pre-extraction
`tools/ai-context-engine` benchmark workspace. It is retained only as a
historical benchmark fixture; current Astrograph source lives in `../astrograph`.

This benchmark task exercises the corpus loader against the checked-in manifest
and task-card format that the rest of the Phase 1 harness now depends on.
