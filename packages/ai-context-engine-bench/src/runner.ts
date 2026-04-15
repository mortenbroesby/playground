import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { indexFolder } from "@playground/ai-context-engine";

import { loadBenchmarkCorpus } from "./corpus.ts";
import {
  createBenchmarkResultsArtifact,
  renderBenchmarkReportMarkdown,
  serializeBenchmarkResults,
} from "./report.ts";
import { assertStrictSnapshot, getRepoSnapshot } from "./snapshot.ts";
import { BENCHMARK_TOKENIZER } from "./tokenizer.ts";
import { computeBaselineForTask, getWorkflowDefinition, runWorkflowTask } from "./workflows.ts";
import type { BenchmarkRunOptions, BenchmarkRunOutcome } from "./types.ts";

function makeRunId(repoSha: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${repoSha.slice(0, 7)}-${timestamp}`;
}

export async function runBenchmark(
  options: BenchmarkRunOptions,
): Promise<BenchmarkRunOutcome> {
  const corpus = loadBenchmarkCorpus(options.corpusPath);
  const snapshot = getRepoSnapshot(options.repoRoot);

  if (options.strict) {
    assertStrictSnapshot(snapshot, corpus.manifest.repoSha);
  }

  const repoSha = snapshot.repoSha ?? corpus.manifest.repoSha;
  const tasks = corpus.tasks.filter((task) =>
    (!options.taskId || task.manifest.id === options.taskId) &&
    (!options.workflowId || task.manifest.workflows.includes(options.workflowId))
  );

  if (tasks.length === 0) {
    throw new Error("No benchmark tasks matched the requested filters");
  }

  await indexFolder({ repoRoot: options.repoRoot });

  const taskResults = [];
  const workflowIds = new Set<string>();

  for (const task of tasks) {
    for (const workflowId of task.manifest.workflows) {
      if (options.workflowId && workflowId !== options.workflowId) {
        continue;
      }
      workflowIds.add(workflowId);
      const baselineTokens = await computeBaselineForTask(options.repoRoot, task);
      const startedAt = Date.now();
      const result = await runWorkflowTask({
        repoRoot: options.repoRoot,
        task,
        workflowId,
      });
      const latencyMs = Date.now() - startedAt;
      const tokenReductionPct =
        baselineTokens === 0
          ? 0
          : Math.round(((baselineTokens - result.retrievedTokens) / baselineTokens) * 1000) / 10;
      taskResults.push({
        taskId: task.manifest.id,
        workflowId,
        allowedPaths: [...task.manifest.allowedPaths],
        target: task.manifest.targets[0],
        baselineTokens,
        retrievedTokens: result.retrievedTokens,
        tokenReductionPct,
        toolCalls: result.toolCalls,
        latencyMs,
        success: result.success,
        evidence: result.evidence,
        notes: result.notes,
        tracePath: path.join("traces", `${task.manifest.id}-${workflowId}.jsonl`),
      });
    }
  }

  const runId = makeRunId(repoSha);
  const results = createBenchmarkResultsArtifact({
    benchmarkName: corpus.manifest.benchmark,
    benchmarkVersion: "0.0.1",
    repoSha,
    engineVersion: "0.0.1",
    tokenizer: BENCHMARK_TOKENIZER,
    runId,
    machine: {
      hostname: os.hostname(),
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
    },
    corpus: {
      schemaVersion: corpus.manifest.schemaVersion,
      manifestPath: options.corpusPath,
      benchmark: corpus.manifest.benchmark,
      repo: corpus.manifest.repo,
      repoSha: corpus.manifest.repoSha,
      tokenizer: corpus.manifest.tokenizer,
      taskCount: taskResults.length,
    },
    workflows: [...workflowIds].map((workflowId) => {
      const workflow = getWorkflowDefinition(workflowId);
      return {
        workflowId,
        label: workflow.label,
        description: workflow.description,
      };
    }),
    tasks: taskResults,
  });

  const runDir = path.resolve(options.outputDir);
  await mkdir(runDir, { recursive: true });
  await mkdir(path.join(runDir, "traces"), { recursive: true });

  const resultsPath = path.join(runDir, "results.json");
  const reportPath = path.join(runDir, "report.md");
  const corpusLockPath = path.join(runDir, "corpus.lock.json");
  await writeFile(resultsPath, `${serializeBenchmarkResults(results)}\n`);
  await writeFile(reportPath, renderBenchmarkReportMarkdown(results));
  await writeFile(
    corpusLockPath,
    `${JSON.stringify(
      {
        manifest: corpus.manifest,
        snapshot,
        strict: options.strict ?? false,
      },
      null,
      2,
    )}\n`,
  );

  return {
    results,
    artifacts: {
      resultsPath,
      reportPath,
      corpusLockPath,
    },
  };
}
