# AI Context Benchmark Corpus MVP

## Summary

Add the first checked-in benchmark corpus for
`@playground/ai-context-engine-bench` and prove the harness can execute it
through both the library runner and the CLI.

## Implemented

- added a checked-in corpus manifest at
  `.specs/benchmarks/ai-context-engine-benchmark-corpus.json`
- added the first task card at
  `.specs/benchmarks/tasks/task-corpus-loader.md`
- updated the benchmark CLI so `--corpus` and `--output` resolve relative to
  `--repo-root`
- added a shared benchmark fixture helper for tests
- added a CLI smoke test against the checked-in corpus
- updated corpus and runner tests to validate the checked-in corpus flow

## Verification

- `pnpm --filter @playground/ai-context-engine-bench test`
- `pnpm --filter @playground/ai-context-engine-bench type-check`

## Notes

- the first corpus is intentionally narrow and benchmarks the benchmark package
  against itself
- the manifest pins repo SHA `97d82c70eec5af8e9c391fc9208d6ac9536af04f`
- this is enough to prove the checked-in corpus workflow without prematurely
  freezing a broad task set
