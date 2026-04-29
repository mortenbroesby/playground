---
id: task-strict-snapshot
slice: tools/ai-context-engine/bench
query: How does strict benchmark mode pin a run to a clean repository snapshot?
workflowSet: [baseline, text-first, bundle]
allowedPaths:
  - tools/ai-context-engine/bench/src/runner.ts
  - tools/ai-context-engine/bench/src/snapshot.ts
targets:
  - kind: symbol
    value: getRepoSnapshot
    mode: exact
  - kind: symbol
    value: assertStrictSnapshot
    mode: exact
successCriteria:
  - strict mode still resolves the git snapshot before task execution
  - the failure path for dirty or mismatched checkouts remains visible
---

This query measures whether the corpus can surface the snapshot guardrails that
keep golden benchmark runs pinned to a known checkout state.
