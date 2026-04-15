import { describe, expect, it } from "vitest";

import {
  createBenchmarkResultsArtifact,
  renderBenchmarkReportMarkdown,
  serializeBenchmarkResults,
} from "../src/index.ts";

function createSyntheticResults() {
  return createBenchmarkResultsArtifact({
    benchmarkName: "ai-context-engine",
    benchmarkVersion: "2026.04",
    repoSha: "abc123",
    engineVersion: "1.2.3",
    tokenizer: "cl100k_base",
    runId: "abc123-20260415T120000Z",
    machine: {
      hostname: "ci",
      platform: "linux",
      arch: "x64",
      nodeVersion: "24.0.0",
    },
    corpus: {
      schemaVersion: 1,
      manifestPath: ".specs/benchmarks/ai-context-engine-benchmark-corpus.json",
      benchmark: "ai-context-engine",
      repo: "playground",
      repoSha: "abc123",
      tokenizer: "cl100k_base",
      taskCount: 2,
    },
    workflows: [
      {
        workflowId: "symbol-first",
        label: "Symbol First",
        description: "Start from symbols before reading source.",
      },
    ],
    tasks: [
      {
        taskId: "task-1",
        workflowId: "symbol-first",
        allowedPaths: ["packages/ai-context-engine/**"],
        target: {
          kind: "symbol",
          value: "searchSymbols",
          mode: "exact",
        },
        baselineTokens: 120,
        retrievedTokens: 40,
        tokenReductionPct: 66.7,
        toolCalls: 3,
        latencyMs: 21,
        success: true,
        evidence: ["packages/ai-context-engine/src/index.ts"],
        notes: ["found by exact symbol lookup"],
        tracePath: ".benchmarks/ai-context-engine/run-1/traces/task-1.jsonl",
      },
      {
        taskId: "task-2",
        workflowId: "symbol-first",
        allowedPaths: ["packages/ai-context-engine/**"],
        target: {
          kind: "symbol",
          value: "getContextBundle",
          mode: "exact",
        },
        baselineTokens: 80,
        retrievedTokens: 60,
        tokenReductionPct: 25,
        toolCalls: 5,
        latencyMs: 32,
        success: false,
        evidence: ["missing symbol"],
        notes: ["fallback search only"],
        tracePath: ".benchmarks/ai-context-engine/run-1/traces/task-2.jsonl",
      },
    ],
  });
}

describe("benchmark reporting", () => {
  it("serializes benchmark results with a stable JSON shape", () => {
    const results = createSyntheticResults();

    expect(serializeBenchmarkResults(results)).toBe(`{
  "schemaVersion": 1,
  "benchmarkName": "ai-context-engine",
  "benchmarkVersion": "2026.04",
  "repoSha": "abc123",
  "engineVersion": "1.2.3",
  "tokenizer": "cl100k_base",
  "runId": "abc123-20260415T120000Z",
  "machine": {
    "hostname": "ci",
    "platform": "linux",
    "arch": "x64",
    "nodeVersion": "24.0.0"
  },
  "corpus": {
    "schemaVersion": 1,
    "manifestPath": ".specs/benchmarks/ai-context-engine-benchmark-corpus.json",
    "benchmark": "ai-context-engine",
    "repo": "playground",
    "repoSha": "abc123",
    "tokenizer": "cl100k_base",
    "taskCount": 2
  },
  "workflows": [
    {
      "workflowId": "symbol-first",
      "label": "Symbol First",
      "description": "Start from symbols before reading source."
    }
  ],
  "tasks": [
    {
      "taskId": "task-1",
      "workflowId": "symbol-first",
      "allowedPaths": [
        "packages/ai-context-engine/**"
      ],
      "target": {
        "kind": "symbol",
        "value": "searchSymbols",
        "mode": "exact"
      },
      "baselineTokens": 120,
      "retrievedTokens": 40,
      "tokenReductionPct": 66.7,
      "toolCalls": 3,
      "latencyMs": 21,
      "success": true,
      "evidence": [
        "packages/ai-context-engine/src/index.ts"
      ],
      "notes": [
        "found by exact symbol lookup"
      ],
      "tracePath": ".benchmarks/ai-context-engine/run-1/traces/task-1.jsonl"
    },
    {
      "taskId": "task-2",
      "workflowId": "symbol-first",
      "allowedPaths": [
        "packages/ai-context-engine/**"
      ],
      "target": {
        "kind": "symbol",
        "value": "getContextBundle",
        "mode": "exact"
      },
      "baselineTokens": 80,
      "retrievedTokens": 60,
      "tokenReductionPct": 25,
      "toolCalls": 5,
      "latencyMs": 32,
      "success": false,
      "evidence": [
        "missing symbol"
      ],
      "notes": [
        "fallback search only"
      ],
      "tracePath": ".benchmarks/ai-context-engine/run-1/traces/task-2.jsonl"
    }
  ],
  "summary": {
    "taskCount": 2,
    "workflowCount": 1,
    "successCount": 1,
    "failureCount": 1,
    "baselineTokens": 200,
    "retrievedTokens": 100,
    "tokenReductionPct": 50
  }
}`);
  });

  it("renders a deterministic markdown report from synthetic results", () => {
    const results = createSyntheticResults();

    expect(renderBenchmarkReportMarkdown(results)).toBe(`# ai-context-engine Benchmark Report

## Benchmark Metadata
- Benchmark: \`ai-context-engine\`
- Benchmark Version: \`2026.04\`
- Repo SHA: \`abc123\`
- Engine Version: \`1.2.3\`
- Tokenizer: \`cl100k_base\`
- Run ID: \`abc123-20260415T120000Z\`

## Corpus Metadata
- Manifest Path: \`.specs/benchmarks/ai-context-engine-benchmark-corpus.json\`
- Repo: \`playground\`
- Repo SHA: \`abc123\`
- Tokenizer: \`cl100k_base\`
- Task Count: \`2\`

## Workflows
| Workflow ID | Label | Description |
| --- | --- | --- |
| symbol-first | Symbol First | Start from symbols before reading source. |

## Per-Task Results
| Task ID | Workflow | Success | Baseline Tokens | Retrieved Tokens | Reduction | Tool Calls | Latency (ms) | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| task-1 | symbol-first | yes | 120 | 40 | 66.7% | 3 | 21 | packages/ai-context-engine/src/index.ts | found by exact symbol lookup |
| task-2 | symbol-first | no | 80 | 60 | 25% | 5 | 32 | missing symbol | fallback search only |

## Per-Workflow Summary
| Workflow ID | Tasks | Success | Failures | Baseline Tokens | Retrieved Tokens | Reduction |
| --- | --- | --- | --- | --- | --- | --- |
| symbol-first | 2 | 1 | 1 | 200 | 100 | 50% |

## Grand Total
- Tasks: \`2\`
- Successes: \`1\`
- Failures: \`1\`
- Baseline Tokens: \`200\`
- Retrieved Tokens: \`100\`
- Reduction: \`50%\`

## Failure Notes
- task-2 / symbol-first: fallback search only
`);
  });
});
