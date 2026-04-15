import type {
  BenchmarkResults,
  BenchmarkResultsInput,
  BenchmarkTaskResult,
  BenchmarkWorkflowDefinition,
} from "./types.ts";

function normalizePercentage(value: number): string {
  if (Number.isInteger(value)) {
    return `${value}`;
  }

  return value.toFixed(1).replace(/\.0$/, "");
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
}

function joinCellValues(values: readonly string[]): string {
  if (!values.length) {
    return "-";
  }

  return values.map(escapeTableCell).join("<br>");
}

function compareWorkflowOrder(
  left: BenchmarkWorkflowDefinition,
  right: BenchmarkWorkflowDefinition,
  indexByWorkflowId: Map<string, number>,
): number {
  return (
    (indexByWorkflowId.get(left.workflowId) ?? Number.MAX_SAFE_INTEGER) -
    (indexByWorkflowId.get(right.workflowId) ?? Number.MAX_SAFE_INTEGER) ||
    left.workflowId.localeCompare(right.workflowId)
  );
}

function summarizeTasks(tasks: readonly BenchmarkTaskResult[]) {
  const baselineTokens = tasks.reduce((sum, task) => sum + task.baselineTokens, 0);
  const retrievedTokens = tasks.reduce((sum, task) => sum + task.retrievedTokens, 0);
  const successCount = tasks.filter((task) => task.success).length;
  const failureCount = tasks.length - successCount;
  const tokenReductionPct =
    baselineTokens === 0
      ? 0
      : Math.round(((baselineTokens - retrievedTokens) / baselineTokens) * 1000) / 10;

  return {
    taskCount: tasks.length,
    successCount,
    failureCount,
    baselineTokens,
    retrievedTokens,
    tokenReductionPct,
  };
}

export function createBenchmarkResultsArtifact(
  input: BenchmarkResultsInput,
): BenchmarkResults {
  const summary = summarizeTasks(input.tasks);

  return {
    schemaVersion: input.schemaVersion ?? 1,
    benchmarkName: input.benchmarkName,
    benchmarkVersion: input.benchmarkVersion,
    repoSha: input.repoSha,
    engineVersion: input.engineVersion,
    tokenizer: input.tokenizer,
    runId: input.runId,
    machine: {
      hostname: input.machine.hostname,
      platform: input.machine.platform,
      arch: input.machine.arch,
      nodeVersion: input.machine.nodeVersion,
    },
    corpus: {
      schemaVersion: input.corpus.schemaVersion,
      manifestPath: input.corpus.manifestPath,
      benchmark: input.corpus.benchmark,
      repo: input.corpus.repo,
      repoSha: input.corpus.repoSha,
      tokenizer: input.corpus.tokenizer,
      taskCount: input.corpus.taskCount ?? input.tasks.length,
    },
    workflows: input.workflows.map((workflow) => ({
      workflowId: workflow.workflowId,
      label: workflow.label,
      ...(workflow.description ? { description: workflow.description } : {}),
    })),
    tasks: input.tasks.map((task) => ({
      taskId: task.taskId,
      workflowId: task.workflowId,
      allowedPaths: [...task.allowedPaths],
      target: {
        kind: task.target.kind,
        value: task.target.value,
        mode: task.target.mode,
      },
      baselineTokens: task.baselineTokens,
      retrievedTokens: task.retrievedTokens,
      tokenReductionPct: task.tokenReductionPct,
      toolCalls: task.toolCalls,
      latencyMs: task.latencyMs,
      success: task.success,
      evidence: [...task.evidence],
      notes: [...task.notes],
    })),
    summary: {
      taskCount: summary.taskCount,
      workflowCount: input.workflows.length,
      successCount: summary.successCount,
      failureCount: summary.failureCount,
      baselineTokens: summary.baselineTokens,
      retrievedTokens: summary.retrievedTokens,
      tokenReductionPct: summary.tokenReductionPct,
    },
  };
}

export function serializeBenchmarkResults(results: BenchmarkResults): string {
  return JSON.stringify(results, null, 2);
}

