# AI Context Benchmark Tiktoken

## Summary

Replace the benchmark harness token approximation with real `tiktoken`
accounting so the package reports truthful `cl100k_base` numbers.

## Implemented

- added the official `tiktoken` package to
  `@playground/ai-context-engine-bench`
- replaced the `approx_char4` heuristic with a shared `cl100k_base` encoder in
  `src/tokenizer.ts`
- updated benchmark workflows to count retrieved payloads with the real
  tokenizer
- updated the benchmark runner to stamp result artifacts with `cl100k_base`
  instead of `approx_char4`
- added tokenizer coverage that proves exact counts for a small fixture string
- updated runner coverage to assert the emitted tokenizer metadata
- refreshed the package README to reflect that token accounting is now real

## Verification

- `pnpm --filter @playground/ai-context-engine-bench test`
- `pnpm --filter @playground/ai-context-engine-bench type-check`

## Follow-up

- add the checked-in `.specs/benchmarks/` corpus promised by the harness spec
- run the benchmark CLI against that corpus as an end-to-end smoke check
