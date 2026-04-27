import fastJson from "fast-json-stringify";
import type {
  DiagnosticsResult,
  FileTreeEntry,
  IndexSummary,
  RepoOutline,
} from "./types.ts";

interface SerializeOptions {
  pretty?: boolean;
}

const nullableStringSchema = { type: ["string", "null"] } as const;
const nullableNumberSchema = { type: ["number", "null"] } as const;

const indexSummarySchema = {
  type: "object",
  properties: {
    indexedFiles: { type: "integer" },
    indexedSymbols: { type: "integer" },
    staleStatus: { type: "string" },
  },
} as const;

const watchDiagnosticsSchema = {
  type: "object",
  properties: {
    status: { type: "string" },
    backend: nullableStringSchema,
    debounceMs: nullableNumberSchema,
    pollMs: nullableNumberSchema,
    startedAt: nullableStringSchema,
    lastEvent: nullableStringSchema,
    lastEventAt: nullableStringSchema,
    lastChangedPaths: {
      type: "array",
      items: { type: "string" },
    },
    reindexCount: { type: "integer" },
    lastError: nullableStringSchema,
    lastSummary: {
      anyOf: [
        indexSummarySchema,
        { type: "null" },
      ],
    },
  },
} as const;

const diagnosticsSchema = {
  type: "object",
  properties: {
    engineVersion: { type: "string" },
    engineVersionParts: {
      type: "object",
      properties: {
        major: { type: "integer" },
        minor: { type: "integer" },
        patch: { type: "integer" },
        increment: { type: "integer" },
      },
    },
    storageDir: { type: "string" },
    databasePath: { type: "string" },
    storageVersion: { type: "integer" },
    schemaVersion: { type: "integer" },
    storageMode: { type: "string" },
    storageBackend: { type: "string" },
    staleStatus: { type: "string" },
    freshnessMode: { type: "string" },
    freshnessScanned: { type: "boolean" },
    summaryStrategy: { type: "string" },
    summarySources: {
      type: "object",
      additionalProperties: { type: "integer" },
    },
    indexedAt: nullableStringSchema,
    indexAgeMs: nullableNumberSchema,
    indexedFiles: { type: "integer" },
    indexedSymbols: { type: "integer" },
    currentFiles: { type: "integer" },
    missingFiles: { type: "integer" },
    changedFiles: { type: "integer" },
    extraFiles: { type: "integer" },
    indexedSnapshotHash: nullableStringSchema,
    currentSnapshotHash: nullableStringSchema,
    staleReasons: {
      type: "array",
      items: { type: "string" },
    },
    parser: {
      type: "object",
      properties: {
        primaryBackend: { type: "string" },
        fallbackBackend: { type: "string" },
        indexedFileCount: { type: "integer" },
        fallbackFileCount: { type: "integer" },
        fallbackRate: nullableNumberSchema,
        unknownFileCount: { type: "integer" },
        fallbackReasons: {
          type: "object",
          additionalProperties: { type: "integer" },
        },
      },
    },
    dependencyGraph: {
      type: "object",
      properties: {
        brokenRelativeImportCount: { type: "integer" },
        affectedImporterCount: { type: "integer" },
        sampleImporterPaths: {
          type: "array",
          items: { type: "string" },
        },
      },
    },
    watch: watchDiagnosticsSchema,
  },
} as const;

const repoOutlineSchema = {
  type: "object",
  properties: {
    totalFiles: { type: "integer" },
    totalSymbols: { type: "integer" },
    languages: {
      type: "object",
      additionalProperties: { type: "integer" },
    },
  },
} as const;

const fileTreeSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      path: { type: "string" },
      language: { type: "string" },
      symbolCount: { type: "integer" },
    },
  },
} as const;

const stringifyIndexSummary = fastJson(indexSummarySchema);
const stringifyDiagnostics = fastJson(diagnosticsSchema);
const stringifyRepoOutline = fastJson(repoOutlineSchema);
const stringifyFileTree = fastJson(fileTreeSchema);

const COMPACT_SERIALIZERS = new Map<string, (value: unknown) => string>([
  ["init", (value) => stringifyDiagnostics(value as DiagnosticsResult)],
  ["diagnostics", (value) => stringifyDiagnostics(value as DiagnosticsResult)],
  ["index_folder", (value) => stringifyIndexSummary(value as IndexSummary)],
  ["index-folder", (value) => stringifyIndexSummary(value as IndexSummary)],
  ["index_file", (value) => stringifyIndexSummary(value as IndexSummary)],
  ["index-file", (value) => stringifyIndexSummary(value as IndexSummary)],
  ["get_repo_outline", (value) => stringifyRepoOutline(value as RepoOutline)],
  ["get-repo-outline", (value) => stringifyRepoOutline(value as RepoOutline)],
  ["get_file_tree", (value) => stringifyFileTree(value as FileTreeEntry[])],
  ["get-file-tree", (value) => stringifyFileTree(value as FileTreeEntry[])],
]);

export function serializeToolResult(
  toolName: string,
  value: unknown,
  options: SerializeOptions = {},
): string {
  if (options.pretty) {
    return JSON.stringify(value, null, 2);
  }

  const serializer = COMPACT_SERIALIZERS.get(toolName);
  if (!serializer) {
    return JSON.stringify(value);
  }

  try {
    return serializer(value);
  } catch {
    return JSON.stringify(value);
  }
}
