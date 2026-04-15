# AI Context Benchmark Package Foundation

## Summary

Move benchmark work out of `@playground/ai-context-engine` and into a separate
workspace package, then implement the first benchmark-harness foundations:
corpus loading and deterministic report generation.

## Why Separate Package

- the engine package should stay focused on retrieval/runtime behavior
- benchmark code is evaluation tooling with its own CLI and data model
- keeping the harness separate avoids coupling benchmark-only dependencies and
  concerns into the engine runtime package

## Implemented

- scaffolded `@playground/ai-context-engine-bench`
- updated the harness spec to target the separate package
- added benchmark corpus manifest and task-card types
- added manifest and task-card loading with fail-fast mismatch checks
- added deterministic JSON result shaping and markdown report rendering
- added focused tests for corpus loading and report generation

## Verification

- `pnpm --filter @playground/ai-context-engine-bench test`
- `pnpm --filter @playground/ai-context-engine-bench type-check`
- `pnpm lint:md`

## Next Slice

- runner orchestration
- workflow adapters
- fixture corpus under `.specs/benchmarks/`
- token accounting and trace capture
