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
    approximateTokenizer: "tokenx",
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
        allowedPaths: ["tools/ai-context-engine/**"],
        target: {
          kind: "symbol",
          value: "searchSymbols",
          mode: "exact",
        },
        baselineTokens: 120,
        estimatedBaselineTokens: 126,
        retrievedTokens: 40,
        estimatedRetrievedTokens: 44,
        tokenReductionPct: 66.7,
        toolCalls: 3,
        latencyMs: 21,
        success: true,
        evidence: ["tools/ai-context-engine/src/index.ts"],
        notes: ["found by exact symbol lookup"],
      },
      {
        taskId: "task-2",
        workflowId: "symbol-first",
        allowedPaths: ["tools/ai-context-engine/**"],
        target: {
          kind: "symbol",
          value: "getContextBundle",
          mode: "exact",
        },
        baselineTokens: 80,
        estimatedBaselineTokens: 82,
        retrievedTokens: 60,
        estimatedRetrievedTokens: 61,
        tokenReductionPct: 25,
        toolCalls: 5,
        latencyMs: 32,
        success: false,
        evidence: ["missing symbol"],
        notes: ["fallback search only"],
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
  "approximateTokenizer": "tokenx",
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
        "tools/ai-context-engine/**"
      ],
      "target": {
        "kind": "symbol",
        "value": "searchSymbols",
        "mode": "exact"
      },
      "baselineTokens": 120,
      "estimatedBaselineTokens": 126,
      "retrievedTokens": 40,
      "estimatedRetrievedTokens": 44,
      "tokenReductionPct": 66.7,
      "toolCalls": 3,
      "latencyMs": 21,
      "success": true,
      "evidence": [
        "tools/ai-context-engine/src/index.ts"
      ],
      "notes": [
        "found by exact symbol lookup"
      ]
    },
    {
      "taskId": "task-2",
      "workflowId": "symbol-first",
      "allowedPaths": [
        "tools/ai-context-engine/**"
      ],
      "target": {
        "kind": "symbol",
        "value": "getContextBundle",
        "mode": "exact"
      },
      "baselineTokens": 80,
      "estimatedBaselineTokens": 82,
      "retrievedTokens": 60,
      "estimatedRetrievedTokens": 61,
      "tokenReductionPct": 25,
      "toolCalls": 5,
      "latencyMs": 32,
      "success": false,
      "evidence": [
        "missing symbol"
      ],
      "notes": [
        "fallback search only"
      ]
    }
  ],
  "summary": {
    "taskCount": 2,
    "workflowCount": 1,
    "successCount": 1,
    "failureCount": 1,
    "baselineTokens": 200,
    "estimatedBaselineTokens": 208,
    "retrievedTokens": 100,
    "estimatedRetrievedTokens": 105,
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
- Approximate Estimator: \`tokenx\`
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
| Task ID | Workflow | Success | Baseline Tokens | Est. Baseline | Retrieved Tokens | Est. Retrieved | Reduction | Tool Calls | Latency (ms) | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| task-1 | symbol-first | yes | 120 | 126 | 40 | 44 | 66.7% | 3 | 21 | tools/ai-context-engine/src/index.ts | found by exact symbol lookup |
| task-2 | symbol-first | no | 80 | 82 | 60 | 61 | 25% | 5 | 32 | missing symbol | fallback search only |

## Per-Workflow Summary
| Workflow ID | Tasks | Success | Failures | Baseline Tokens | Retrieved Tokens | Reduction |
| --- | --- | --- | --- | --- | --- | --- |
| symbol-first | 2 | 1 | 1 | 200 | 100 | 50% |

## Grand Total
- Tasks: \`2\`
- Successes: \`1\`
- Failures: \`1\`
- Baseline Tokens: \`200\`
- Estimated Baseline Tokens: \`208\`
- Retrieved Tokens: \`100\`
- Estimated Retrieved Tokens: \`105\`
- Reduction: \`50%\`

## Failure Notes
- task-2 / symbol-first: fallback search only
`);
  });
});
