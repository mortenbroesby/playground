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

export type SymbolKind =
  | "function"
  | "class"
  | "method"
  | "constant"
  | "type";

export interface IndexSummary {
  indexedFiles: number;
  indexedSymbols: number;
  skippedFiles: number;
  staleStatus: StaleStatus;
}

export interface RepoOutline {
  totalFiles: number;
  totalSymbols: number;
  languages: Partial<Record<SupportedLanguage, number>>;
}

export interface FileTreeEntry {
  path: string;
  language: SupportedLanguage;
  symbolCount: number;
}

export interface SymbolSummary {
  id: string;
  name: string;
  qualifiedName: string | null;
  kind: SymbolKind;
  filePath: string;
  signature: string;
  summary: string;
  startLine: number;
  endLine: number;
  exported: boolean;
}

export interface FileOutline {
  filePath: string;
  symbols: SymbolSummary[];
}

export interface SearchSymbolsOptions {
  repoRoot: string;
  query: string;
  kind?: SymbolKind;
  limit?: number;
}

export interface SearchTextMatch {
  filePath: string;
  line: number;
  preview: string;
}

export interface FileContentResult {
  filePath: string;
  content: string;
}

export interface SymbolSourceResult {
  symbol: SymbolSummary;
  source: string;
  verified: boolean;
}

export type ContextBundleItemRole = "target" | "dependency";

export interface ContextBundleItem {
  role: ContextBundleItemRole;
  reason: string;
  symbol: SymbolSummary;
  source: string;
  tokenCount: number;
}

export interface ContextBundle {
  repoRoot: string;
  query: string | null;
  tokenBudget: number;
  estimatedTokens: number;
  usedTokens: number;
  truncated: boolean;
  items: ContextBundleItem[];
}

export interface ContextBundleOptions {
  repoRoot: string;
  query?: string;
  symbolIds?: string[];
  tokenBudget?: number;
}

export interface DiagnosticsResult {
  storageDir: string;
  databasePath: string;
  storageMode: StorageMode;
  staleStatus: StaleStatus;
  indexedAt: string | null;
  indexAgeMs: number | null;
  indexedFiles: number;
  indexedSymbols: number;
  currentFiles: number;
  missingFiles: number;
  changedFiles: number;
  extraFiles: number;
  indexedSnapshotHash: string | null;
  currentSnapshotHash: string | null;
  staleReasons: string[];
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
  | "get_context_bundle"
  | "get_file_content"
  | "get_symbol_source"
  | "diagnostics";
