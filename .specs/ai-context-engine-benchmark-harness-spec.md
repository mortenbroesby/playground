# ai-context-engine-benchmark-harness-spec.md

## 1. Purpose

Turn the benchmark policy in [`ai-context-engine-benchmark-spec.md`](./ai-context-engine-benchmark-spec.md) into a buildable harness plan for `@playground/ai-context-engine`.

This spec defines the next implementation slice: a deterministic local benchmark runner that can execute fixed task cards against a frozen `playground` snapshot, compare retrieval workflows, and emit stable JSON plus markdown artifacts.

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

## 4. Proposed Harness Shape

Build the harness as a package-local benchmark subsystem inside `packages/ai-context-engine`.

### 4.1 Proposed source files

Create these files next:

1. `packages/ai-context-engine/src/benchmark/cli.ts`
2. `packages/ai-context-engine/src/benchmark/runner.ts`
3. `packages/ai-context-engine/src/benchmark/corpus.ts`
4. `packages/ai-context-engine/src/benchmark/workflows.ts`
5. `packages/ai-context-engine/src/benchmark/tokenizer.ts`
6. `packages/ai-context-engine/src/benchmark/report.ts`
7. `packages/ai-context-engine/src/benchmark/snapshot.ts`
8. `packages/ai-context-engine/src/benchmark/types.ts`

### 4.2 Proposed test files

1. `packages/ai-context-engine/tests/benchmark/corpus.test.ts`
2. `packages/ai-context-engine/tests/benchmark/report.test.ts`
3. `packages/ai-context-engine/tests/benchmark/runner.test.ts`

### 4.3 Package script

Add a dedicated script in `packages/ai-context-engine/package.json`:

```json
{
  "scripts": {
    "benchmark": "node --experimental-strip-types ./src/benchmark/cli.ts"
  }
}
```

That keeps benchmark execution separate from the normal engine CLI and MCP server.

## 5. Corpus Format

Use a hybrid corpus format so the benchmark is both human-reviewable and machine-loadable.

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

Write each benchmark run to a repo-local output directory:

1. `.benchmarks/ai-context-engine/<run-id>/results.json`
2. `.benchmarks/ai-context-engine/<run-id>/report.md`
3. `.benchmarks/ai-context-engine/<run-id>/traces/*.jsonl`
4. `.benchmarks/ai-context-engine/<run-id>/corpus.lock.json`

`<run-id>` should include the repo SHA and timestamp so runs are naturally sortable.

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
13. `tracePath`

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

Each workflow execution should emit a trace file with ordered events:

1. input request
2. tool calls and responses
3. chosen target evidence
4. final success or miss classification

The trace format should be line-delimited JSON so diffs stay readable and append-only logging is easy.

## 7. Commands

The next implementation slice should support these commands:

1. `pnpm --filter @playground/ai-context-engine benchmark -- --corpus .specs/benchmarks/ai-context-engine-benchmark-corpus.json --output .benchmarks/ai-context-engine/latest`
2. `pnpm --filter @playground/ai-context-engine benchmark -- --corpus .specs/benchmarks/ai-context-engine-benchmark-corpus.json --task task-id`
3. `pnpm --filter @playground/ai-context-engine benchmark -- --corpus .specs/benchmarks/ai-context-engine-benchmark-corpus.json --workflow symbol-first`

Required CLI flags:

1. `--corpus <path>`
2. `--output <dir>`
3. `--repo-root <path>` with default current checkout root
4. `--task <task-id>` for single-task smoke runs
5. `--workflow <workflow-id>` for workflow-specific smoke runs
6. `--strict` to fail on manifest/task mismatches or dirty checkout

## 8. Verification Flow

This slice is done when the following checks pass:

1. `pnpm --filter @playground/ai-context-engine type-check`
2. `pnpm --filter @playground/ai-context-engine test`
3. benchmark corpus loader test passes against the fixture corpus
4. benchmark report writer test passes against a synthetic result object
5. benchmark runner smoke test passes for one task and one workflow
6. a manual benchmark run against the current repo snapshot writes `results.json` and `report.md` to `.benchmarks/ai-context-engine/<run-id>/`

The first coding slice should use the fixture corpus for fast feedback, then add the real `playground` corpus once the harness is stable.

## 9. Implementation Slices

### 9.1 Slice 1: corpus loader and schema

Implement the manifest loader, task-card parser, schema validation, and run-order resolution.

Acceptance criteria:

1. manifest and task files load deterministically
2. disagreement between manifest and task cards fails fast
3. task ordering is stable and explicit

### 9.2 Slice 2: runner and workflow adapter

Implement the benchmark runner, workflow dispatch, and trace capture.

Acceptance criteria:

1. one task can run through one workflow end-to-end
2. tool-call events are recorded in order
3. success and miss are derived from explicit evidence rules

### 9.3 Slice 3: token accounting and reports

Implement tokenizer selection, baseline token counting, result aggregation, and markdown rendering.

Acceptance criteria:

1. baseline token counts are deterministic
2. result JSON is stable and machine-readable
3. report.md is generated from the JSON artifact

### 9.4 Slice 4: real-corpus run

Run the harness against the pinned `playground` corpus and record the first comparable benchmark set.

Acceptance criteria:

1. the run finishes without network access
2. the report names the repo SHA, engine version, and tokenizer
3. the output directory is self-contained and reviewable
