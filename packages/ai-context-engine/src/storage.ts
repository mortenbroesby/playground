import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

import { createDefaultEngineConfig } from "./config.ts";
import { parseSourceFile, supportedLanguageForFile } from "./parser.ts";
import type {
  DiagnosticsResult,
  FileContentResult,
  FileOutline,
  FileTreeEntry,
  IndexSummary,
  RepoOutline,
  SearchSymbolsOptions,
  SearchTextMatch,
  SymbolSourceResult,
  SymbolSummary,
  SupportedLanguage,
} from "./types.ts";

const require = createRequire(import.meta.url);
const { DatabaseSync } = require("node:sqlite") as typeof import("node:sqlite");

interface DbSymbolRow {
  id: string;
  name: string;
  qualified_name: string | null;
  kind: SymbolSummary["kind"];
  file_path: string;
  signature: string;
  summary: string;
  start_line: number;
  end_line: number;
  start_byte: number;
  end_byte: number;
  exported: number;
}

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
    startLine: row.start_line,
    endLine: row.end_line,
    exported: Boolean(row.exported),
  };
}

function typedAll<TRow>(
  statement: import("node:sqlite").StatementSync,
  ...params: import("node:sqlite").SQLInputValue[]
): TRow[] {
  return statement.all(...params) as unknown as TRow[];
}

function typedGet<TRow>(
  statement: import("node:sqlite").StatementSync,
  ...params: import("node:sqlite").SQLInputValue[]
): TRow | undefined {
  return statement.get(...params) as unknown as TRow | undefined;
}

function openDatabase(databasePath: string): import("node:sqlite").DatabaseSync {
  const db = new DatabaseSync(databasePath);

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

  return db;
}

async function ensureStorage(repoRoot: string) {
  const config = createDefaultEngineConfig({ repoRoot });
  await mkdir(config.paths.storageDir, { recursive: true });
  await mkdir(config.paths.rawCacheDir, { recursive: true });
  return config;
}

async function writeSidecars(input: {
  repoRoot: string;
  indexedFiles: number;
  totalSymbols: number;
  staleStatus: "fresh" | "stale" | "unknown";
}) {
  const config = createDefaultEngineConfig({ repoRoot: input.repoRoot });
  const meta = {
    repoRoot: input.repoRoot,
    indexedFiles: input.indexedFiles,
    totalSymbols: input.totalSymbols,
    staleStatus: input.staleStatus,
    storageMode: config.storageMode,
    updatedAt: new Date().toISOString(),
  };
  const metaJson = JSON.stringify(meta, null, 2);
  await writeFile(config.paths.repoMetaPath, metaJson);
  await writeFile(config.paths.integrityPath, sha256(metaJson));
}

async function listSupportedFiles(rootDir: string, currentDir = rootDir): Promise<string[]> {
  const entries = await readdir(currentDir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(currentDir, entry.name);
    const relativePath = path.relative(rootDir, absolutePath);

    if (entry.isDirectory()) {
      if (SKIP_SEGMENTS.has(entry.name)) {
        continue;
      }
      results.push(...(await listSupportedFiles(rootDir, absolutePath)));
      continue;
    }

    const language = supportedLanguageForFile(relativePath);
    if (!language) {
      continue;
    }

    results.push(relativePath);
  }

  return results.sort();
}

async function readRepoFile(repoRoot: string, filePath: string) {
  const absolutePath = path.join(repoRoot, filePath);
  const language = supportedLanguageForFile(filePath);
  if (!language) {
    throw new Error(`Unsupported source file: ${filePath}`);
  }

  const content = await readFile(absolutePath, "utf8");
  const fileStat = await stat(absolutePath);
  return {
    absolutePath,
    language,
    content,
    mtimeMs: fileStat.mtimeMs,
  };
}

function countRows(db: import("node:sqlite").DatabaseSync, sql: string): number {
  const row = db.prepare(sql).get() as { count: number };
  return row.count;
}

