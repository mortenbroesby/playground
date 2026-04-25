import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { watch as fsWatch } from "node:fs";
import { mkdir, readFile, readdir, realpath, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { createDefaultEngineConfig, normalizeSummaryStrategy } from "./config.ts";
import {
  compactDirectoryRescanPaths,
  compareDirectoryStates,
  isGitIgnored,
  listSupportedFiles,
  loadFilesystemSnapshot,
  loadFilesystemStateSnapshot,
  loadKnownDirectoryStateSnapshot,
  loadSupportedFileStatesForSubtree,
  parentDirectoryPath,
  scanDirectoryStateSnapshot,
  snapshotHash,
} from "./filesystem-scan.ts";
import type {
  IndexBackendConnection,
  IndexBackendValue,
  IndexStatement,
} from "./index-backend.ts";
import { parseSourceFile, supportedLanguageForFile } from "./parser.ts";
import { SQLITE_INDEX_BACKEND } from "./sqlite-backend.ts";
import {
  validateContextBundleOptions,
  validateRankedContextOptions,
  validateSearchSymbolsOptions,
  validateSymbolSourceOptions,
} from "./validation.ts";
import type {
  DiagnosticsOptions,
  DiagnosticsResult,
  ContextBundle,
  ContextBundleItem,
  ContextBundleItemRole,
  ContextBundleOptions,
  FileContentResult,
  FileOutline,
  FileTreeEntry,
  IndexSummary,
  QueryCodeAssembleResult,
  QueryCodeDiscoverResult,
  QueryCodeIntent,
  QueryCodeOptions,
  QueryCodeResult,
  QueryCodeSourceResult,
  RankedContextCandidate,
  RankedContextResult,
  RepoOutline,
  SearchSymbolsOptions,
  SearchTextOptions,
  SearchTextMatch,
  SymbolSourceResult,
  SymbolSourceItem,
  SymbolSummary,
  SummarySource,
  SummaryStrategy,
  SupportedLanguage,
  WatchDiagnostics,
  WatchEvent,
  WatchHandle,
  WatchOptions,
} from "./types.ts";
import type {
  DirectoryStateEntry,
  FilesystemStateEntry,
  SnapshotEntry,
} from "./filesystem-scan.ts";

const SKIP_SEGMENTS = new Set([
  ".git",
  ".next",
  ".turbo",
  ".vercel",
  ".ai-context-engine",
  ".codeintel",
  "coverage",
  "dist",
  "node_modules",
]);

interface DbSymbolRow {
  id: string;
  name: string;
  qualified_name: string | null;
  kind: SymbolSummary["kind"];
  file_path: string;
  signature: string;
  summary: string;
  summary_source: SummarySource;
  start_line: number;
  end_line: number;
  start_byte: number;
  end_byte: number;
  exported: number;
}

interface RepoMetaRecord {
  repoRoot: string;
  indexedAt: string;
  indexedFiles: number;
  indexedSymbols: number;
  indexedSnapshotHash: string;
  storageMode: string;
  storageBackend?: string;
  staleStatus: "fresh" | "stale" | "unknown";
  summaryStrategy?: SummaryStrategy;
  watch?: WatchDiagnostics;
}

interface EngineContext {
  config: Awaited<ReturnType<typeof ensureStorage>>;
  db: IndexBackendConnection;
}

const repoRootResolutionCache = new Map<string, Promise<string>>();
const ensuredStorageRoots = new Set<string>();

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function mapSymbolRow(row: DbSymbolRow): SymbolSummary {
  return {
    id: row.id,
    name: row.name,
    qualifiedName: row.qualified_name,
    kind: row.kind,
    filePath: row.file_path,
    signature: row.signature,
    summary: row.summary,
    summarySource: row.summary_source,
    startLine: row.start_line,
    endLine: row.end_line,
    exported: Boolean(row.exported),
  };
}

function typedAll<TRow>(
  statement: IndexStatement,
  ...params: IndexBackendValue[]
): TRow[] {
  return statement.all(...params) as unknown as TRow[];
}

function typedGet<TRow>(
  statement: IndexStatement,
  ...params: IndexBackendValue[]
): TRow | undefined {
  return statement.get(...params) as unknown as TRow | undefined;
}

function openDatabase(databasePath: string): IndexBackendConnection {
  const db = SQLITE_INDEX_BACKEND.open(databasePath);

  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL UNIQUE,
      language TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      symbol_count INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS symbols (
      id TEXT PRIMARY KEY,
      file_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      name TEXT NOT NULL,
      qualified_name TEXT,
      kind TEXT NOT NULL,
      signature TEXT NOT NULL,
      summary TEXT NOT NULL,
      summary_source TEXT NOT NULL DEFAULT 'signature',
      start_line INTEGER NOT NULL,
      end_line INTEGER NOT NULL,
      start_byte INTEGER NOT NULL,
      end_byte INTEGER NOT NULL,
      exported INTEGER NOT NULL,
      FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS imports (
      file_id INTEGER NOT NULL,
      source TEXT NOT NULL,
      specifiers TEXT NOT NULL,
      FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS content_blobs (
      file_id INTEGER PRIMARY KEY,
      content TEXT NOT NULL,
      FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_symbols_name ON symbols(name);
    CREATE INDEX IF NOT EXISTS idx_symbols_file_path ON symbols(file_path);
  `);

  const symbolColumns = typedAll<{ name: string }>(
    db.prepare("PRAGMA table_info(symbols)"),
  );
  if (!symbolColumns.some((column) => column.name === "summary_source")) {
    db.exec(
      "ALTER TABLE symbols ADD COLUMN summary_source TEXT NOT NULL DEFAULT 'signature'",
    );
  }

  return db;
}

async function resolveRepoRoot(repoRoot: string): Promise<string> {
  const absoluteRepoRoot = path.resolve(repoRoot);
  let cachedResolution = repoRootResolutionCache.get(absoluteRepoRoot);
  if (!cachedResolution) {
    cachedResolution = (async () => {
      const resolvedRepoRoot = await realpath(absoluteRepoRoot).catch(
        () => absoluteRepoRoot,
      );

      try {
        const worktreeRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
          cwd: resolvedRepoRoot,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        }).trim();

        return await realpath(worktreeRoot).catch(() => worktreeRoot);
      } catch {
        return resolvedRepoRoot;
      }
    })();
    repoRootResolutionCache.set(absoluteRepoRoot, cachedResolution);
  }

  return cachedResolution;
}

async function ensureStorage(repoRoot: string, summaryStrategy?: SummaryStrategy) {
  const resolvedRepoRoot = await resolveRepoRoot(repoRoot);
  const config = createDefaultEngineConfig({
    repoRoot: resolvedRepoRoot,
    summaryStrategy,
  });
  if (!ensuredStorageRoots.has(resolvedRepoRoot)) {
    await mkdir(config.paths.storageDir, { recursive: true });
    await mkdir(config.paths.rawCacheDir, { recursive: true });
    ensuredStorageRoots.add(resolvedRepoRoot);
  }
  return config;
}

async function createEngineContext(input: {
  repoRoot: string;
  summaryStrategy?: SummaryStrategy;
}): Promise<EngineContext> {
  const config = await ensureStorage(input.repoRoot, input.summaryStrategy);

  return {
    config,
    db: openDatabase(config.paths.databasePath),
  };
}

function closeEngineContext(context: EngineContext) {
  context.db.close();
}

function normalizeRepoRelativePath(repoRoot: string, filePath: string) {
  if (!filePath || filePath.trim().length === 0) {
    throw new Error("File path is required");
  }

  const normalizedPath = path.normalize(filePath);
  if (
    path.isAbsolute(filePath) ||
    normalizedPath === ".." ||
    normalizedPath.startsWith(`..${path.sep}`)
  ) {
    throw new Error(`File path escapes repository root: ${filePath}`);
  }

  const absolutePath = path.resolve(repoRoot, normalizedPath);
  const relativePath = path.relative(repoRoot, absolutePath);
  if (
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error(`File path escapes repository root: ${filePath}`);
  }

  return {
    absolutePath,
    relativePath,
  };
}

async function assertInsideRepoRoot(repoRoot: string, absolutePath: string) {
  const resolvedRepoRoot = await realpath(repoRoot);
  const resolvedPath = await realpath(absolutePath);
  const relativePath = path.relative(resolvedRepoRoot, resolvedPath);

  if (
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error(`File path escapes repository root: ${absolutePath}`);
  }
}

async function writeSidecars(input: {
  repoRoot: string;
  indexedAt: string;
  indexedFiles: number;
  totalSymbols: number;
  indexedSnapshotHash: string;
  staleStatus: "fresh" | "stale" | "unknown";
  summaryStrategy: SummaryStrategy;
}) {
  const config = createDefaultEngineConfig({
    repoRoot: input.repoRoot,
    summaryStrategy: input.summaryStrategy,
  });
  const existingMeta = await readRepoMeta(config.paths.repoMetaPath);
  const meta = {
    repoRoot: input.repoRoot,
    indexedAt: input.indexedAt,
    indexedFiles: input.indexedFiles,
    indexedSymbols: input.totalSymbols,
    indexedSnapshotHash: input.indexedSnapshotHash,
    staleStatus: input.staleStatus,
    storageMode: config.storageMode,
    storageBackend: SQLITE_INDEX_BACKEND.backendName,
    summaryStrategy: input.summaryStrategy,
    watch: existingMeta?.watch ?? createDefaultWatchDiagnostics(),
  };
  await writeRepoMetaFiles(config.paths.repoMetaPath, config.paths.integrityPath, meta);
}

function createDefaultWatchDiagnostics(): WatchDiagnostics {
  return {
    status: "idle",
    debounceMs: null,
    pollMs: null,
    startedAt: null,
    lastEvent: null,
    lastEventAt: null,
    lastChangedPaths: [],
    reindexCount: 0,
    lastError: null,
    lastSummary: null,
  };
}

function normalizeWatchDiagnostics(value: unknown): WatchDiagnostics {
  if (typeof value !== "object" || value === null) {
    return createDefaultWatchDiagnostics();
  }

  const candidate = value as Partial<WatchDiagnostics>;
  return {
    status: candidate.status === "watching" ? "watching" : "idle",
    debounceMs:
      typeof candidate.debounceMs === "number" ? candidate.debounceMs : null,
    pollMs: typeof candidate.pollMs === "number" ? candidate.pollMs : null,
    startedAt: typeof candidate.startedAt === "string" ? candidate.startedAt : null,
    lastEvent:
      candidate.lastEvent === "ready" ||
      candidate.lastEvent === "reindex" ||
      candidate.lastEvent === "error" ||
      candidate.lastEvent === "close"
        ? candidate.lastEvent
        : null,
    lastEventAt:
      typeof candidate.lastEventAt === "string" ? candidate.lastEventAt : null,
    lastChangedPaths: Array.isArray(candidate.lastChangedPaths)
      ? candidate.lastChangedPaths.filter(
          (entry): entry is string => typeof entry === "string",
        )
      : [],
    reindexCount:
      typeof candidate.reindexCount === "number" ? candidate.reindexCount : 0,
    lastError: typeof candidate.lastError === "string" ? candidate.lastError : null,
    lastSummary:
      typeof candidate.lastSummary === "object" &&
      candidate.lastSummary !== null &&
      typeof candidate.lastSummary.indexedFiles === "number" &&
      typeof candidate.lastSummary.indexedSymbols === "number" &&
      typeof candidate.lastSummary.skippedFiles === "number" &&
      (candidate.lastSummary.staleStatus === "fresh" ||
        candidate.lastSummary.staleStatus === "stale" ||
        candidate.lastSummary.staleStatus === "unknown")
        ? candidate.lastSummary
        : null,
  };
}

async function writeRepoMetaFiles(
  repoMetaPath: string,
  integrityPath: string,
  meta: RepoMetaRecord,
) {
  const metaJson = JSON.stringify(meta, null, 2);
  await writeFile(repoMetaPath, metaJson);
  await writeFile(integrityPath, sha256(metaJson));
}

async function writeWatchDiagnostics(input: {
  repoRoot: string;
  summaryStrategy?: SummaryStrategy;
  watch: WatchDiagnostics;
}) {
  const config = await ensureStorage(input.repoRoot, input.summaryStrategy);
  const meta = await readRepoMeta(config.paths.repoMetaPath);
  if (!meta) {
    return;
  }
  await writeRepoMetaFiles(config.paths.repoMetaPath, config.paths.integrityPath, {
    ...meta,
    watch: input.watch,
  });
}

async function readRepoMeta(
  repoMetaPath: string,
): Promise<RepoMetaRecord | null> {
  try {
    const content = await readFile(repoMetaPath, "utf8");
    const parsed = JSON.parse(content) as RepoMetaRecord;
    return {
      ...parsed,
      summaryStrategy: normalizeSummaryStrategy(parsed.summaryStrategy),
      watch: normalizeWatchDiagnostics(parsed.watch),
    };
  } catch {
    return null;
  }
}

function loadIndexedSnapshot(
  db: IndexBackendConnection,
): SnapshotEntry[] {
  return typedAll<SnapshotEntry>(
    db.prepare(
      "SELECT path, content_hash AS contentHash FROM files ORDER BY path ASC",
    ),
  );
}

function compareSnapshots(
  indexedEntries: SnapshotEntry[],
  currentEntries: SnapshotEntry[],
) {
  const indexedMap = new Map(indexedEntries.map((entry) => [entry.path, entry]));
  const currentMap = new Map(currentEntries.map((entry) => [entry.path, entry]));
  const missingFiles = indexedEntries.filter((entry) => !currentMap.has(entry.path));
  const extraFiles = currentEntries.filter((entry) => !indexedMap.has(entry.path));
  const changedFiles = indexedEntries.filter((entry) => {
    const currentEntry = currentMap.get(entry.path);
    return Boolean(currentEntry && currentEntry.contentHash !== entry.contentHash);
  });

  return {
    missingPaths: missingFiles.map((entry) => entry.path),
    extraPaths: extraFiles.map((entry) => entry.path),
    changedPaths: changedFiles.map((entry) => entry.path),
    indexedFiles: indexedEntries.length,
    currentFiles: currentEntries.length,
    missingFiles: missingFiles.length,
    changedFiles: changedFiles.length,
    extraFiles: extraFiles.length,
    indexedSnapshotHash: snapshotHash(indexedEntries),
    currentSnapshotHash: snapshotHash(currentEntries),
  };
}

async function emitWatchEvent(
  onEvent: WatchOptions["onEvent"],
  event: WatchEvent,
): Promise<void> {
  await onEvent?.(event);
}

async function readRepoFile(repoRoot: string, filePath: string) {
  const { absolutePath, relativePath } = normalizeRepoRelativePath(repoRoot, filePath);
  const language = supportedLanguageForFile(relativePath);
  if (!language) {
    throw new Error(`Unsupported source file: ${filePath}`);
  }
  if (isGitIgnored(repoRoot, relativePath)) {
    throw new Error(`Ignored source file: ${relativePath}`);
  }
  await assertInsideRepoRoot(repoRoot, absolutePath);

  const content = await readFile(absolutePath, "utf8");
  const fileStat = await stat(absolutePath);
  return {
    absolutePath,
    relativePath,
    language,
    content,
    mtimeMs: fileStat.mtimeMs,
  };
}

function countRows(db: IndexBackendConnection, sql: string): number {
  const row = db.prepare(sql).get() as { count: number };
  return row.count;
}

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

function queryTokens(value: string): string[] {
  return normalizeQuery(value)
    .split(/[^a-z0-9_]+/g)
    .filter(Boolean);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesFilePattern(filePath: string, pattern?: string): boolean {
  if (!pattern) {
    return true;
  }

  const normalizedPattern = pattern.replaceAll("\\", "/");
  const regexPattern = escapeRegExp(normalizedPattern)
    .replace(/\\\*\\\*/g, ".*")
    .replace(/\\\*/g, "[^/]*")
    .replace(/\\\?/g, "[^/]");

  return new RegExp(`^${regexPattern}$`, "u").test(filePath);
}

function estimateTokens(value: string): number {
  return Math.max(1, Math.ceil(value.length / 4));
}

function rowText(row: DbSymbolRow): string {
  return [
    row.name,
    row.qualified_name ?? "",
    row.signature,
    row.summary,
    row.summary_source,
    row.file_path,
    row.kind,
  ]
    .join(" ")
    .toLowerCase();
}

function scoreSymbolRow(row: DbSymbolRow, query: string): number {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return 0;
  }

  const name = row.name.toLowerCase();
  const qualifiedName = row.qualified_name?.toLowerCase() ?? "";
  const signature = row.signature.toLowerCase();
  const summary = row.summary.toLowerCase();
  const filePath = row.file_path.toLowerCase();
  const haystack = rowText(row);
  const tokens = queryTokens(query);
  let score = 0;

  if (name === normalized) {
    score += 1000;
  }
  if (qualifiedName === normalized) {
    score += 900;
  }
  if (name.startsWith(normalized)) {
    score += 700;
  }
  if (qualifiedName.startsWith(normalized)) {
    score += 650;
  }
  if (name.includes(normalized)) {
    score += 500;
  }
  if (qualifiedName.includes(normalized)) {
    score += 450;
  }
  if (signature.includes(normalized)) {
    score += 250;
  }
  if (summary.includes(normalized)) {
    score += 200;
  }
  if (filePath.includes(normalized)) {
    score += 120;
  }

  const exactWord = new RegExp(`\\b${escapeRegExp(normalized)}\\b`, "i");
  if (exactWord.test(rowText(row))) {
    score += 180;
  }

  for (const token of tokens) {
    if (haystack.includes(token)) {
      score += 70;
    }
  }

  if (score > 0 && row.exported) {
    score += 20;
  }

  return score;
}

function loadSymbolRows(
  db: IndexBackendConnection,
  input: {
    kind?: SearchSymbolsOptions["kind"];
    language?: SearchSymbolsOptions["language"];
    filePattern?: SearchSymbolsOptions["filePattern"];
  } = {},
): DbSymbolRow[] {
  const rows = input.kind
    ? typedAll<DbSymbolRow>(
        db.prepare(
          `
            SELECT
              id, name, qualified_name, kind, file_path, signature, summary,
              summary_source,
              start_line, end_line, start_byte, end_byte, exported
            FROM symbols
            WHERE kind = ?
          `,
        ),
        input.kind,
      )
    : typedAll<DbSymbolRow>(
        db.prepare(
          `
            SELECT
              id, name, qualified_name, kind, file_path, signature, summary,
              summary_source,
              start_line, end_line, start_byte, end_byte, exported
            FROM symbols
          `,
        ),
      );

  return rows
    .filter((row) => !input.language || row.file_path.endsWith(`.${input.language}`))
    .filter((row) => matchesFilePattern(row.file_path, input.filePattern));
}

function loadSymbolSourceRow(
  db: IndexBackendConnection,
  symbolId: string,
) {
  return typedGet<DbSymbolRow & { content_hash: string; content: string }>(
    db.prepare(
      `
        SELECT
          symbols.id, symbols.name, symbols.qualified_name, symbols.kind, symbols.file_path,
          symbols.signature, symbols.summary, symbols.summary_source,
          symbols.start_line, symbols.end_line, symbols.start_byte, symbols.end_byte,
          symbols.exported,
          files.content_hash, content_blobs.content
        FROM symbols
        INNER JOIN files ON files.id = symbols.file_id
        INNER JOIN content_blobs ON content_blobs.file_id = files.id
        WHERE symbols.id = ?
      `,
    ),
    symbolId,
  );
}

function resolveImportedFilePaths(
  db: IndexBackendConnection,
  sourceFilePath: string,
  importSource: string,
): string[] {
  const source = importSource.trim();
  if (!source.startsWith(".") && !source.startsWith("/")) {
    return [];
  }

  const basePath = source.startsWith("/")
    ? path.normalize(source)
    : path.normalize(path.join(path.dirname(sourceFilePath), source));
  const withoutExtension = basePath.replace(/\.[^.\\/]+$/u, "");
  const candidates = [
    basePath,
    withoutExtension,
    `${withoutExtension}.ts`,
    `${withoutExtension}.tsx`,
    `${withoutExtension}.js`,
    `${withoutExtension}.jsx`,
    path.join(withoutExtension, "index.ts"),
    path.join(withoutExtension, "index.tsx"),
    path.join(withoutExtension, "index.js"),
    path.join(withoutExtension, "index.jsx"),
  ];

  for (const candidate of [...new Set(candidates)]) {
    const row = typedGet<{ path: string }>(
      db.prepare("SELECT path FROM files WHERE path = ?"),
      candidate,
    );
    if (row) {
      return [row.path];
    }
  }

  return [];
}

function pickDependencyRows(
  db: IndexBackendConnection,
  seedRow: DbSymbolRow,
): Array<{ row: DbSymbolRow; reason: string }> {
  const fileRow = typedGet<{ id: number }>(
    db.prepare("SELECT id FROM files WHERE path = ?"),
    seedRow.file_path,
  );
  if (!fileRow) {
    return [];
  }

  const imports = typedAll<{
    source: string;
    specifiers: string;
  }>(
    db.prepare(
      `
        SELECT source, specifiers
        FROM imports
        WHERE file_id = ?
        ORDER BY source ASC
      `,
    ),
    fileRow.id,
  );

  const matches: Array<{ row: DbSymbolRow; reason: string }> = [];
  const seen = new Set<string>();

  for (const importRow of imports) {
    const targets = resolveImportedFilePaths(
      db,
      seedRow.file_path,
      importRow.source,
    );
    const specifiers = JSON.parse(importRow.specifiers) as string[];

    for (const targetPath of targets) {
      const picked: DbSymbolRow[] = [];

      for (const specifier of specifiers) {
        const row = typedGet<DbSymbolRow>(
          db.prepare(
            `
              SELECT
                id, name, qualified_name, kind, file_path, signature, summary,
                summary_source,
                start_line, end_line, start_byte, end_byte, exported
              FROM symbols
              WHERE file_path = ? AND (name = ? OR qualified_name = ?)
              ORDER BY exported DESC, start_line ASC
              LIMIT 1
            `,
          ),
          targetPath,
          specifier,
          specifier,
        );
        if (row) {
          picked.push(row);
        }
      }

      if (picked.length === 0) {
        const row = typedGet<DbSymbolRow>(
          db.prepare(
            `
              SELECT
                id, name, qualified_name, kind, file_path, signature, summary,
                summary_source,
                start_line, end_line, start_byte, end_byte, exported
              FROM symbols
              WHERE file_path = ?
              ORDER BY exported DESC, kind = 'class' DESC, kind = 'function' DESC, start_line ASC
              LIMIT 1
            `,
          ),
          targetPath,
        );
        if (row) {
          picked.push(row);
        }
      }

      for (const row of picked) {
        if (seen.has(row.id)) {
          continue;
        }
        seen.add(row.id);
        matches.push({
          row,
          reason: `import ${importRow.source}`,
        });
      }
    }
  }

  return matches;
}

function makeContextBundleItem(
  row: DbSymbolRow,
  source: string,
  role: ContextBundleItemRole,
  reason: string,
): ContextBundleItem {
  return {
    role,
    reason,
    symbol: mapSymbolRow(row),
    source,
    tokenCount: estimateTokens(source) + 8,
  };
}

function buildSymbolSourceItem(
  row: DbSymbolRow & { content_hash: string; content: string },
  verify: boolean,
  contextLines = 0,
): SymbolSourceItem {
  const normalizedContextLines = Math.max(0, Math.floor(contextLines));
  const lines = row.content.split("\n");
  const startLine = Math.max(1, row.start_line - normalizedContextLines);
  const endLine = Math.min(lines.length, row.end_line + normalizedContextLines);
  return {
    symbol: mapSymbolRow(row),
    source: lines.slice(startLine - 1, endLine).join("\n"),
    verified: verify ? sha256(row.content) === row.content_hash : false,
    startLine,
    endLine,
  };
}

interface RankedSeedCandidate {
  row: DbSymbolRow & { content_hash: string; content: string };
  reason: string;
  score: number;
}

function sortRankedSymbolEntries(
  left: { row: DbSymbolRow; score: number },
  right: { row: DbSymbolRow; score: number },
) {
  return (
    right.score - left.score ||
    Number(right.row.exported) - Number(left.row.exported) ||
    left.row.file_path.localeCompare(right.row.file_path) ||
    left.row.start_line - right.row.start_line ||
    left.row.name.localeCompare(right.row.name)
  );
}

function resolveRankedSeedCandidates(
  db: IndexBackendConnection,
  input: ContextBundleOptions,
): RankedSeedCandidate[] {
  if (input.symbolIds?.length) {
    return input.symbolIds
      .map((symbolId) => loadSymbolSourceRow(db, symbolId))
      .filter(
        (row): row is DbSymbolRow & { content_hash: string; content: string } =>
          Boolean(row),
      )
      .map((row, index) => ({
        row,
        reason: "explicit symbol id",
        score: Math.max(1, input.symbolIds!.length - index),
      }));
  }

  if (!input.query) {
    return [];
  }

  return loadSymbolRows(db)
    .map((row) => ({
      row,
      score: scoreSymbolRow(row, input.query ?? ""),
    }))
    .filter((entry) => entry.score > 0)
    .sort(sortRankedSymbolEntries)
    .slice(0, 5)
    .map((entry) => ({
      row: loadSymbolSourceRow(db, entry.row.id),
      reason: `matched query "${input.query}"`,
      score: entry.score,
    }))
    .filter(
      (
        entry,
      ): entry is RankedSeedCandidate => Boolean(entry.row),
    );
}

function buildContextBundleFromSeeds(
  db: IndexBackendConnection,
  input: ContextBundleOptions,
  seedCandidates: RankedSeedCandidate[],
): ContextBundle {
  const bundleCandidates: Array<ContextBundleItem> = [];
  const seen = new Set<string>();

  for (const seed of seedCandidates) {
    if (seen.has(seed.row.id)) {
      continue;
    }
    seen.add(seed.row.id);
    bundleCandidates.push(
      makeContextBundleItem(
        seed.row,
        seed.row.content.slice(seed.row.start_byte, seed.row.end_byte),
        "target",
        seed.reason,
      ),
    );
  }

  for (const seed of seedCandidates) {
    const dependencyRows = pickDependencyRows(db, seed.row);
    for (const dependency of dependencyRows) {
      if (seen.has(dependency.row.id)) {
        continue;
      }
      seen.add(dependency.row.id);
      const sourceRow = loadSymbolSourceRow(db, dependency.row.id);
      if (!sourceRow) {
        continue;
      }
      bundleCandidates.push(
        makeContextBundleItem(
          dependency.row,
          sourceRow.content.slice(sourceRow.start_byte, sourceRow.end_byte),
          "dependency",
          dependency.reason,
        ),
      );
    }
  }

  const tokenBudget = input.tokenBudget ?? 1200;
  const estimatedTokens = bundleCandidates.reduce(
    (total, item) => total + item.tokenCount,
    0,
  );
  const items: ContextBundleItem[] = [];
  let usedTokens = 0;

  for (const item of bundleCandidates) {
    if (usedTokens + item.tokenCount > tokenBudget) {
      break;
    }
    items.push(item);
    usedTokens += item.tokenCount;
  }

  return {
    repoRoot: input.repoRoot,
    query: input.query ?? null,
    tokenBudget,
    estimatedTokens,
    usedTokens,
    truncated: estimatedTokens > tokenBudget,
    items,
  };
}

function buildRankedContextResult(
  input: ContextBundleOptions & { query: string },
  seedCandidates: RankedSeedCandidate[],
  bundle: ContextBundle,
): RankedContextResult {
  const selectedSeedIds = bundle.items
    .filter((item) => item.role === "target")
    .map((item) => item.symbol.id);

  const candidates: RankedContextCandidate[] = seedCandidates.map((candidate, index) => ({
    rank: index + 1,
    score: candidate.score,
    reason: candidate.reason,
    symbol: mapSymbolRow(candidate.row),
    selected: selectedSeedIds.includes(candidate.row.id),
  }));

  return {
    repoRoot: input.repoRoot,
    query: input.query,
    tokenBudget: bundle.tokenBudget,
    candidateCount: candidates.length,
    selectedSeedIds,
    candidates,
    bundle,
  };
}

async function upsertFileIndex(db: IndexBackendConnection, input: {
  repoRoot: string;
  filePath: string;
  summaryStrategy?: SummaryStrategy;
  forceRefresh?: boolean;
}) {
  const file = await readRepoFile(input.repoRoot, input.filePath);
  const parsed = parseSourceFile({
    relativePath: file.relativePath,
    content: file.content,
    language: file.language,
    summaryStrategy: input.summaryStrategy,
  });
  const existing = db
    .prepare("SELECT id, content_hash FROM files WHERE path = ?")
    .get(file.relativePath) as { id: number; content_hash: string } | undefined;

  if (!input.forceRefresh && existing?.content_hash === parsed.contentHash) {
    const countRow = typedGet<{ count: number }>(
      db.prepare("SELECT COUNT(*) AS count FROM symbols WHERE file_id = ?"),
      existing.id,
    );
    return {
      indexed: false,
      symbolCount: countRow?.count ?? 0,
    };
  }

  if (existing) {
    db.prepare("DELETE FROM imports WHERE file_id = ?").run(existing.id);
    db.prepare("DELETE FROM symbols WHERE file_id = ?").run(existing.id);
    db.prepare("DELETE FROM content_blobs WHERE file_id = ?").run(existing.id);
    db.prepare(
      `
        UPDATE files
        SET language = ?, content_hash = ?, symbol_count = ?, updated_at = ?
        WHERE id = ?
      `,
    ).run(
      parsed.language,
      parsed.contentHash,
      parsed.symbols.length,
      new Date().toISOString(),
      existing.id,
    );
  } else {
    db.prepare(
      `
        INSERT INTO files (path, language, content_hash, symbol_count, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `,
    ).run(
      file.relativePath,
      parsed.language,
      parsed.contentHash,
      parsed.symbols.length,
      new Date().toISOString(),
    );
  }

  const fileRow = db
    .prepare("SELECT id FROM files WHERE path = ?")
    .get(file.relativePath) as { id: number };

  db.prepare(
    "INSERT INTO content_blobs (file_id, content) VALUES (?, ?)",
  ).run(fileRow.id, file.content);

  const insertSymbol = db.prepare(`
    INSERT INTO symbols (
      id, file_id, file_path, name, qualified_name, kind, signature, summary,
      summary_source, start_line, end_line, start_byte, end_byte, exported
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const symbol of parsed.symbols) {
    insertSymbol.run(
      symbol.id,
      fileRow.id,
      file.relativePath,
      symbol.name,
      symbol.qualifiedName,
      symbol.kind,
      symbol.signature,
      symbol.summary,
      symbol.summarySource,
      symbol.startLine,
      symbol.endLine,
      symbol.startByte,
      symbol.endByte,
      symbol.exported ? 1 : 0,
    );
  }

  const insertImport = db.prepare(
    "INSERT INTO imports (file_id, source, specifiers) VALUES (?, ?, ?)",
  );
  for (const dependency of parsed.imports) {
    insertImport.run(
      fileRow.id,
      dependency.source,
      JSON.stringify(dependency.specifiers),
    );
  }

  return {
    indexed: true,
    symbolCount: parsed.symbols.length,
  };
}

function removeFileIndex(
  db: IndexBackendConnection,
  filePath: string,
): boolean {
  const result = db.prepare("DELETE FROM files WHERE path = ?").run(filePath);
  return Number(result.changes ?? 0) > 0;
}

async function finalizeIndex(
  db: IndexBackendConnection,
  repoRoot: string,
  indexedAt: string,
  summaryStrategy: SummaryStrategy,
) {
  const totalFiles = countRows(db, "SELECT COUNT(*) AS count FROM files");
  const totalSymbols = countRows(db, "SELECT COUNT(*) AS count FROM symbols");
  const indexedSnapshotHash = snapshotHash(loadIndexedSnapshot(db));
  db.prepare(
    "INSERT INTO meta (key, value) VALUES ('staleStatus', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  ).run("fresh");
  await writeSidecars({
    repoRoot,
    indexedAt,
    indexedFiles: totalFiles,
    totalSymbols,
    indexedSnapshotHash,
    staleStatus: "fresh",
    summaryStrategy,
  });
}

export async function indexFolder(input: {
  repoRoot: string;
  summaryStrategy?: SummaryStrategy;
}): Promise<IndexSummary> {
  const config = await ensureStorage(input.repoRoot, input.summaryStrategy);
  const db = openDatabase(config.paths.databasePath);
  const repoRoot = config.repoRoot;

  try {
    const meta = await readRepoMeta(config.paths.repoMetaPath);
    const forceRefresh = meta?.summaryStrategy !== config.summaryStrategy;
    const supportedFiles = await listSupportedFiles(repoRoot);
    const tracked = db.prepare("SELECT path FROM files").all() as Array<{ path: string }>;
    const trackedPaths = new Set(tracked.map((row) => row.path));
    const nextPaths = new Set(supportedFiles);

    for (const stalePath of trackedPaths) {
      if (!nextPaths.has(stalePath)) {
        db.prepare("DELETE FROM files WHERE path = ?").run(stalePath);
      }
    }

    let indexedFiles = 0;
    let indexedSymbols = 0;
    for (const filePath of supportedFiles) {
      const result = await upsertFileIndex(db, {
        repoRoot,
        filePath,
        summaryStrategy: config.summaryStrategy,
        forceRefresh,
      });
      if (result.indexed) {
        indexedFiles += 1;
        indexedSymbols += result.symbolCount;
      }
    }

    const indexedAt = new Date().toISOString();
    await finalizeIndex(db, repoRoot, indexedAt, config.summaryStrategy);

    return {
      indexedFiles,
      indexedSymbols,
      skippedFiles: await countSkippedFiles(repoRoot),
      staleStatus: "fresh",
    };
  } finally {
    db.close();
  }
}

async function countSkippedFiles(repoRoot: string): Promise<number> {
  let skipped = 0;
  async function walk(currentDir: string) {
    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_SEGMENTS.has(entry.name)) {
          continue;
        }
        await walk(absolutePath);
        continue;
      }
      const relativePath = path.relative(repoRoot, absolutePath);
      if (!supportedLanguageForFile(relativePath)) {
        skipped += 1;
      }
    }
  }
  await walk(repoRoot);
  return skipped;
}

export async function indexFile(input: {
  repoRoot: string;
  filePath: string;
  summaryStrategy?: SummaryStrategy;
}): Promise<IndexSummary> {
  const config = await ensureStorage(input.repoRoot, input.summaryStrategy);
  const db = openDatabase(config.paths.databasePath);
  const repoRoot = config.repoRoot;

  try {
    const meta = await readRepoMeta(config.paths.repoMetaPath);
    const result = await upsertFileIndex(db, {
      repoRoot,
      filePath: input.filePath,
      summaryStrategy: config.summaryStrategy,
      forceRefresh: meta?.summaryStrategy !== config.summaryStrategy,
    });
    const indexedAt = new Date().toISOString();
    await finalizeIndex(db, repoRoot, indexedAt, config.summaryStrategy);

    return {
      indexedFiles: result.indexed ? 1 : 0,
      indexedSymbols: result.symbolCount,
      skippedFiles: 0,
      staleStatus: "fresh",
    };
  } finally {
    db.close();
  }
}

export async function watchFolder(input: WatchOptions): Promise<WatchHandle> {
  const debounceMs = input.debounceMs ?? 100;
  const repoRoot = await resolveRepoRoot(input.repoRoot);
  const pollMs = Math.max(50, Math.min(debounceMs, 250));
  const pendingPaths = new Set<string>();
  let closed = false;
  let debounceTimer: NodeJS.Timeout | null = null;
  let activeFlush: Promise<void> | null = null;
  let pollInFlight = false;
  let pollInterval: NodeJS.Timeout | null = null;
  let nativeWatchTimer: NodeJS.Timeout | null = null;
  let nativeWatcher: import("node:fs").FSWatcher | null = null;
  let usingPollingFallback = false;
  let observedState: FilesystemStateEntry[] = [];
  let observedDirectories: DirectoryStateEntry[] = [];
  const startedAt = new Date().toISOString();
  let reindexCount = 0;
  let lastSummary: IndexSummary | null = null;
  let lastError: string | null = null;

  const persistWatchEvent = async (event: WatchEvent) => {
    if (event.type === "ready") {
      reindexCount = 0;
      lastError = null;
    }
    if (event.type === "reindex") {
      reindexCount += 1;
      lastError = null;
    }
    if (event.type === "error") {
      lastError = event.message ?? "Unknown watch error";
    }
    if (event.summary) {
      lastSummary = event.summary;
    }

    await writeWatchDiagnostics({
      repoRoot,
      summaryStrategy: input.summaryStrategy,
      watch: {
        status: event.type === "close" ? "idle" : "watching",
        debounceMs,
        pollMs,
        startedAt,
        lastEvent: event.type,
        lastEventAt: new Date().toISOString(),
        lastChangedPaths: event.changedPaths,
        reindexCount,
        lastError,
        lastSummary,
      },
    });
  };

  const scheduleFlush = (paths: string[]) => {
    for (const filePath of paths) {
      pendingPaths.add(filePath);
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      void flush();
    }, debounceMs);
  };

  const flush = async () => {
    if (closed || activeFlush) {
      return;
    }

    const changedPaths = [...pendingPaths].sort();
    pendingPaths.clear();

    activeFlush = (async () => {
      try {
        const config = await ensureStorage(repoRoot, input.summaryStrategy);
        const db = openDatabase(config.paths.databasePath);
        const meta = await readRepoMeta(config.paths.repoMetaPath);
        const forceRefresh = meta?.summaryStrategy !== config.summaryStrategy;

        let indexedFiles = 0;
        let indexedSymbols = 0;

        try {
          for (const filePath of changedPaths) {
            const absolutePath = path.join(repoRoot, filePath);
            const fileExists = await stat(absolutePath)
              .then((entry) => entry.isFile())
              .catch(() => false);

            if (!fileExists) {
              if (removeFileIndex(db, filePath)) {
                indexedFiles += 1;
              }
              continue;
            }

            if (!supportedLanguageForFile(filePath) || isGitIgnored(repoRoot, filePath)) {
              if (removeFileIndex(db, filePath)) {
                indexedFiles += 1;
              }
              continue;
            }

            const result = await upsertFileIndex(db, {
              repoRoot,
              filePath,
              summaryStrategy: config.summaryStrategy,
              forceRefresh,
            });
            if (result.indexed) {
              indexedFiles += 1;
              indexedSymbols += result.symbolCount;
            }
          }

          const indexedAt = new Date().toISOString();
          await finalizeIndex(db, repoRoot, indexedAt, config.summaryStrategy);

          const summary = {
            indexedFiles,
            indexedSymbols,
            skippedFiles: await countSkippedFiles(repoRoot),
            staleStatus: "fresh" as const,
          };
          const event = {
            type: "reindex",
            changedPaths,
            summary,
          } satisfies WatchEvent;
          await persistWatchEvent(event);
          await emitWatchEvent(input.onEvent, event);
        } finally {
          db.close();
        }
      } catch (error) {
        for (const filePath of changedPaths) {
          pendingPaths.add(filePath);
        }
        const event = {
          type: "error",
          changedPaths,
          message: error instanceof Error ? error.message : String(error),
        } satisfies WatchEvent;
        await persistWatchEvent(event);
        await emitWatchEvent(input.onEvent, event);
      } finally {
        activeFlush = null;
        if (!closed && pendingPaths.size > 0) {
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }
          debounceTimer = setTimeout(() => {
            debounceTimer = null;
            void flush();
          }, debounceMs);
        }
      }
    })();

    await activeFlush;
  };

  const runPollingSweep = async () => {
    if (closed || pollInFlight) {
      return;
    }

    pollInFlight = true;
    try {
      const previousStateMap = new Map(
        observedState.map((entry) => [entry.path, entry]),
      );
      const currentStateMap = new Map<string, FilesystemStateEntry>();
      const changedPaths = new Set<string>();

      for (const previousEntry of observedState) {
        const absolutePath = path.join(repoRoot, previousEntry.path);
        const fileStat = await stat(absolutePath)
          .then((entry) => (entry.isFile() ? entry : null))
          .catch(() => null);

        if (!fileStat) {
          changedPaths.add(previousEntry.path);
          continue;
        }

        const currentEntry = {
          path: previousEntry.path,
          mtimeMs: fileStat.mtimeMs,
          size: fileStat.size,
        } satisfies FilesystemStateEntry;
        currentStateMap.set(currentEntry.path, currentEntry);

        if (
          currentEntry.mtimeMs !== previousEntry.mtimeMs ||
          currentEntry.size !== previousEntry.size
        ) {
          changedPaths.add(currentEntry.path);
        }
      }

      const currentDirectories = await loadKnownDirectoryStateSnapshot(
        repoRoot,
        observedDirectories.map((entry) => entry.path),
      );
      const directoryComparison = compareDirectoryStates(
        observedDirectories,
        currentDirectories,
      );
      const directoriesToRescan = compactDirectoryRescanPaths([
        ...directoryComparison.changedPaths,
        ...directoryComparison.missingPaths.map((entry) => parentDirectoryPath(entry)),
      ]);

      for (const directoryPath of directoriesToRescan) {
        const subtreeState = await loadSupportedFileStatesForSubtree(repoRoot, directoryPath);
        for (const entry of subtreeState) {
          currentStateMap.set(entry.path, entry);
          if (!previousStateMap.has(entry.path)) {
            changedPaths.add(entry.path);
          }
        }
      }

      observedState = [...currentStateMap.values()].sort((left, right) =>
        left.path.localeCompare(right.path)
      );
      observedDirectories = directoriesToRescan.length > 0
        ? await scanDirectoryStateSnapshot(repoRoot)
        : currentDirectories;

      const changedPathList = [...changedPaths].sort();
      if (changedPathList.length > 0) {
        scheduleFlush(changedPathList);
      }
    } catch (error) {
      const event = {
        type: "error",
        changedPaths: [],
        message: error instanceof Error ? error.message : String(error),
      } satisfies WatchEvent;
      await persistWatchEvent(event);
      await emitWatchEvent(input.onEvent, event);
    } finally {
      pollInFlight = false;
    }
  };

  const scheduleNativeWatchSweep = () => {
    if (closed || usingPollingFallback || nativeWatchTimer) {
      return;
    }
    nativeWatchTimer = setTimeout(() => {
      nativeWatchTimer = null;
      void runPollingSweep();
    }, 0);
  };

  const startPollingFallback = () => {
    if (pollInterval || closed) {
      return;
    }
    usingPollingFallback = true;
    pollInterval = setInterval(() => {
      void runPollingSweep();
    }, pollMs);
  };

  const startNativeWatcher = () => {
    try {
      nativeWatcher = fsWatch(repoRoot, { recursive: true }, () => {
        scheduleNativeWatchSweep();
      });
      nativeWatcher.on("error", () => {
        nativeWatcher?.close();
        nativeWatcher = null;
        startPollingFallback();
      });
    } catch {
      startPollingFallback();
    }
  };

  const initialSummary = await indexFolder({
    repoRoot,
    summaryStrategy: input.summaryStrategy,
  });
  const readyEvent = {
    type: "ready",
    changedPaths: [],
    summary: initialSummary,
  } satisfies WatchEvent;
  await persistWatchEvent(readyEvent);
  await emitWatchEvent(input.onEvent, readyEvent);
  observedState = await loadFilesystemStateSnapshot(repoRoot);
  observedDirectories = await scanDirectoryStateSnapshot(repoRoot);
  startNativeWatcher();

  return {
    async close() {
      if (closed) {
        return;
      }
      closed = true;
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      if (nativeWatchTimer) {
        clearTimeout(nativeWatchTimer);
        nativeWatchTimer = null;
      }
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
      nativeWatcher?.close();
      nativeWatcher = null;
      await activeFlush;
      const event = {
        type: "close",
        changedPaths: [],
      } satisfies WatchEvent;
      await persistWatchEvent(event);
      await emitWatchEvent(input.onEvent, event);
    },
  };
}

export async function getRepoOutline(input: { repoRoot: string }): Promise<RepoOutline> {
  const context = await createEngineContext(input);

  try {
    const languages = Object.fromEntries(
      (
        context.db.prepare(
          "SELECT language, COUNT(*) AS count FROM files GROUP BY language",
        ).all() as Array<{ language: SupportedLanguage; count: number }>
      ).map((row) => [row.language, row.count]),
    ) as RepoOutline["languages"];

    return {
      totalFiles: countRows(context.db, "SELECT COUNT(*) AS count FROM files"),
      totalSymbols: countRows(context.db, "SELECT COUNT(*) AS count FROM symbols"),
      languages,
    };
  } finally {
    closeEngineContext(context);
  }
}

export async function getFileTree(input: { repoRoot: string }): Promise<FileTreeEntry[]> {
  const context = await createEngineContext(input);

  try {
    const rows = typedAll<{
      path: string;
      language: SupportedLanguage;
      symbol_count: number;
    }>(
      context.db.prepare("SELECT path, language, symbol_count FROM files ORDER BY path ASC"),
    );
    return rows.map((row) => ({
      path: row.path,
      language: row.language,
      symbolCount: row.symbol_count,
    }));
  } finally {
    closeEngineContext(context);
  }
}

export async function getFileOutline(input: {
  repoRoot: string;
  filePath: string;
}): Promise<FileOutline> {
  const context = await createEngineContext(input);
  const { relativePath } = normalizeRepoRelativePath(context.config.repoRoot, input.filePath);

  try {
    const rows = typedAll<DbSymbolRow>(context.db.prepare(
      `
        SELECT
          id, name, qualified_name, kind, file_path, signature, summary,
          summary_source,
          start_line, end_line, start_byte, end_byte, exported
        FROM symbols
        WHERE file_path = ?
        ORDER BY start_line ASC
      `,
    ), relativePath);

    return {
      filePath: relativePath,
      symbols: rows.map(mapSymbolRow),
    };
  } finally {
    closeEngineContext(context);
  }
}

export async function suggestInitialQueries(input: {
  repoRoot: string;
}): Promise<string[]> {
  const context = await createEngineContext(input);

  try {
    const rows = context.db.prepare(
      `
        SELECT name, kind, file_path, exported
        FROM symbols
        ORDER BY exported DESC, kind = 'class' DESC, kind = 'function' DESC, name ASC
        LIMIT 5
      `,
    ).all() as Array<{
      name: string;
      kind: SymbolSummary["kind"];
      file_path: string;
      exported: number;
    }>;

    return rows.map(
      (row) => `Inspect ${row.kind} ${row.name} in ${row.file_path}`,
    );
  } finally {
    closeEngineContext(context);
  }
}

function searchSymbolsInContext(
  context: EngineContext,
  input: SearchSymbolsOptions,
): SymbolSummary[] {
  const rows = loadSymbolRows(context.db, {
    kind: input.kind,
    language: input.language,
    filePattern: input.filePattern,
  });
  const normalizedQuery = normalizeQuery(input.query);

  return rows
    .map((row) => ({
      row,
      score: scoreSymbolRow(row, normalizedQuery),
    }))
    .filter((entry) => entry.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        Number(right.row.exported) - Number(left.row.exported) ||
        left.row.file_path.localeCompare(right.row.file_path) ||
        left.row.start_line - right.row.start_line ||
        left.row.name.localeCompare(right.row.name),
    )
    .slice(0, input.limit ?? 20)
    .map((entry) => mapSymbolRow(entry.row));
}

export async function searchSymbols(
  input: SearchSymbolsOptions,
): Promise<SymbolSummary[]> {
  validateSearchSymbolsOptions(input);
  const context = await createEngineContext(input);

  try {
    return searchSymbolsInContext(context, input);
  } finally {
    closeEngineContext(context);
  }
}

function searchTextInContext(
  context: EngineContext,
  input: SearchTextOptions,
): SearchTextMatch[] {
  const rows = context.db.prepare(
      `
        SELECT files.path AS file_path, content_blobs.content AS content
        FROM content_blobs
        INNER JOIN files ON files.id = content_blobs.file_id
        ORDER BY files.path ASC
      `,
    ).all() as Array<{ file_path: string; content: string }>;
  const lowerQuery = input.query.toLowerCase();
  const matches: SearchTextMatch[] = [];

  for (const row of rows) {
    if (!matchesFilePattern(row.file_path, input.filePattern)) {
      continue;
    }
    const lines = row.content.split("\n");
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(lowerQuery)) {
        matches.push({
          filePath: row.file_path,
          line: index + 1,
          preview: line.trim(),
        });
      }
    });
  }

  return matches;
}

