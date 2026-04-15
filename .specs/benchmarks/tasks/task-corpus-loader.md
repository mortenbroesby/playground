---
id: task-corpus-loader
slice: packages/ai-context-engine-bench
query: loadBenchmarkCorpus
workflowSet: [baseline, discovery-first, symbol-first, bundle]
allowedPaths:
  - packages/ai-context-engine-bench/src/corpus.ts
targets:
  - kind: symbol
    value: loadBenchmarkCorpus
    mode: exact
successCriteria:
  - the benchmark corpus loads from checked-in files
  - the runner can resolve the corpus with a pinned repo snapshot
  - the CLI can run a single workflow smoke test against the corpus
---

This benchmark task exercises the benchmark package against itself.

The task is intentionally narrow so the first checked-in corpus stays safe and
deterministic while still proving the harness can load, run, and report.
