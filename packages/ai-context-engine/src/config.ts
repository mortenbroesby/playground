import path from "node:path";

import type { EngineConfig, EnginePaths, EnginePhase1ToolName } from "./types.ts";

const DEFAULT_LANGUAGES = ["ts", "tsx", "js", "jsx"] as const;

export const ENGINE_STORAGE_DIRNAME = ".ai-context-engine";

export const ENGINE_PHASE_1_TOOLS: EnginePhase1ToolName[] = [
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

export function createDefaultEngineConfig(input: {
  repoRoot: string;
}): EngineConfig {
  return {
    repoRoot: input.repoRoot,
    languages: [...DEFAULT_LANGUAGES],
    respectGitIgnore: true,
    storageMode: "wal",
    staleStatus: "unknown",
    paths: resolveEnginePaths(input.repoRoot),
  };
}