async function upsertFileIndex(db: import("node:sqlite").DatabaseSync, input: {
  repoRoot: string;
  filePath: string;
}) {
  const file = await readRepoFile(input.repoRoot, input.filePath);
  const parsed = parseSourceFile({
    relativePath: input.filePath,
    content: file.content,
    language: file.language,
  });
  const existing = db
    .prepare("SELECT id, content_hash FROM files WHERE path = ?")
    .get(input.filePath) as { id: number; content_hash: string } | undefined;

  if (existing?.content_hash === parsed.contentHash) {
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
      input.filePath,
      parsed.language,
      parsed.contentHash,
      parsed.symbols.length,
      new Date().toISOString(),
    );
  }

  const fileRow = db
    .prepare("SELECT id FROM files WHERE path = ?")
    .get(input.filePath) as { id: number };

  db.prepare(
    "INSERT INTO content_blobs (file_id, content) VALUES (?, ?)",
  ).run(fileRow.id, file.content);

  const insertSymbol = db.prepare(`
    INSERT INTO symbols (
      id, file_id, file_path, name, qualified_name, kind, signature, summary,
      start_line, end_line, start_byte, end_byte, exported
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const symbol of parsed.symbols) {
    insertSymbol.run(
      symbol.id,
      fileRow.id,
      input.filePath,
      symbol.name,
      symbol.qualifiedName,
      symbol.kind,
      symbol.signature,
      symbol.summary,
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

async function finalizeIndex(db: import("node:sqlite").DatabaseSync, repoRoot: string) {
  const totalFiles = countRows(db, "SELECT COUNT(*) AS count FROM files");
  const totalSymbols = countRows(db, "SELECT COUNT(*) AS count FROM symbols");
  db.prepare(
    "INSERT INTO meta (key, value) VALUES ('staleStatus', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  ).run("fresh");
  await writeSidecars({
    repoRoot,
    indexedFiles: totalFiles,
    totalSymbols,
    staleStatus: "fresh",
  });
}

export async function indexFolder(input: { repoRoot: string }): Promise<IndexSummary> {
  const config = await ensureStorage(input.repoRoot);
  const db = openDatabase(config.paths.databasePath);

  try {
    const supportedFiles = await listSupportedFiles(input.repoRoot);
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
        repoRoot: input.repoRoot,
        filePath,
      });
      if (result.indexed) {
        indexedFiles += 1;
        indexedSymbols += result.symbolCount;
      }
    }

    await finalizeIndex(db, input.repoRoot);

    return {
      indexedFiles,
      indexedSymbols,
      skippedFiles: await countSkippedFiles(input.repoRoot),
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
}): Promise<IndexSummary> {
  const config = await ensureStorage(input.repoRoot);
  const db = openDatabase(config.paths.databasePath);

  try {
    const result = await upsertFileIndex(db, input);
    await finalizeIndex(db, input.repoRoot);

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

export async function getRepoOutline(input: { repoRoot: string }): Promise<RepoOutline> {
  const config = createDefaultEngineConfig({ repoRoot: input.repoRoot });
  const db = openDatabase(config.paths.databasePath);

  try {
    const languages = Object.fromEntries(
      (
        db.prepare(
          "SELECT language, COUNT(*) AS count FROM files GROUP BY language",
        ).all() as Array<{ language: SupportedLanguage; count: number }>
      ).map((row) => [row.language, row.count]),
    ) as RepoOutline["languages"];

    return {
      totalFiles: countRows(db, "SELECT COUNT(*) AS count FROM files"),
      totalSymbols: countRows(db, "SELECT COUNT(*) AS count FROM symbols"),
      languages,
    };
  } finally {
    db.close();
  }
}

export async function getFileTree(input: { repoRoot: string }): Promise<FileTreeEntry[]> {
  const config = createDefaultEngineConfig({ repoRoot: input.repoRoot });
  const db = openDatabase(config.paths.databasePath);

  try {
    const rows = typedAll<{
      path: string;
      language: SupportedLanguage;
      symbol_count: number;
    }>(
      db.prepare("SELECT path, language, symbol_count FROM files ORDER BY path ASC"),
    );
    return rows.map((row) => ({
      path: row.path,
      language: row.language,
      symbolCount: row.symbol_count,
    }));
  } finally {
    db.close();
  }
}

export async function getFileOutline(input: {
  repoRoot: string;
  filePath: string;
}): Promise<FileOutline> {
  const config = createDefaultEngineConfig({ repoRoot: input.repoRoot });
  const db = openDatabase(config.paths.databasePath);

  try {
    const rows = typedAll<DbSymbolRow>(db.prepare(
      `
        SELECT
          id, name, qualified_name, kind, file_path, signature, summary,
          start_line, end_line, start_byte, end_byte, exported
        FROM symbols
        WHERE file_path = ?
        ORDER BY start_line ASC
      `,
    ), input.filePath);

    return {
      filePath: input.filePath,
      symbols: rows.map(mapSymbolRow),
    };
  } finally {
    db.close();
  }
}

export async function suggestInitialQueries(input: {
  repoRoot: string;
}): Promise<string[]> {
  const config = createDefaultEngineConfig({ repoRoot: input.repoRoot });
  const db = openDatabase(config.paths.databasePath);

  try {
    const rows = db.prepare(
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
    db.close();
  }
}

export async function searchSymbols(
  input: SearchSymbolsOptions,
): Promise<SymbolSummary[]> {
  const config = createDefaultEngineConfig({ repoRoot: input.repoRoot });
  const db = openDatabase(config.paths.databasePath);

  try {
    const rows = typedAll<DbSymbolRow>(db.prepare(
      `
        SELECT
          id, name, qualified_name, kind, file_path, signature, summary,
          start_line, end_line, start_byte, end_byte, exported
        FROM symbols
        ${input.kind ? "WHERE kind = ?" : ""}
      `,
    ), ...(input.kind ? [input.kind] : []));
    const lowerQuery = input.query.toLowerCase();

    return rows
      .map((row) => {
        const haystack = `${row.name} ${row.qualified_name ?? ""} ${row.signature}`.toLowerCase();
        const score =
          row.name.toLowerCase() === lowerQuery
            ? 100
            : row.name.toLowerCase().includes(lowerQuery)
              ? 80
              : haystack.includes(lowerQuery)
                ? 50
                : 0;
        return {
          row,
          score,
        };
      })
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score || left.row.name.localeCompare(right.row.name))
      .slice(0, input.limit ?? 20)
      .map((entry) => mapSymbolRow(entry.row));
  } finally {
    db.close();
  }
}

export async function searchText(input: {
  repoRoot: string;
  query: string;
}): Promise<SearchTextMatch[]> {
  const config = createDefaultEngineConfig({ repoRoot: input.repoRoot });
  const db = openDatabase(config.paths.databasePath);

  try {
    const rows = db.prepare(
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
  } finally {
    db.close();
  }
}

export async function getFileContent(input: {
  repoRoot: string;
  filePath: string;
}): Promise<FileContentResult> {
  const config = createDefaultEngineConfig({ repoRoot: input.repoRoot });
  const db = openDatabase(config.paths.databasePath);

  try {
    const row = db.prepare(
      `
        SELECT content_blobs.content AS content
        FROM content_blobs
        INNER JOIN files ON files.id = content_blobs.file_id
        WHERE files.path = ?
      `,
    ).get(input.filePath) as { content: string } | undefined;

    if (!row) {
      throw new Error(`File not indexed: ${input.filePath}`);
    }

    return {
      filePath: input.filePath,
      content: row.content,
    };
  } finally {
    db.close();
  }
}

export async function getSymbolSource(input: {
  repoRoot: string;
  symbolId: string;
  verify?: boolean;
}): Promise<SymbolSourceResult> {
  const config = createDefaultEngineConfig({ repoRoot: input.repoRoot });
  const db = openDatabase(config.paths.databasePath);

  try {
    const row = db.prepare(
      `
        SELECT
          symbols.id, symbols.name, symbols.qualified_name, symbols.kind, symbols.file_path,
          symbols.signature, symbols.summary, symbols.start_line, symbols.end_line,
          symbols.start_byte, symbols.end_byte, symbols.exported,
          files.content_hash, content_blobs.content
        FROM symbols
        INNER JOIN files ON files.id = symbols.file_id
        INNER JOIN content_blobs ON content_blobs.file_id = files.id
        WHERE symbols.id = ?
      `,
    ).get(input.symbolId) as (DbSymbolRow & {
      content_hash: string;
      content: string;
    }) | undefined;

    if (!row) {
      throw new Error(`Symbol not indexed: ${input.symbolId}`);
    }

    const verified = input.verify
      ? sha256(row.content) === row.content_hash
      : false;

    return {
      symbol: mapSymbolRow(row),
      source: row.content.slice(row.start_byte, row.end_byte),
      verified,
    };
  } finally {
    db.close();
  }
}

export async function diagnostics(input: {
  repoRoot: string;
}): Promise<DiagnosticsResult> {
  const config = createDefaultEngineConfig({ repoRoot: input.repoRoot });
  const db = openDatabase(config.paths.databasePath);

  try {
    const row = db.prepare(
      "SELECT value FROM meta WHERE key = 'staleStatus'",
    ).get() as { value: DiagnosticsResult["staleStatus"] } | undefined;

    return {
      storageDir: config.paths.storageDir,
      databasePath: config.paths.databasePath,
      storageMode: config.storageMode,
      staleStatus: row?.value ?? "unknown",
    };
  } finally {
    db.close();
  }
}
