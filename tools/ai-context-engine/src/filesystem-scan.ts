import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fdir } from "fdir";

import { createDefaultEngineConfig } from "./config.ts";
import { supportedLanguageForFile } from "./parser.ts";
import type { SupportedLanguage } from "./types.ts";

export interface SnapshotEntry {
  path: string;
  contentHash: string;
}

export interface FilesystemStateEntry {
  path: string;
  mtimeMs: number;
  size: number;
}

export interface DirectoryStateEntry {
  path: string;
  mtimeMs: number;
}

interface SupportedFileCandidate {
  absolutePath: string;
  relativePath: string;
}

export interface DiscoveredSourceFile {
  absolutePath: string;
  relativePath: string;
  language: SupportedLanguage;
  sizeBytes: number;
}

const SKIP_SEGMENTS = new Set([
  ".git",
  ".next",
  ".turbo",
  ".vercel",
  ".astrograph",
  ".codeintel",
  "coverage",
  "dist",
  "node_modules",
]);

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function snapshotHash(entries: SnapshotEntry[]): string {
  return sha256(
    entries
      .slice()
      .sort((left, right) => left.path.localeCompare(right.path))
      .map((entry) => `${entry.path}:${entry.contentHash}`)
      .join("\n"),
  );
}

export function isGitIgnored(repoRoot: string, filePath: string): boolean {
  try {
    execFileSync("git", ["check-ignore", "--quiet", filePath], {
      cwd: repoRoot,
      stdio: ["ignore", "ignore", "ignore"],
    });
    return true;
  } catch (error) {
    return (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error as { status?: unknown }).status === 0
    );
  }
}

export function resolveGitIgnoredPaths(
  repoRoot: string,
  filePaths: string[],
): Set<string> {
  if (filePaths.length === 0) {
    return new Set();
  }

  const input = Buffer.from(
    `${filePaths.join("\u0000")}\u0000`,
    "utf8",
  );
  const result = spawnSync(
    "git",
    ["check-ignore", "--stdin", "-z", "-v", "-n"],
    {
      cwd: repoRoot,
      input,
      encoding: "buffer",
      stdio: ["pipe", "pipe", "ignore"],
    },
  );

  if (result.status !== 0) {
    return new Set(filePaths.filter((filePath) => isGitIgnored(repoRoot, filePath)));
  }

  const fields = result.stdout.toString("utf8").split("\u0000");
  const ignoredPaths = new Set<string>();

  for (let index = 0; index + 3 < fields.length; index += 4) {
    const source = fields[index];
    const line = fields[index + 1];
    const pattern = fields[index + 2];
    const filePath = fields[index + 3];
    if (!filePath) {
      continue;
    }
    if (source || line || pattern) {
      ignoredPaths.add(filePath);
    }
  }

  return ignoredPaths;
}

export async function scanSupportedFileCandidates(
  rootDir: string,
  currentDir = rootDir,
): Promise<SupportedFileCandidate[]> {
  const results = await discoverSourceFiles({
    repoRoot: rootDir,
    startRelativePath: path.relative(rootDir, currentDir),
    respectGitIgnore: false,
  });
  return results.map(({ absolutePath, relativePath }) => ({
    absolutePath,
    relativePath,
  }));
}

export async function discoverSourceFiles(options: {
  repoRoot: string;
  startRelativePath?: string;
  respectGitIgnore?: boolean;
}): Promise<DiscoveredSourceFile[]> {
  const startRelativePath = options.startRelativePath ?? "";
  const startDir = startRelativePath
    ? path.join(options.repoRoot, startRelativePath)
    : options.repoRoot;

  const crawledPaths = await new fdir()
    .withFullPaths()
    .exclude((dirName) => SKIP_SEGMENTS.has(dirName))
    .crawl(startDir)
    .withPromise();

  const discoveredFiles = await Promise.all(
    crawledPaths.map(async (absolutePath) => {
      const relativePath = path.relative(options.repoRoot, absolutePath);
      if (relativePath.startsWith(`..${path.sep}`) || relativePath === "..") {
        return null;
      }

      const language = supportedLanguageForFile(relativePath);
      if (!language) {
        return null;
      }

      const fileStat = await stat(absolutePath).catch(() => null);
      if (!fileStat?.isFile()) {
        return null;
      }

      return {
        absolutePath,
        relativePath,
        language,
        sizeBytes: fileStat.size,
      };
    }),
  );

  const filteredDiscoveredFiles: DiscoveredSourceFile[] = discoveredFiles.filter(
    (entry): entry is DiscoveredSourceFile => entry !== null,
  );
  const respectGitIgnore = options.respectGitIgnore ?? true;
  const ignoredPaths = respectGitIgnore
    ? resolveGitIgnoredPaths(
        options.repoRoot,
        filteredDiscoveredFiles.map((entry) => entry.relativePath),
      )
    : new Set<string>();

  return filteredDiscoveredFiles
    .filter((entry) => !ignoredPaths.has(entry.relativePath))
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

export async function loadFilesystemSnapshot(
  repoRoot: string,
): Promise<SnapshotEntry[]> {
  const files = await listSupportedFiles(repoRoot);
  const entries: SnapshotEntry[] = [];

  for (const filePath of files) {
    const content = await readFile(path.join(repoRoot, filePath), "utf8");
    entries.push({
      path: filePath,
      contentHash: sha256(content),
    });
  }

  return entries;
}

export async function scanDirectoryStateSnapshot(
  rootDir: string,
  currentDir = rootDir,
): Promise<DirectoryStateEntry[]> {
  const currentStat = await stat(currentDir);
  const results: DirectoryStateEntry[] = [
    {
      path: path.relative(rootDir, currentDir),
      mtimeMs: currentStat.mtimeMs,
    },
  ];
  const entries = await readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isSymbolicLink() || !entry.isDirectory() || SKIP_SEGMENTS.has(entry.name)) {
      continue;
    }

    results.push(
      ...(await scanDirectoryStateSnapshot(rootDir, path.join(currentDir, entry.name))),
    );
  }

  return results.sort((left, right) => left.path.localeCompare(right.path));
}

