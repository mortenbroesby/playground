export type SupportedLanguage = "ts" | "tsx" | "js" | "jsx";

export type StorageMode = "wal";
export type IndexBackendName = "sqlite";

export type StaleStatus = "unknown" | "fresh" | "stale";

export type SummaryStrategy = "doc-comments-first" | "signature-only";

export type SummarySource = "doc-comment" | "signature";

export interface EnginePaths {
  storageDir: string;
  databasePath: string;
  repoMetaPath: string;
  integrityPath: string;
  storageVersionPath: string;
  rawCacheDir: string;
  eventsPath: string;
}

export interface EngineConfig {
  repoRoot: string;
  languages: SupportedLanguage[];
  respectGitIgnore: boolean;
  storageMode: StorageMode;
  staleStatus: StaleStatus;
  summaryStrategy: SummaryStrategy;
  paths: EnginePaths;
}

export interface RepoObservabilityConfig {
  enabled?: boolean;
  host?: string;
  port?: number;
  recentLimit?: number;
  snapshotIntervalMs?: number;
}

export interface RepoEngineConfig {
  summaryStrategy?: SummaryStrategy;
  observability?: RepoObservabilityConfig;
}

export interface ResolvedObservabilityConfig {
  enabled: boolean;
  host: string;
  port: number;
  recentLimit: number;
  snapshotIntervalMs: number;
}

export interface ResolvedRepoEngineConfig {
  configPath: string | null;
  repoRoot: string;
  summaryStrategy: SummaryStrategy;
  observability: ResolvedObservabilityConfig;
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
  staleStatus: StaleStatus;
}

export interface WatchEvent {
  type: "ready" | "reindex" | "error" | "close";
  changedPaths: string[];
  summary?: IndexSummary;
  message?: string;
}

export interface WatchOptions {
  repoRoot: string;
  debounceMs?: number;
  summaryStrategy?: SummaryStrategy;
  onEvent?: (event: WatchEvent) => void | Promise<void>;
}

export interface WatchHandle {
  close(): Promise<void>;
}

export interface WatchDiagnostics {
  status: "idle" | "watching";
  debounceMs: number | null;
  pollMs: number | null;
  startedAt: string | null;
  lastEvent: WatchEvent["type"] | null;
  lastEventAt: string | null;
  lastChangedPaths: string[];
  reindexCount: number;
  lastError: string | null;
  lastSummary: IndexSummary | null;
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
  summarySource: SummarySource;
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
  language?: SupportedLanguage;
  filePattern?: string;
  limit?: number;
}

export interface SearchTextMatch {
  filePath: string;
  line: number;
  preview: string;
}

export interface SearchTextOptions {
  repoRoot: string;
  query: string;
  filePattern?: string;
}

export interface FileContentResult {
  filePath: string;
  content: string;
}

export interface SymbolSourceItem {
  symbol: SymbolSummary;
  source: string;
  verified: boolean;
  startLine: number;
  endLine: number;
}

export interface SymbolSourceResult {
  requestedContextLines: number;
  items: SymbolSourceItem[];
  symbol?: SymbolSummary;
  source?: string;
  verified?: boolean;
  startLine?: number;
  endLine?: number;
}

export type QueryCodeIntent = "discover" | "source" | "assemble" | "auto";

export interface AstrographVersionParts {
  major: number;
  minor: number;
  patch: number;
  increment: number;
}

export interface QueryCodeOptions {
  repoRoot: string;
  intent?: QueryCodeIntent;
  query?: string;
  symbolId?: string;
  symbolIds?: string[];
  filePath?: string;
  kind?: SymbolKind;
  language?: SupportedLanguage;
  filePattern?: string;
  limit?: number;
  contextLines?: number;
  verify?: boolean;
  tokenBudget?: number;
  includeTextMatches?: boolean;
  includeRankedCandidates?: boolean;
}

export interface QueryCodeDiscoverResult {
  intent: "discover";
  query: string;
  symbolMatches: SymbolSummary[];
  textMatches: SearchTextMatch[];
}

export interface QueryCodeSourceResult {
  intent: "source";
  fileContent: FileContentResult | null;
  symbolSource: SymbolSourceResult | null;
}

export interface QueryCodeAssembleResult {
  intent: "assemble";
  bundle: ContextBundle;
  ranked: RankedContextResult | null;
}

export type QueryCodeResult =
  | QueryCodeDiscoverResult
  | QueryCodeSourceResult
  | QueryCodeAssembleResult;

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

export interface RankedContextCandidate {
  rank: number;
  score: number;
  reason: string;
  symbol: SymbolSummary;
  selected: boolean;
}

export interface RankedContextResult {
  repoRoot: string;
  query: string;
  tokenBudget: number;
  candidateCount: number;
  selectedSeedIds: string[];
  candidates: RankedContextCandidate[];
  bundle: ContextBundle;
}

export interface DiagnosticsOptions {
  repoRoot: string;
  scanFreshness?: boolean;
}

export interface DiagnosticsResult {
  engineVersion: string;
  engineVersionParts: AstrographVersionParts;
  storageDir: string;
  databasePath: string;
  storageVersion: number;
  storageMode: StorageMode;
  storageBackend: IndexBackendName;
  staleStatus: StaleStatus;
  freshnessMode: "metadata" | "scan";
  freshnessScanned: boolean;
  summaryStrategy: SummaryStrategy;
  summarySources: Partial<Record<SummarySource, number>>;
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
  watch: WatchDiagnostics;
}

export interface DoctorParserHealth {
  primaryBackend: "oxc";
  fallbackBackend: "tree-sitter";
  indexedFileCount: number;
  fallbackFileCount: number;
  fallbackRate: number | null;
  unknownFileCount: number;
}

export interface DoctorObservabilityHealth {
  enabled: boolean;
  configuredHost: string;
  configuredPort: number;
  status: "disabled" | "running" | "not-running" | "unhealthy";
  url: string | null;
}

export interface DoctorResult {
  repoRoot: string;
  storageDir: string;
  databasePath: string;
  storageVersion: number;
  storageBackend: IndexBackendName;
  storageMode: StorageMode;
  indexStatus: "not-indexed" | "indexed" | "stale";
  freshness: {
    status: StaleStatus;
    mode: "metadata" | "scan";
    scanned: boolean;
    indexedAt: string | null;
    indexAgeMs: number | null;
    indexedFiles: number;
    currentFiles: number;
    indexedSymbols: number;
    indexedImports: number;
    missingFiles: number;
    changedFiles: number;
    extraFiles: number;
  };
  parser: DoctorParserHealth;
  observability: DoctorObservabilityHealth;
  watch: WatchDiagnostics;
  warnings: string[];
  suggestedActions: string[];
}

export type EngineEventSource = "mcp" | "watch" | "index-worker" | "health";
export type EngineEventLevel = "debug" | "info" | "warn" | "error";

export interface EngineEventEnvelope {
  id: string;
  ts: string;
  repoRoot: string;
  source: EngineEventSource;
  event: string;
  level: EngineEventLevel;
  correlationId?: string;
  data: Record<string, unknown>;
}

export type EngineToolName =
  | "init"
  | "index_folder"
  | "index_file"
  | "get_repo_outline"
  | "get_file_tree"
  | "get_file_outline"
  | "suggest_initial_queries"
  | "query_code"
  | "diagnostics";
