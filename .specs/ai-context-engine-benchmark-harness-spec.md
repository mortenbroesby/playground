# ai-context-engine-benchmark-harness-spec.md

## Status

Last checked against the repo on 2026-04-15.

Implemented now:
- separate workspace package at `packages/ai-context-engine-bench`
- CLI, runner, corpus loader, tokenizer, report writer, snapshot checks, and workflow adapters
- tests for scaffold, corpus loading, reporting, tokenizer, snapshot handling, runner flow, and CLI

Still future:
- emitting ordered `.jsonl` trace files
- a broader real-repo corpus and checked-in benchmark run artifacts
- richer bundle evaluation and reporting depth

## 1. Purpose

Turn the benchmark policy in [`ai-context-engine-benchmark-spec.md`](./ai-context-engine-benchmark-spec.md) into a buildable harness plan for `@playground/ai-context-engine`.

This spec now describes the first implemented harness slice: a deterministic local benchmark runner that can execute fixed task cards against a frozen `playground` snapshot, compare retrieval workflows, and emit stable JSON plus markdown artifacts.

The harness is for measurement and regression detection, not model evaluation and not interactive chat.

## 2. Outcome

When this slice is implemented, a developer should be able to:

1. run a benchmark against a pinned `playground` checkout
2. execute the same task corpus through multiple fixed retrieval workflows
3. produce machine-readable and human-readable results in a repo-local output directory
4. reproduce the same result structure on another machine with the same repo SHA and corpus version

## 3. Non-goals

This slice does not need to:

1. add new retrieval capabilities to the engine itself
2. benchmark LLM answer quality
3. support remote repositories or network fetches during the run
4. support arbitrary user-authored ad hoc prompts
5. solve freshness/watch mode beyond reporting whether the snapshot was clean

## 4. Harness Shape

Implemented package shape:

- package path: `packages/ai-context-engine-bench`
- package name: `@playground/ai-context-engine-bench`
- runtime dependency: `@playground/ai-context-engine`

This keeps the engine package focused on retrieval/runtime behavior while the
benchmark package owns evaluation, corpus loading, token accounting, and report
generation.

### 4.1 Checked-in source files

These files now exist:

1. `packages/ai-context-engine-bench/src/cli.ts`
2. `packages/ai-context-engine-bench/src/runner.ts`
3. `packages/ai-context-engine-bench/src/corpus.ts`
4. `packages/ai-context-engine-bench/src/workflows.ts`
5. `packages/ai-context-engine-bench/src/tokenizer.ts`
6. `packages/ai-context-engine-bench/src/report.ts`
7. `packages/ai-context-engine-bench/src/snapshot.ts`
8. `packages/ai-context-engine-bench/src/types.ts`

### 4.2 Checked-in test files

1. `packages/ai-context-engine-bench/tests/corpus.test.ts`
2. `packages/ai-context-engine-bench/tests/report.test.ts`
3. `packages/ai-context-engine-bench/tests/runner.test.ts`
4. `packages/ai-context-engine-bench/tests/cli.test.ts`
5. `packages/ai-context-engine-bench/tests/snapshot.test.ts`
6. `packages/ai-context-engine-bench/tests/tokenizer.test.ts`
7. `packages/ai-context-engine-bench/tests/scaffold.test.ts`

### 4.3 Package script

Add a dedicated script in `packages/ai-context-engine-bench/package.json`:

```json
{
  "scripts": {
    "benchmark": "node --experimental-strip-types ./src/cli.ts"
  }
}
```

This keeps benchmark execution separate from the normal engine CLI and MCP
server, and avoids bundling benchmark-only dependencies into the engine package.

## 5. Corpus Format

The current harness uses a hybrid corpus format so the benchmark is both human-reviewable and machine-loadable.

### 5.1 Canonical corpus files

Store the benchmark corpus in version control under:

1. `.specs/benchmarks/ai-context-engine-benchmark-corpus.json`
2. `.specs/benchmarks/tasks/*.md`

The JSON file is the manifest. The markdown files are the task cards.

### 5.2 Corpus manifest schema

`ai-context-engine-benchmark-corpus.json` should contain:

```json
{
  "schemaVersion": 1,
  "benchmark": "ai-context-engine",
  "repo": "playground",
  "repoSha": "<pinned-repo-sha>",
  "tokenizer": "cl100k_base",
  "tasks": [
    {
      "id": "task-id",
      "path": "tasks/task-id.md",
      "slice": "packages/ai-context-engine",
      "workflows": ["baseline", "discovery-first", "symbol-first", "text-first"],
      "allowedPaths": ["packages/ai-context-engine/**"],
      "targets": [
        {
          "kind": "symbol",
          "value": "searchSymbols",
          "mode": "exact"
        }
      ]
    }
  ]
}
```

### 5.3 Task card schema

Each task card should be a markdown file with YAML frontmatter followed by a short human-readable body.

Required frontmatter fields:

1. `id`
2. `slice`
3. `query`
4. `workflowSet`
5. `allowedPaths`
6. `targets`
7. `successCriteria`

Recommended optional fields:

1. `alternateTargets`
2. `notes`
3. `excludedPaths`
4. `expectedArtifacts`

Example:

