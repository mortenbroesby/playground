---
type: repo-session
repo: playground
date: 2026-04-22
started_at: 2026-04-22 10:30
branch: main
summary: Captured implementation-oriented specs for Obsidian RAG improvements and `ai-context-engine` retrieval improvements, then added a design doc evaluating `graphify` as an optional graph sidecar rather than a direct replacement.
keywords:
  - obsidian-rag
  - ai-context-engine
  - graphify
  - design-doc
  - spec
touched_paths:
  - .specs/obsidian-rag-improvement-spec.md
  - .specs/ai-context-engine-rag-improvement-spec.md
  - .specs/graphify-integration-design.md
tags:
  - type/session
  - repo/playground
---

# RAG Improvement Specs And Graphify Design

## Summary

Documented the current comparison findings as two separate specs:

- one for improving the Obsidian-backed repo-memory retrieval path
- one for improving `ai-context-engine` retrieval architecture

Also added a separate design doc for evaluating `graphify` as a graph sidecar.

## Decisions Captured

- Obsidian RAG should evolve from corpus generation plus lexical verification
  into a structured retrieval surface with references and reranking
- `ai-context-engine` should keep exact code retrieval as its truth model while
  adding a clearer `retrieve -> rerank -> assemble` pipeline
- `graphify` should be treated as an experiment-first sidecar for memory and
  mixed-corpus relationship discovery, not as a direct replacement for exact
  code retrieval

## Verification

- `pnpm exec markdownlint-cli2 .specs/obsidian-rag-improvement-spec.md .specs/ai-context-engine-rag-improvement-spec.md`
- `pnpm exec markdownlint-cli2 .specs/graphify-integration-design.md`
