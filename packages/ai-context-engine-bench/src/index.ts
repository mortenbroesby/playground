export {
  loadBenchmarkCorpus,
  loadBenchmarkCorpusManifest,
  loadBenchmarkTaskCard,
} from "./corpus.ts";
export { runBenchmark } from "./runner.ts";
export {
  WORKFLOWS,
  computeBaselineForTask,
  getWorkflowDefinition,
  runWorkflowTask,
} from "./workflows.ts";
export {
  BENCHMARK_TOKENIZER,
  countTokens,
  disposeTokenizer,
} from "./tokenizer.ts";
export {
  assertStrictSnapshot,
  getRepoSnapshot,
} from "./snapshot.ts";

export type {
  BenchmarkCorpus,
  BenchmarkCorpusManifest,
  BenchmarkCorpusManifestTask,
  BenchmarkCorpusTask,
  BenchmarkTarget,
  BenchmarkTaskCard,
  BenchmarkTaskCardFrontmatter,
  BenchmarkRunOptions,
  BenchmarkRunOutcome,
} from "./types.ts";

export * from "./report.ts";
export * from "./types.ts";

export interface BenchmarkPackageScaffold {
  packageName: "@playground/ai-context-engine-bench";
  dependsOn: "@playground/ai-context-engine";
}

export const BENCHMARK_PACKAGE_SCAFFOLD: BenchmarkPackageScaffold = {
  packageName: "@playground/ai-context-engine-bench",
  dependsOn: "@playground/ai-context-engine",
};
