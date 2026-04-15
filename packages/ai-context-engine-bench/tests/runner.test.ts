import { readFileSync, rmSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { runBenchmark } from "../src/index.ts";
import { createBenchmarkFixtureRepo } from "./benchmark-fixture.ts";

describe("benchmark runner", () => {
  it("runs the checked-in benchmark corpus against a narrow workflow", async () => {
    const fixture = createBenchmarkFixtureRepo();
    const repoRoot = fixture.repoRoot;
    const outputDir = path.join(repoRoot, ".benchmarks", "run-1");

    try {
      const outcome = await runBenchmark({
        repoRoot,
        corpusPath: fixture.corpusPath,
        outputDir,
        taskId: "task-corpus-loader",
        workflowId: "symbol-first",
      });

      const results = JSON.parse(readFileSync(outcome.artifacts.resultsPath, "utf8"));
      expect(results.tasks).toHaveLength(1);
      expect(results.tokenizer).toBe("cl100k_base");
      expect(results.tasks[0]).toMatchObject({
        taskId: "task-corpus-loader",
        workflowId: "symbol-first",
        success: true,
      });
      expect(readFileSync(outcome.artifacts.reportPath, "utf8")).toContain(
        "# ai-context-engine Benchmark Report",
      );
    } finally {
      rmSync(fixture.repoRoot, { recursive: true, force: true });
    }
  });
});