export async function searchText(
  input: SearchTextOptions,
): Promise<SearchTextMatch[]> {
  const context = await createEngineContext(input);

  try {
    return searchTextInContext(context, input);
  } finally {
    closeEngineContext(context);
  }
}

export async function queryCode(
  input: QueryCodeOptions,
): Promise<QueryCodeResult> {
  const context = await createEngineContext(input);

  try {
    switch (resolveQueryCodeIntent(input)) {
      case "discover": {
        const symbolMatches = searchSymbolsInContext(context, {
          repoRoot: context.config.repoRoot,
          query: input.query ?? "",
          kind: input.kind,
          language: input.language,
          filePattern: input.filePattern,
          limit: input.limit,
        });
        const textMatches = input.includeTextMatches
          ? searchTextInContext(context, {
              repoRoot: context.config.repoRoot,
              query: input.query ?? "",
              filePattern: input.filePattern,
            })
          : [];

        const result: QueryCodeDiscoverResult = {
          intent: "discover",
          query: input.query ?? "",
          symbolMatches,
          textMatches,
        };
        return result;
      }
      case "source": {
        const fileContent = input.filePath
          ? getFileContentFromContext(context, input.filePath)
          : null;
        const hasSymbolRequest = Boolean(input.symbolId) || Boolean(input.symbolIds?.length);
        const symbolSource = hasSymbolRequest
          ? getSymbolSourceFromContext(context, {
              symbolId: input.symbolId,
              symbolIds: input.symbolIds,
              contextLines: input.contextLines,
              verify: input.verify,
            })
          : null;

        const result: QueryCodeSourceResult = {
          intent: "source",
          fileContent,
          symbolSource,
        };
        return result;
      }
      case "assemble": {
        const ranked = input.includeRankedCandidates && input.query
          ? getRankedContextFromContext(context, {
              repoRoot: context.config.repoRoot,
              query: input.query,
              tokenBudget: input.tokenBudget,
            })
          : null;
        const bundle = ranked
          ? ranked.bundle
          : getContextBundleFromContext(context, {
              repoRoot: context.config.repoRoot,
              query: input.query,
              symbolIds: input.symbolIds,
              tokenBudget: input.tokenBudget,
            });

        const result: QueryCodeAssembleResult = {
          intent: "assemble",
          bundle,
          ranked,
        };
        return result;
      }
      default:
        throw new Error(`Unsupported query_code intent: ${String(input.intent)}`);
    }
  } finally {
    closeEngineContext(context);
  }
}

