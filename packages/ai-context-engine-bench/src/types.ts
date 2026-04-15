export interface BenchmarkMachineInfo {
  hostname: string;
  platform: string;
  arch: string;
  nodeVersion: string;
}

export interface BenchmarkCorpusMetadata {
  schemaVersion: number;
  manifestPath: string;
  benchmark: string;
  repo: string;
  repoSha: string;
  tokenizer: string;
  taskCount: number;
}

export interface BenchmarkCorpusMetadataInput
  extends Omit<BenchmarkCorpusMetadata, "taskCount"> {
  taskCount?: number;
}

export interface BenchmarkWorkflowDefinition {
  workflowId: string;
  label: string;
  description?: string;
}

export interface BenchmarkTaskTarget {
  kind: string;
  value: string;
  mode: string;
}

export interface BenchmarkTaskResult {
  taskId: string;
  workflowId: string;
  allowedPaths: string[];
  target: BenchmarkTaskTarget;
  baselineTokens: number;
  retrievedTokens: number;
  tokenReductionPct: number;
  toolCalls: number;
  latencyMs: number;
  success: boolean;
  evidence: string[];
  notes: string[];
  tracePath: string;
}

export interface BenchmarkSummary {
  taskCount: number;
  workflowCount: number;
  successCount: number;
  failureCount: number;
  baselineTokens: number;
  retrievedTokens: number;
  tokenReductionPct: number;
}

export interface BenchmarkResults {
  schemaVersion: number;
  benchmarkName: string;
  benchmarkVersion: string;
  repoSha: string;
  engineVersion: string;
  tokenizer: string;
  runId: string;
  machine: BenchmarkMachineInfo;
  corpus: BenchmarkCorpusMetadata;
  workflows: BenchmarkWorkflowDefinition[];
  tasks: BenchmarkTaskResult[];
  summary: BenchmarkSummary;
}

export interface BenchmarkResultsInput {
  schemaVersion?: number;
  benchmarkName: string;
  benchmarkVersion: string;
  repoSha: string;
  engineVersion: string;
  tokenizer: string;
  runId: string;
  machine: BenchmarkMachineInfo;
  corpus: BenchmarkCorpusMetadataInput;
  workflows: readonly BenchmarkWorkflowDefinition[];
  tasks: readonly BenchmarkTaskResult[];
}

export interface BenchmarkTarget extends BenchmarkTaskTarget {}

export interface BenchmarkTaskCardFrontmatter {
  id: string;
  slice: string;
  query: string;
  workflowSet: readonly string[];
  allowedPaths: readonly string[];
  targets: readonly BenchmarkTarget[];
  successCriteria: readonly string[];
  alternateTargets?: readonly BenchmarkTarget[];
  notes?: string;
  excludedPaths?: readonly string[];
  expectedArtifacts?: readonly string[];
}

export interface BenchmarkCorpusManifestTask {
  id: string;
  path: string;
  slice: string;
  workflows: readonly string[];
  allowedPaths: readonly string[];
  targets: readonly BenchmarkTarget[];
}

export interface BenchmarkCorpusManifest {
  schemaVersion: 1;
  benchmark: string;
  repo: string;
  repoSha: string;
  tokenizer: string;
  tasks: readonly BenchmarkCorpusManifestTask[];
}

export interface BenchmarkTaskCard {
  path: string;
  frontmatter: BenchmarkTaskCardFrontmatter;
  body: string;
  manifest?: BenchmarkCorpusManifestTask;
}

export interface BenchmarkCorpusTask extends BenchmarkTaskCard {
  manifest: BenchmarkCorpusManifestTask;
}

export interface BenchmarkCorpus {
  manifestPath: string;
  manifest: BenchmarkCorpusManifest;
  tasks: readonly BenchmarkCorpusTask[];
}
