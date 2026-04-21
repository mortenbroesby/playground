# `ai-context-engine/bench`

Benchmark harness for [`@playground/ai-context-engine`](../README.md).

The harness now lives inside the engine workspace instead of as a separate
package. It remains an internal evaluation surface with its own CLI, corpus
loading, token accounting, and reporting code.

## Current state

This harness now has a runnable MVP setup with:

- corpus loading from `.specs/benchmarks/`
- fixed workflow execution against `@playground/ai-context-engine`
- deterministic JSON and markdown report output
- real token accounting with `tiktoken` using `cl100k_base`
- optional approximate sidecar estimates with `tokenx` for cheaper preflight
  cost/budget comparisons without replacing the exact benchmark numbers

The current build plan lives in
[`/.specs/ai-context-engine-benchmark-harness-spec.md`](../../.specs/ai-context-engine-benchmark-harness-spec.md).
