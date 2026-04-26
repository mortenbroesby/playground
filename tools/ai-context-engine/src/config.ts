import { execFileSync } from "node:child_process";
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import type {
  EngineConfig,
  EnginePaths,
  RepoEngineConfig,
  ResolvedRepoEngineConfig,
  EngineToolName,
  SymbolKind,
  SummaryStrategy,
} from "./types.ts";

const DEFAULT_LANGUAGES = ["ts", "tsx", "js", "jsx"] as const;

export const ENGINE_STORAGE_DIRNAME = ".ai-context-engine";
export const ENGINE_CONFIG_FILENAME = "ai-context-engine.config.json";
export const DEFAULT_SUMMARY_STRATEGY: SummaryStrategy = "doc-comments-first";
export const DEFAULT_OBSERVABILITY_HOST = "127.0.0.1";
export const DEFAULT_OBSERVABILITY_PORT = 4318;
export const DEFAULT_OBSERVABILITY_RECENT_LIMIT = 100;
export const DEFAULT_OBSERVABILITY_SNAPSHOT_INTERVAL_MS = 1000;
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
  "query_code",
  "diagnostics",
];

const repoObservabilityConfigSchema = z.object({
  enabled: z.boolean().optional(),
  host: z.string().min(1).optional(),
  port: z.number().int().nonnegative().optional(),
  recentLimit: z.number().int().positive().optional(),
  snapshotIntervalMs: z.number().int().positive().optional(),
});

const repoEngineConfigSchema = z.object({
  summaryStrategy: z.enum(["doc-comments-first", "signature-only"]).optional(),
  observability: repoObservabilityConfigSchema.optional(),
}) satisfies z.ZodType<RepoEngineConfig>;

export function resolveEnginePaths(repoRoot: string): EnginePaths {
  const storageDir = path.join(repoRoot, ENGINE_STORAGE_DIRNAME);

  return {
    storageDir,
    databasePath: path.join(storageDir, "index.sqlite"),
    repoMetaPath: path.join(storageDir, "repo-meta.json"),
    integrityPath: path.join(storageDir, "integrity.sha256"),
    rawCacheDir: path.join(storageDir, "raw-cache"),
    eventsPath: path.join(storageDir, "events.jsonl"),
  };
}

export async function resolveEngineRepoRoot(repoRoot: string): Promise<string> {
  const absoluteRepoRoot = path.resolve(repoRoot);
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
}

function createDefaultResolvedRepoEngineConfig(
  repoRoot: string,
): ResolvedRepoEngineConfig {
  return {
    configPath: null,
    repoRoot,
    summaryStrategy: DEFAULT_SUMMARY_STRATEGY,
    observability: {
      enabled: false,
      host: DEFAULT_OBSERVABILITY_HOST,
      port: DEFAULT_OBSERVABILITY_PORT,
      recentLimit: DEFAULT_OBSERVABILITY_RECENT_LIMIT,
      snapshotIntervalMs: DEFAULT_OBSERVABILITY_SNAPSHOT_INTERVAL_MS,
    },
  };
}

export async function loadRepoEngineConfig(
  repoRoot: string,
  options: { repoRootResolved?: boolean } = {},
): Promise<ResolvedRepoEngineConfig> {
  const resolvedRepoRoot = options.repoRootResolved
    ? repoRoot
    : await resolveEngineRepoRoot(repoRoot);
  const defaults = createDefaultResolvedRepoEngineConfig(resolvedRepoRoot);
  const configPath = path.join(resolvedRepoRoot, ENGINE_CONFIG_FILENAME);
  const contents = await readFile(configPath, "utf8").catch((error: unknown) => {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  });

  if (contents === null) {
    return defaults;
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(contents);
  } catch (error) {
    throw new Error(
      `Invalid ${ENGINE_CONFIG_FILENAME}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const parsed = repoEngineConfigSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error(
      `Invalid ${ENGINE_CONFIG_FILENAME}: ${parsed.error.issues[0]?.message ?? "validation failed"}`,
    );
  }

  return {
    configPath,
    repoRoot: resolvedRepoRoot,
    summaryStrategy: parsed.data.summaryStrategy ?? defaults.summaryStrategy,
    observability: {
      enabled: parsed.data.observability?.enabled ?? defaults.observability.enabled,
      host: parsed.data.observability?.host ?? defaults.observability.host,
      port: parsed.data.observability?.port ?? defaults.observability.port,
      recentLimit:
        parsed.data.observability?.recentLimit ?? defaults.observability.recentLimit,
      snapshotIntervalMs:
        parsed.data.observability?.snapshotIntervalMs
        ?? defaults.observability.snapshotIntervalMs,
    },
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
