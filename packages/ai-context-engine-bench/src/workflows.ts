import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  getContextBundle,
  getFileContent,
  getFileOutline,
  getFileTree,
  getSymbolSource,
  searchSymbols,
  searchText,
} from "@playground/ai-context-engine";

import { countTokens } from "./tokenizer.ts";
import type { BenchmarkCorpusTask } from "./types.ts";

export interface WorkflowExecutionResult {
  retrievedTokens: number;
  toolCalls: number;
  evidence: string[];
  notes: string[];
  success: boolean;
}

export interface WorkflowDefinition {
  workflowId: string;
  label: string;
  description: string;
  run(input: {
    repoRoot: string;
    task: BenchmarkCorpusTask;
  }): Promise<WorkflowExecutionResult>;
}

function matchesAllowedPath(filePath: string, allowedPaths: readonly string[]): boolean {
  return allowedPaths.some((pattern) => {
    if (pattern.endsWith("/**")) {
      return filePath.startsWith(pattern.slice(0, -3));
    }
    return filePath === pattern;
  });
}

async function computeBaselineTokens(repoRoot: string, task: BenchmarkCorpusTask) {
  const fileTree = await getFileTree({ repoRoot });
  const relevantFiles = fileTree.filter((file) =>
    matchesAllowedPath(file.path, task.manifest.allowedPaths),
  );
  let total = 0;
  for (const file of relevantFiles) {
    const content = await readFile(path.join(repoRoot, file.path), "utf8");
    total += countTokens(content);
  }
  return total;
}

function successForTask(task: BenchmarkCorpusTask, evidence: readonly string[]): boolean {
  return task.manifest.targets.some((target) =>
    evidence.some((item) =>
      target.mode === "exact" ? item === target.value : item.includes(target.value),
    ),
  );
}

const baselineWorkflow: WorkflowDefinition = {
  workflowId: "baseline",
  label: "Baseline",
  description: "Read all eligible files in the allowed task slice.",
  async run({ repoRoot, task }) {
    const fileTree = await getFileTree({ repoRoot });
    const relevantFiles = fileTree.filter((file) =>
      matchesAllowedPath(file.path, task.manifest.allowedPaths),
    );
    let tokenCount = 0;
    const evidence: string[] = [];

    for (const file of relevantFiles) {
      const content = await readFile(path.join(repoRoot, file.path), "utf8");
      tokenCount += countTokens(content);
      for (const target of task.manifest.targets) {
        if (content.includes(target.value)) {
          evidence.push(file.path, target.value);
        }
      }
    }

    return {
      retrievedTokens: tokenCount,
      toolCalls: 1,
      evidence,
      notes: ["baseline read-all slice"],
      success: successForTask(task, evidence),
    };
  },
};

const symbolFirstWorkflow: WorkflowDefinition = {
  workflowId: "symbol-first",
  label: "Symbol First",
  description: "Search symbols then fetch exact symbol source.",
  async run({ repoRoot, task }) {
    const matches = await searchSymbols({
      repoRoot,
      query: task.frontmatter.query,
      limit: 3,
    });
    let retrievedTokens = countTokens(JSON.stringify(matches));
    const evidence: string[] = matches.map((item) => item.name);
    const notes: string[] = [];
    let toolCalls = 1;

    if (matches[0]) {
      const source = await getSymbolSource({
        repoRoot,
        symbolId: matches[0].id,
        verify: true,
      });
      retrievedTokens += countTokens(source.source);
      evidence.push(source.symbol.name, source.symbol.filePath);
      toolCalls += 1;
    } else {
      notes.push("no symbol match");
    }

    return {
      retrievedTokens,
      toolCalls,
      evidence,
      notes,
      success: successForTask(task, evidence),
    };
  },
};

const textFirstWorkflow: WorkflowDefinition = {
  workflowId: "text-first",
  label: "Text First",
  description: "Search raw text then fetch matching file content.",
  async run({ repoRoot, task }) {
    const matches = await searchText({
      repoRoot,
      query: task.frontmatter.query,
    });
    let retrievedTokens = countTokens(JSON.stringify(matches));
    const evidence = matches.map((item) => `${item.filePath}:${item.line}`);
    const notes: string[] = [];
    let toolCalls = 1;

    if (matches[0]) {
      const file = await getFileContent({
        repoRoot,
        filePath: matches[0].filePath,
      });
      retrievedTokens += countTokens(file.content);
      evidence.push(file.filePath, file.content);
      toolCalls += 1;
    } else {
      notes.push("no text match");
    }

    return {
      retrievedTokens,
      toolCalls,
      evidence,
      notes,
      success: successForTask(task, evidence),
    };
  },
};

const discoveryFirstWorkflow: WorkflowDefinition = {
  workflowId: "discovery-first",
  label: "Discovery First",
  description: "Outline before retrieval.",
  async run({ repoRoot, task }) {
    const fileTree = await getFileTree({ repoRoot });
    const relevantFiles = fileTree.filter((file) =>
      matchesAllowedPath(file.path, task.manifest.allowedPaths),
    );
    let retrievedTokens = countTokens(JSON.stringify(relevantFiles));
    const evidence = relevantFiles.map((file) => file.path);
    const notes: string[] = [];
    let toolCalls = 1;

    if (relevantFiles[0]) {
      const outline = await getFileOutline({
        repoRoot,
        filePath: relevantFiles[0].path,
      });
      retrievedTokens += countTokens(JSON.stringify(outline));
      evidence.push(
        relevantFiles[0].path,
        ...outline.symbols.map((symbol) => symbol.name),
      );
      toolCalls += 1;
    } else {
      notes.push("no relevant files");
    }

    return {
      retrievedTokens,
      toolCalls,
      evidence,
      notes,
      success: successForTask(task, evidence),
    };
  },
};

const bundleWorkflow: WorkflowDefinition = {
  workflowId: "bundle",
  label: "Bundle",
  description: "Query-driven bounded context assembly.",
  async run({ repoRoot, task }) {
    const bundle = await getContextBundle({
      repoRoot,
      query: task.frontmatter.query,
      tokenBudget: 400,
    });
    return {
      retrievedTokens: bundle.usedTokens,
      toolCalls: 1,
      evidence: bundle.items.flatMap((item) => [
        item.symbol.name,
        item.symbol.filePath,
      ]),
      notes: bundle.truncated ? ["bundle truncated"] : [],
      success: successForTask(
        task,
        bundle.items.map((item) => item.symbol.name),
      ),
    };
  },
};

export const WORKFLOWS: WorkflowDefinition[] = [
  baselineWorkflow,
  discoveryFirstWorkflow,
  symbolFirstWorkflow,
  textFirstWorkflow,
  bundleWorkflow,
];

export function getWorkflowDefinition(workflowId: string): WorkflowDefinition {
  const workflow = WORKFLOWS.find((entry) => entry.workflowId === workflowId);
  if (!workflow) {
    throw new Error(`Unknown workflow: ${workflowId}`);
  }
  return workflow;
}

export async function runWorkflowTask(input: {
  repoRoot: string;
  task: BenchmarkCorpusTask;
  workflowId: string;
}): Promise<WorkflowExecutionResult> {
  return getWorkflowDefinition(input.workflowId).run(input);
}

export async function computeBaselineForTask(
  repoRoot: string,
  task: BenchmarkCorpusTask,
) {
  return computeBaselineTokens(repoRoot, task);
}
