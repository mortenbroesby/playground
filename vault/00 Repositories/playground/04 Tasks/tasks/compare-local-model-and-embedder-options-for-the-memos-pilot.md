---
type: repo-task
repo: playground
id: compare-local-model-and-embedder-options-for-the-memos-pilot
priority: P2
status: Ready
ai_appetite: 80
source: "[run-a-fully-local-memos-pilot-with-one-client.md](</Users/macbook/personal/playground/vault/00 Repositories/playground/04 Tasks/tasks/run-a-fully-local-memos-pilot-with-one-client.md>)."
---

# Compare local model and embedder options for the MemOS pilot

## Why

The MemOS pilot only makes sense if the local model and embedding path is
practical enough to run without paid providers or excessive setup friction.

## Outcome

A short recommendation identifies the best local-only model and embedder path
for a first MemOS pilot in this environment, including tradeoffs and fallback
options.

## Details

## Constraints

- local-only inference path
- no paid APIs
- no cloud embeddings
- prefer options that are realistic on this machine
- optimize for setup simplicity and acceptable retrieval quality over theoretical
  maximum performance

## Acceptance Criteria

- at least two viable local model paths are compared
- at least two viable local embedding paths are compared
- hardware and runtime assumptions are stated clearly
- one recommended default stack is chosen for the pilot
- one fallback stack is named in case the preferred path is too heavy or brittle
- the recommendation is captured in the vault before pilot implementation starts