export async function loadKnownDirectoryStateSnapshot(
  rootDir: string,
  knownPaths: string[],
): Promise<DirectoryStateEntry[]> {
  const results: DirectoryStateEntry[] = [];

  for (const knownPath of knownPaths) {
    const absolutePath = knownPath ? path.join(rootDir, knownPath) : rootDir;
    const directoryStat = await stat(absolutePath)
      .then((entry) => (entry.isDirectory() ? entry : null))
      .catch(() => null);
    if (!directoryStat) {
      continue;
    }

    results.push({
      path: knownPath,
      mtimeMs: directoryStat.mtimeMs,
    });
  }

  return results.sort((left, right) => left.path.localeCompare(right.path));
}

export async function loadSupportedFileStatesForSubtree(
  rootDir: string,
  startRelativePath = "",
): Promise<FilesystemStateEntry[]> {
  const config = createDefaultEngineConfig({ repoRoot: rootDir });
  const discoveredFiles = await discoverSourceFiles({
    repoRoot: rootDir,
    startRelativePath,
    respectGitIgnore: config.respectGitIgnore,
  });
  const results: FilesystemStateEntry[] = [];

  for (const discoveredFile of discoveredFiles) {
    const fileStat = await stat(discoveredFile.absolutePath);
    results.push({
      path: discoveredFile.relativePath,
      mtimeMs: fileStat.mtimeMs,
      size: fileStat.size,
    });
  }

  return results.sort((left, right) => left.path.localeCompare(right.path));
}

export async function loadFilesystemStateSnapshot(
  rootDir: string,
): Promise<FilesystemStateEntry[]> {
  return loadSupportedFileStatesForSubtree(rootDir);
}

export function compareDirectoryStates(
  previousEntries: DirectoryStateEntry[],
  currentEntries: DirectoryStateEntry[],
) {
  const previousMap = new Map(previousEntries.map((entry) => [entry.path, entry]));
  const currentMap = new Map(currentEntries.map((entry) => [entry.path, entry]));
  const missingDirectories = previousEntries.filter((entry) => !currentMap.has(entry.path));
  const changedDirectories = currentEntries.filter((entry) => {
    const previousEntry = previousMap.get(entry.path);
    return Boolean(previousEntry && previousEntry.mtimeMs !== entry.mtimeMs);
  });

  return {
    missingPaths: missingDirectories.map((entry) => entry.path),
    changedPaths: changedDirectories.map((entry) => entry.path),
  };
}

export function parentDirectoryPath(fileOrDirectoryPath: string): string {
  const parent = path.dirname(fileOrDirectoryPath);
  return parent === "." ? "" : parent;
}

export function compactDirectoryRescanPaths(paths: string[]): string[] {
  return [...new Set(paths)]
    .sort((left, right) => left.length - right.length || left.localeCompare(right))
    .filter((candidate, index, allPaths) =>
      !allPaths.slice(0, index).some((parent) =>
        candidate !== parent &&
        candidate.startsWith(parent === "" ? "" : `${parent}${path.sep}`),
      )
    );
}

export async function listSupportedFiles(
  rootDir: string,
  currentDir = rootDir,
): Promise<string[]> {
  const config = createDefaultEngineConfig({ repoRoot: rootDir });
  const discoveredFiles = await discoverSourceFiles({
    repoRoot: rootDir,
    startRelativePath: path.relative(rootDir, currentDir),
    respectGitIgnore: config.respectGitIgnore,
  });
  return discoveredFiles.map((entry) => entry.relativePath);
}