function resolveQueryCodeIntent(
  input: Pick<
    QueryCodeOptions,
    "intent" | "symbolId" | "symbolIds" | "filePath" | "tokenBudget" | "includeRankedCandidates"
  >,
): Exclude<QueryCodeIntent, "auto"> {
  if (input.intent && input.intent !== "auto") {
    return input.intent;
  }

  if (input.filePath || input.symbolId) {
    return "source";
  }

  if (input.tokenBudget !== undefined || input.includeRankedCandidates) {
    return "assemble";
  }

  if (input.symbolIds && input.symbolIds.length > 0) {
    return "source";
  }

  return "discover";
}

function getContextBundleFromContext(
  context: EngineContext,
  input: ContextBundleOptions,
): ContextBundle {
  const normalizedSeeds = validateContextBundleOptions(input);
  const normalizedInput = {
    ...input,
    repoRoot: context.config.repoRoot,
    ...normalizedSeeds,
  };
  const seedCandidates = resolveRankedSeedCandidates(context.db, normalizedInput).slice(0, 3);
  return buildContextBundleFromSeeds(context.db, normalizedInput, seedCandidates);
}

export async function getContextBundle(
  input: ContextBundleOptions,
): Promise<ContextBundle> {
  const context = await createEngineContext(input);

  try {
    return getContextBundleFromContext(context, input);
  } finally {
    closeEngineContext(context);
  }
}

