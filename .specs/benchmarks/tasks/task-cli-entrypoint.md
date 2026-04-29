---
id: task-cli-entrypoint
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

This query anchors the Phase 1 requirement that a developer can run the corpus
benchmark from one clear workspace command.