```md
---
id: task-context-bundle-reads-greeter
slice: packages/ai-context-engine
query: "Find the Greeter class and its related context"
workflowSet: [discovery-first, symbol-first, text-first, bundle]
allowedPaths:
  - packages/ai-context-engine/**
targets:
  - kind: symbol
    value: Greeter
    mode: exact
successCriteria:
  - symbol source is retrieved
  - bundle stays within the token budget
---

Why this task exists:
...
```

### 5.4 Corpus rules

1. Task IDs must be stable and never reused for different intents.
2. The corpus manifest is the source of truth for run ordering.
3. Task cards are immutable once a benchmark run starts.
4. The harness must refuse to run if the manifest and task files disagree.
5. The harness must record the manifest copy used for the run in the result artifact.
6. Task `path` values are resolved relative to the manifest file location.

## 6. Result Artifact Format

The runner currently writes each benchmark run to a repo-local output directory:

1. `.benchmarks/ai-context-engine/<run-id>/results.json`
2. `.benchmarks/ai-context-engine/<run-id>/report.md`
3. `.benchmarks/ai-context-engine/<run-id>/corpus.lock.json`

`<run-id>` should include the repo SHA and timestamp so runs are naturally sortable.

Current limitation:
- ordered trace artifacts are not emitted yet

### 6.1 `results.json`

Use a stable schema with at least:

1. `schemaVersion`
2. `benchmarkName`
3. `benchmarkVersion`
4. `repoSha`
5. `engineVersion`
6. `tokenizer`
7. `runId`
8. `machine`
9. `corpus`
10. `workflows`
11. `tasks`
12. `summary`

Each task result should include:

1. `taskId`
2. `workflowId`
3. `allowedPaths`
4. `target`
5. `baselineTokens`
6. `retrievedTokens`
7. `tokenReductionPct`
8. `toolCalls`
9. `latencyMs`
10. `success`
11. `evidence`
12. `notes`

### 6.2 `report.md`

The markdown report should be generated from `results.json` and include:

1. benchmark metadata
2. corpus metadata
3. workflow definitions
4. per-task table
5. per-workflow summary table
6. grand-total summary
7. failure notes and ambiguous cases

The report should not require manually maintained prose beyond a small header.

### 6.3 Trace files

This is still future work.

Target behavior:

1. input request
2. tool calls and responses
3. chosen target evidence
4. final success or miss classification

The trace format should be line-delimited JSON so diffs stay readable and append-only logging is easy.

## 7. Commands

The implemented harness supports these commands:

1. `pnpm --filter @playground/ai-context-engine-bench benchmark -- --corpus .specs/benchmarks/ai-context-engine-benchmark-corpus.json --output .benchmarks/ai-context-engine/latest`
2. `pnpm --filter @playground/ai-context-engine-bench benchmark -- --corpus .specs/benchmarks/ai-context-engine-benchmark-corpus.json --task task-id`
3. `pnpm --filter @playground/ai-context-engine-bench benchmark -- --corpus .specs/benchmarks/ai-context-engine-benchmark-corpus.json --workflow symbol-first`

Required CLI flags:

1. `--corpus <path>`
2. `--output <dir>`
3. `--repo-root <path>` with default current checkout root
4. `--task <task-id>` for single-task smoke runs
5. `--workflow <workflow-id>` for workflow-specific smoke runs
6. `--strict` to fail on manifest/task mismatches or dirty checkout

## 8. Verification Flow

This slice is implemented when the following checks pass:

1. `pnpm --filter @playground/ai-context-engine-bench type-check`
2. `pnpm --filter @playground/ai-context-engine-bench test`
3. benchmark corpus loader test passes against the fixture corpus
4. benchmark report writer test passes against a synthetic result object
5. benchmark runner smoke test passes for one task and one workflow
6. a manual benchmark run against the current repo snapshot writes `results.json` and `report.md` to `.benchmarks/ai-context-engine/<run-id>/`

Current repo status:
- the automated tests prove this flow against fixture repos
- there is no checked-in real-repo run artifact yet

The first coding slice uses the fixture corpus for fast feedback. The next step is to expand the real `playground` corpus once the harness is stable enough to justify broader comparisons.

## 9. Implementation Slices

### 9.1 Slice 1: corpus loader and schema

Status: implemented.

Acceptance criteria:

1. manifest and task files load deterministically
2. disagreement between manifest and task cards fails fast
3. task ordering is stable and explicit
4. the benchmark package can read the engine package without circular ownership

### 9.2 Slice 2: runner and workflow adapter

Status: partially implemented.

Implemented now:
- benchmark runner
- workflow dispatch

Still future:
- trace capture

Acceptance criteria:

1. one task can run through one workflow end-to-end
2. tool-call events are recorded in order
3. success and miss are derived from explicit evidence rules
4. trace capture remains pending

### 9.3 Slice 3: token accounting and reports

Status: implemented for the current report shape.

Acceptance criteria:

1. baseline token counts are deterministic
2. result JSON is stable and machine-readable
3. report.md is generated from the JSON artifact

### 9.4 Slice 4: real-corpus run

Status: partially implemented.

Implemented now:
- the checked-in corpus is pinned and runnable
- fixture-based smoke runs are covered by tests

Still future:
- broader real-repo corpus coverage
- recording the first comparable checked-in benchmark set

Acceptance criteria:

1. the run finishes without network access
2. the report names the repo SHA, engine version, and tokenizer
3. the output directory is self-contained and reviewable
