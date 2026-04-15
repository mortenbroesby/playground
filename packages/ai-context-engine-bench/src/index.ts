export {
  loadBenchmarkCorpus,
  loadBenchmarkCorpusManifest,
  loadBenchmarkTaskCard,
} from "./corpus.ts";

export type {
  BenchmarkCorpus,
  BenchmarkCorpusManifest,
  BenchmarkCorpusManifestTask,
  BenchmarkCorpusTask,
  BenchmarkTarget,
  BenchmarkTaskCard,
  BenchmarkTaskCardFrontmatter,
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