function getRankedContextFromContext(context: EngineContext, input: {
  repoRoot: string;
  query: string;
  tokenBudget?: number;
}): RankedContextResult {
  validateRankedContextOptions(input);
  const normalizedInput = {
    ...input,
    repoRoot: context.config.repoRoot,
  };
  const seedCandidates = resolveRankedSeedCandidates(context.db, normalizedInput);
  const bundle = buildContextBundleFromSeeds(context.db, normalizedInput, seedCandidates.slice(0, 3));
  return buildRankedContextResult(normalizedInput, seedCandidates, bundle);
}

export async function getRankedContext(input: {
  repoRoot: string;
  query: string;
  tokenBudget?: number;
}): Promise<RankedContextResult> {
  const context = await createEngineContext(input);

  try {
    return getRankedContextFromContext(context, input);
  } finally {
    closeEngineContext(context);
  }
}

function getFileContentFromContext(
  context: EngineContext,
  filePath: string,
): FileContentResult {
  const { relativePath } = normalizeRepoRelativePath(context.config.repoRoot, filePath);
  const row = context.db.prepare(
      `
        SELECT content_blobs.content AS content
        FROM content_blobs
        INNER JOIN files ON files.id = content_blobs.file_id
        WHERE files.path = ?
      `,
    ).get(relativePath) as { content: string } | undefined;

  if (!row) {
    throw new Error(`File not indexed: ${relativePath}`);
  }

  return {
    filePath: relativePath,
    content: row.content,
  };
}

