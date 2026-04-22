import path from "node:path";

import type {
  EngineConfig,
  EnginePaths,
  EngineToolName,
  SymbolKind,
  SummaryStrategy,
} from "./types.ts";

const DEFAULT_LANGUAGES = ["ts", "tsx", "js", "jsx"] as const;

export const ENGINE_STORAGE_DIRNAME = ".ai-context-engine";
export const DEFAULT_SUMMARY_STRATEGY: SummaryStrategy = "doc-comments-first";
const SUMMARY_STRATEGIES = new Set<SummaryStrategy>([
  "doc-comments-first",
  "signature-only",
]);
const SYMBOL_KINDS = new Set<SymbolKind>([
  "function",
  "class",
  "method",
  "constant",
  "type",
]);

export const ENGINE_TOOLS: EngineToolName[] = [
  "init",
  "index_folder",
  "index_file",
  "get_repo_outline",
  "get_file_tree",
  "get_file_outline",
  "suggest_initial_queries",
  "search_symbols",
  "search_text",
  "get_context_bundle",
  "get_file_content",
  "get_symbol_source",
  "diagnostics",
];

export function resolveEnginePaths(repoRoot: string): EnginePaths {
  const storageDir = path.join(repoRoot, ENGINE_STORAGE_DIRNAME);

  return {
    storageDir,
    databasePath: path.join(storageDir, "index.sqlite"),
    repoMetaPath: path.join(storageDir, "repo-meta.json"),
    integrityPath: path.join(storageDir, "integrity.sha256"),
    rawCacheDir: path.join(storageDir, "raw-cache"),
  };
}

export function isSummaryStrategy(value: unknown): value is SummaryStrategy {
  return typeof value === "string" && SUMMARY_STRATEGIES.has(value as SummaryStrategy);
}

export function parseSummaryStrategy(
  value: unknown,
  label = "summaryStrategy",
): SummaryStrategy {
  if (!isSummaryStrategy(value)) {
    throw new Error(
      `Unsupported ${label}: ${String(value)}. Expected one of: ${[...SUMMARY_STRATEGIES].join(", ")}`,
    );
  }

  return value;
}

export function normalizeSummaryStrategy(value: unknown): SummaryStrategy {
  return isSummaryStrategy(value) ? value : DEFAULT_SUMMARY_STRATEGY;
}

export function isSymbolKind(value: unknown): value is SymbolKind {
  return typeof value === "string" && SYMBOL_KINDS.has(value as SymbolKind);
}

export function parseSymbolKind(
  value: unknown,
  label = "kind",
): SymbolKind {
  if (!isSymbolKind(value)) {
    throw new Error(
      `Unsupported ${label}: ${String(value)}. Expected one of: ${[...SYMBOL_KINDS].join(", ")}`,
    );
  }

  return value;
}

export function createDefaultEngineConfig(input: {
  repoRoot: string;
  summaryStrategy?: SummaryStrategy;
}): EngineConfig {
  return {
    repoRoot: input.repoRoot,
    languages: [...DEFAULT_LANGUAGES],
    respectGitIgnore: true,
    storageMode: "wal",
    staleStatus: "unknown",
    summaryStrategy:
      input.summaryStrategy === undefined
        ? DEFAULT_SUMMARY_STRATEGY
        : parseSummaryStrategy(input.summaryStrategy),
    paths: resolveEnginePaths(input.repoRoot),
  };
}
