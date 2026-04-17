# `@playground/ai-context-engine-bench`

Benchmark harness package for [`@playground/ai-context-engine`](../ai-context-engine/README.md).

## Why this is separate

The engine package is the product/runtime surface. The benchmark harness is
evaluation tooling with its own CLI, corpus loading, token accounting, and
reporting concerns.

Keeping the harness in a separate workspace package:

- avoids mixing benchmark-only dependencies into the engine package
- keeps package ownership clearer
- makes it easier to evolve benchmark workflows without expanding the runtime
  API surface

## Current state

This package now has a runnable MVP harness with:

- corpus loading from `.specs/benchmarks/`
- fixed workflow execution against `@playground/ai-context-engine`
- deterministic JSON and markdown report output
- real token accounting with `tiktoken` using `cl100k_base`
- optional approximate sidecar estimates with `tokenx` for cheaper preflight
  cost/budget comparisons without replacing the exact benchmark numbers

The current build plan lives in
[`/.specs/ai-context-engine-benchmark-harness-spec.md`](../../.specs/ai-context-engine-benchmark-harness-spec.md).