export async function getFileContent(input: {
  repoRoot: string;
  filePath: string;
}): Promise<FileContentResult> {
  const context = await createEngineContext(input);

  try {
    return getFileContentFromContext(context, input.filePath);
  } finally {
    closeEngineContext(context);
  }
}

function getSymbolSourceFromContext(context: EngineContext, input: {
  symbolId?: string;
  symbolIds?: string[];
  verify?: boolean;
  contextLines?: number;
}): SymbolSourceResult {
  validateSymbolSourceOptions(input);
  const requestedIds = [
    ...(input.symbolId ? [input.symbolId] : []),
    ...(input.symbolIds ?? []),
  ];
  const symbolIds = [...new Set(requestedIds.filter(Boolean))];

  if (symbolIds.length === 0) {
    throw new Error("At least one symbol id is required");
  }

  const rows = symbolIds.map((symbolId) => {
    const row = context.db.prepare(
      `
        SELECT
          symbols.id, symbols.name, symbols.qualified_name, symbols.kind, symbols.file_path,
          symbols.signature, symbols.summary, symbols.summary_source,
          symbols.start_line, symbols.end_line, symbols.start_byte, symbols.end_byte,
          symbols.exported,
          files.content_hash, content_blobs.content
        FROM symbols
        INNER JOIN files ON files.id = symbols.file_id
        INNER JOIN content_blobs ON content_blobs.file_id = files.id
        WHERE symbols.id = ?
      `,
    ).get(symbolId) as (DbSymbolRow & {
      content_hash: string;
      content: string;
    }) | undefined;

    if (!row) {
      throw new Error(`Symbol not indexed: ${symbolId}`);
    }
    return row;
  });

  const items = rows.map((row) =>
    buildSymbolSourceItem(row, input.verify === true, input.contextLines),
  );
  const first = items[0];

  return {
    requestedContextLines: Math.max(0, Math.floor(input.contextLines ?? 0)),
    items,
    symbol: first?.symbol,
    source: first?.source,
    verified: first?.verified,
    startLine: first?.startLine,
    endLine: first?.endLine,
  };
}

