import { cpSync, existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testsDir = path.dirname(fileURLToPath(import.meta.url));

export const workspaceRoot = [
  path.resolve(testsDir, "..", "..", ".."),
  path.resolve(process.cwd(), "..", ".."),
  process.cwd(),
]
  .filter((candidate, index, array) => array.indexOf(candidate) === index)
  .find((candidate) => existsSync(path.join(candidate, ".specs", "benchmarks"))) ??
  path.resolve(testsDir, "..", "..", "..");

export interface BenchmarkFixtureRepo {
  repoRoot: string;
  corpusPath: string;
}

export function createBenchmarkFixtureRepo(): BenchmarkFixtureRepo {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), "aice-bench-"));
  const corpusSourceDir = path.join(workspaceRoot, ".specs", "benchmarks");
  const corpusTargetDir = path.join(repoRoot, ".specs", "benchmarks");

  cpSync(corpusSourceDir, corpusTargetDir, { recursive: true });
  mkdirSync(path.join(repoRoot, "packages", "ai-context-engine-bench", "src"), {
    recursive: true,
  });
  writeFileSync(
    path.join(repoRoot, "packages", "ai-context-engine-bench", "src", "corpus.ts"),
    `export function loadBenchmarkCorpus(): string {
  return "loaded";
}
`,
  );

  return {
    repoRoot,
    corpusPath: path.join(
      repoRoot,
      ".specs",
      "benchmarks",
      "ai-context-engine-benchmark-corpus.json",
    ),
  };
}
