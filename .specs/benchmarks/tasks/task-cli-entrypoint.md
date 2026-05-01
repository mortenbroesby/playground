---
id: task-cli-entrypoint
status: retired-pre-extraction
slice: tools/ai-context-engine
query: What is the one-command Astrograph entrypoint for running the benchmark corpus locally?
workflowSet: [baseline, text-first]
allowedPaths:
  - tools/ai-context-engine/bench/src/cli.ts
  - tools/ai-context-engine/package.json
targets:
  - kind: symbol
    value: main
    mode: exact
  - kind: text
    value: bench:corpus
    mode: exact
successCriteria:
  - the benchmark CLI entrypoint remains discoverable
  - the package script stays visible as the default one-command contract
---

Retired source note: this task card targets the removed pre-extraction
`tools/ai-context-engine` benchmark workspace. It is retained only as a
historical benchmark fixture; current Astrograph source lives in `../astrograph`.

This query anchors the Phase 1 requirement that a developer can run the corpus
benchmark from one clear workspace command.