export async function getSymbolSource(input: {
  repoRoot: string;
  symbolId?: string;
  symbolIds?: string[];
  verify?: boolean;
  contextLines?: number;
}): Promise<SymbolSourceResult> {
  const context = await createEngineContext(input);

  try {
    return getSymbolSourceFromContext(context, input);
  } finally {
    closeEngineContext(context);
  }
}

export async function diagnostics(input: DiagnosticsOptions): Promise<DiagnosticsResult> {
  const config = await ensureStorage(input.repoRoot);
  const db = openDatabase(config.paths.databasePath);
  const repoRoot = config.repoRoot;

  try {
    const meta = await readRepoMeta(config.paths.repoMetaPath);
    const indexedEntries = loadIndexedSnapshot(db);
    const indexedSnapshotHash =
      meta?.indexedSnapshotHash ?? (indexedEntries.length > 0 ? snapshotHash(indexedEntries) : null);
    const scanFreshness = input.scanFreshness === true;
    const drift = scanFreshness
      ? compareSnapshots(indexedEntries, await loadFilesystemSnapshot(repoRoot))
      : {
          missingPaths: [] as string[],
          extraPaths: [] as string[],
          changedPaths: [] as string[],
          indexedFiles: indexedEntries.length,
          currentFiles: meta?.indexedFiles ?? indexedEntries.length,
          missingFiles: 0,
          changedFiles: 0,
          extraFiles: 0,
          indexedSnapshotHash: indexedSnapshotHash ?? null,
          currentSnapshotHash: indexedSnapshotHash ?? null,
        };
    const indexedAt = meta?.indexedAt ?? null;
    const indexAgeMs =
      indexedAt !== null ? Math.max(0, Date.now() - Date.parse(indexedAt)) : null;
    const staleReasons: string[] = [];

    if (!meta) {
      staleReasons.push("index metadata missing");
    }
    if (scanFreshness) {
      if (drift.missingFiles > 0) {
        staleReasons.push("missing files");
      }
      if (drift.changedFiles > 0) {
        staleReasons.push("content drift");
      }
      if (drift.extraFiles > 0) {
        staleReasons.push("new files");
      }
    }

    const staleStatus: DiagnosticsResult["staleStatus"] =
      scanFreshness
        ? meta && staleReasons.length === 0
          ? "fresh"
          : meta
            ? "stale"
            : "unknown"
        : meta?.staleStatus ?? "unknown";
    const summarySources = Object.fromEntries(
      typedAll<{ summary_source: SummarySource; count: number }>(
        db.prepare(
          `
            SELECT summary_source, COUNT(*) AS count
            FROM symbols
            GROUP BY summary_source
          `,
        ),
      ).map((row) => [row.summary_source, row.count]),
    ) as DiagnosticsResult["summarySources"];

    return {
      storageDir: config.paths.storageDir,
      databasePath: config.paths.databasePath,
      storageMode: config.storageMode,
      storageBackend: SQLITE_INDEX_BACKEND.backendName,
      staleStatus,
      freshnessMode: scanFreshness ? "scan" : "metadata",
      freshnessScanned: scanFreshness,
      summaryStrategy: meta?.summaryStrategy ?? config.summaryStrategy,
      summarySources,
      indexedAt,
      indexAgeMs,
      indexedFiles: meta?.indexedFiles ?? drift.indexedFiles,
      indexedSymbols:
        meta?.indexedSymbols ??
        countRows(db, "SELECT COUNT(*) AS count FROM symbols"),
      currentFiles: drift.currentFiles,
      missingFiles: drift.missingFiles,
      changedFiles: drift.changedFiles,
      extraFiles: drift.extraFiles,
      indexedSnapshotHash,
      currentSnapshotHash: drift.currentSnapshotHash,
      staleReasons,
      watch: meta?.watch ?? createDefaultWatchDiagnostics(),
    };
  } finally {
    db.close();
  }
}