export function renderBenchmarkReportMarkdown(results: BenchmarkResults): string {
  const workflowIndex = new Map(
    results.workflows.map((workflow, index) => [workflow.workflowId, index]),
  );
  const sortedWorkflows = [...results.workflows].sort((left, right) =>
    compareWorkflowOrder(left, right, workflowIndex),
  );
  const workflowSummaries = sortedWorkflows.map((workflow) => {
    const workflowTasks = results.tasks.filter(
      (task) => task.workflowId === workflow.workflowId,
    );
    const summary = summarizeTasks(workflowTasks);

    return {
      workflow,
      summary,
    };
  });

  const lines = [
    `# ${results.benchmarkName} Benchmark Report`,
    "",
    "## Benchmark Metadata",
    `- Benchmark: \`${results.benchmarkName}\``,
    `- Benchmark Version: \`${results.benchmarkVersion}\``,
    `- Repo SHA: \`${results.repoSha}\``,
    `- Engine Version: \`${results.engineVersion}\``,
    `- Tokenizer: \`${results.tokenizer}\``,
    `- Run ID: \`${results.runId}\``,
    "",
    "## Corpus Metadata",
    `- Manifest Path: \`${results.corpus.manifestPath}\``,
    `- Repo: \`${results.corpus.repo}\``,
    `- Repo SHA: \`${results.corpus.repoSha}\``,
    `- Tokenizer: \`${results.corpus.tokenizer}\``,
    `- Task Count: \`${results.corpus.taskCount}\``,
    "",
    "## Workflows",
    "| Workflow ID | Label | Description |",
    "| --- | --- | --- |",
    ...sortedWorkflows.map(
      (workflow) =>
        `| ${escapeTableCell(workflow.workflowId)} | ${escapeTableCell(workflow.label)} | ${escapeTableCell(workflow.description ?? "-")} |`,
    ),
    "",
    "## Per-Task Results",
    "| Task ID | Workflow | Success | Baseline Tokens | Retrieved Tokens | Reduction | Tool Calls | Latency (ms) | Evidence | Notes |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...results.tasks.map(
      (task) =>
        `| ${escapeTableCell(task.taskId)} | ${escapeTableCell(task.workflowId)} | ${
          task.success ? "yes" : "no"
        } | ${task.baselineTokens} | ${task.retrievedTokens} | ${normalizePercentage(task.tokenReductionPct)}% | ${task.toolCalls} | ${task.latencyMs} | ${joinCellValues(task.evidence)} | ${joinCellValues(task.notes)} |`,
    ),
    "",
    "## Per-Workflow Summary",
    "| Workflow ID | Tasks | Success | Failures | Baseline Tokens | Retrieved Tokens | Reduction |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...workflowSummaries.map(
      ({ workflow, summary }) =>
        `| ${escapeTableCell(workflow.workflowId)} | ${summary.taskCount} | ${summary.successCount} | ${summary.failureCount} | ${summary.baselineTokens} | ${summary.retrievedTokens} | ${normalizePercentage(summary.tokenReductionPct)}% |`,
    ),
    "",
    "## Grand Total",
    `- Tasks: \`${results.summary.taskCount}\``,
    `- Successes: \`${results.summary.successCount}\``,
    `- Failures: \`${results.summary.failureCount}\``,
    `- Baseline Tokens: \`${results.summary.baselineTokens}\``,
    `- Retrieved Tokens: \`${results.summary.retrievedTokens}\``,
    `- Reduction: \`${normalizePercentage(results.summary.tokenReductionPct)}%\``,
    "",
    "## Failure Notes",
    ...(
      results.tasks.filter((task) => !task.success).length
        ? results.tasks
            .filter((task) => !task.success)
            .map(
              (task) =>
                `- ${escapeTableCell(task.taskId)} / ${escapeTableCell(task.workflowId)}: ${joinCellValues(task.notes)}`,
            )
        : ["- None"]
    ),
  ];

  return `${lines.join("\n")}\n`;
}
