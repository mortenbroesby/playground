export type SupportedLanguage = "ts" | "tsx" | "js" | "jsx";

export type StorageMode = "wal";

export type StaleStatus = "unknown" | "fresh" | "stale";

export interface EnginePaths {
  storageDir: string;
  databasePath: string;
  repoMetaPath: string;
  integrityPath: string;
  rawCacheDir: string;
}

export interface EngineConfig {
  repoRoot: string;
  languages: SupportedLanguage[];
  respectGitIgnore: boolean;
  storageMode: StorageMode;
  staleStatus: StaleStatus;
  paths: EnginePaths;
}

export type EnginePhase1ToolName =
  | "init"
  | "index_folder"
  | "index_file"
  | "get_repo_outline"
  | "get_file_tree"
  | "get_file_outline"
  | "suggest_initial_queries"
  | "search_symbols"
  | "search_text"
  | "get_file_content"
  | "get_symbol_source"
  | "diagnostics";
