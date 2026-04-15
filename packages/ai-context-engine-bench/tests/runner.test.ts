import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { runBenchmark } from "../src/index.ts";

function makeFixtureRepo() {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), "aice-bench-run-"));
  mkdirSync(path.join(repoRoot, "src"), { recursive: true });
  mkdirSync(path.join(repoRoot, ".specs", "benchmarks", "tasks"), {
    recursive: true,
  });
  writeFileSync(
    path.join(repoRoot, "src", "math.ts"),
    `export function area(radius: number): number {
  return radius * radius * 3.14;
}
`,
  );

  writeFileSync(
    path.join(repoRoot, ".specs", "benchmarks", "ai-context-engine-benchmark-corpus.json"),
    JSON.stringify(
      {
        schemaVersion: 1,
        benchmark: "ai-context-engine",
        repo: "playground",
        repoSha: "fixture-sha",
        tokenizer: "cl100k_base",
        tasks: [
          {
            id: "task-area",
            path: "tasks/task-area.md",
            slice: "src",
            workflows: ["symbol-first", "baseline"],
            allowedPaths: ["src/**"],
            targets: [{ kind: "symbol", value: "area", mode: "exact" }],
          },
        ],
      },
      null,
      2,
    ),
  );

  writeFileSync(
    path.join(repoRoot, ".specs", "benchmarks", "tasks", "task-area.md"),
    `---
id: task-area
slice: src
query: area
workflowSet: [symbol-first, baseline]
allowedPaths:
  - src/**
targets:
  - kind: symbol
    value: area
    mode: exact
successCriteria:
  - exact symbol source is retrieved
---

Find the area function.
`,
  );

  return repoRoot;
}

describe("benchmark runner", () => {
  it("runs a filtered benchmark task and writes stable artifacts", async () => {
    const repoRoot = makeFixtureRepo();
    const outputDir = path.join(repoRoot, ".benchmarks", "run-1");

    try {
      const outcome = await runBenchmark({
        repoRoot,
        corpusPath: path.join(
          repoRoot,
          ".specs",
          "benchmarks",
          "ai-context-engine-benchmark-corpus.json",
        ),
        outputDir,
        taskId: "task-area",
        workflowId: "symbol-first",
      });

      const results = JSON.parse(readFileSync(outcome.artifacts.resultsPath, "utf8"));
      expect(results.tasks).toHaveLength(1);
      expect(results.tokenizer).toBe("cl100k_base");
      expect(results.tasks[0]).toMatchObject({
        taskId: "task-area",
        workflowId: "symbol-first",
        success: true,
      });
      expect(readFileSync(outcome.artifacts.reportPath, "utf8")).toContain(
        "# ai-context-engine Benchmark Report",
      );
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });
});
