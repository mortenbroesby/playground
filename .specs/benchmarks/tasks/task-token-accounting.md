---
id: task-token-accounting
slice: tools/ai-context-engine/bench
query: How does the benchmark harness compare exact token counts with estimated token counts for each task?
workflowSet: [baseline, text-first, bundle]
allowedPaths:
  - tools/ai-context-engine/bench/src/tokenizer.ts
  - tools/ai-context-engine/bench/src/workflows.ts
targets:
  - kind: symbol
    value: countTokens
    mode: exact
  - kind: symbol
    value: estimateTokens
    mode: exact
  - kind: symbol
    value: computeEstimatedBaselineForTask
    mode: exact
successCriteria:
  - exact token counting remains visible in the benchmark workflow
  - estimated token accounting stays visible beside exact counts
---

This query checks whether the retrieval path exposes both the exact tokenizer
and the approximation path used in reports.
