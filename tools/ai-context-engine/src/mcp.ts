#!/usr/bin/env node

import process from "node:process";
import { randomUUID } from "node:crypto";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  getMcpToolDefinition,
  MCP_SERVER_NAME,
  MCP_SERVER_VERSION,
  MCP_TOOL_DEFINITIONS,
} from "./mcp-contract.ts";
import { emitEngineEvent } from "./event-sink.ts";
import { getLogger } from "./logger.ts";

type EngineModule = typeof import("./index.ts");

let engineModulePromise: Promise<EngineModule> | null = null;
const logger = getLogger({ component: "mcp" });

function asTextResult(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

function loadEngineModule(): Promise<EngineModule> {
  engineModulePromise ??= import("./index.ts");
  return engineModulePromise;
}

function estimateTokenCount(value: unknown): number {
  if (typeof value === "string") {
    return Math.max(1, Math.ceil(value.length / 4));
  }

  const serialized = JSON.stringify(value);
  if (!serialized) {
    return 0;
  }

  return Math.max(1, Math.ceil(serialized.length / 4));
}

interface ToolTokenEstimate {
  baselineTokens: number;
  returnedTokens: number;
  savedTokens: number;
  savedPercent: number;
}

interface ToolCompletionSummary {
  summary: string;
  detail: string[];
  tokenEstimate?: ToolTokenEstimate;
}

function toSavedPercent(savedTokens: number, baselineTokens: number): number {
  if (baselineTokens <= 0) {
    return 0;
  }

  return Math.max(0, Math.round((savedTokens / baselineTokens) * 100));
}

function buildTokenEstimate(
  baselineTokens: number | null,
  returnedTokens: number,
): ToolTokenEstimate | undefined {
  if (baselineTokens === null || baselineTokens <= 0) {
    return undefined;
  }

  const normalizedBaseline = Math.max(baselineTokens, returnedTokens);
  const savedTokens = Math.max(0, normalizedBaseline - returnedTokens);
  return {
    baselineTokens: normalizedBaseline,
    returnedTokens,
    savedTokens,
    savedPercent: toSavedPercent(savedTokens, normalizedBaseline),
  };
}

function summarizeToolCompletion(
  name: string,
  result: unknown,
): ToolCompletionSummary {
  const returnedTokens = estimateTokenCount(result);

  if (name === "index_folder" && result && typeof result === "object") {
    const summary = result as {
      indexedFiles?: number;
      indexedSymbols?: number;
      staleStatus?: string;
    };
    return {
      summary: `Indexed ${summary.indexedFiles ?? 0} files and ${summary.indexedSymbols ?? 0} symbols`,
      detail: [
        `stale status: ${summary.staleStatus ?? "unknown"}`,
        `returned ~${returnedTokens} tokens`,
      ],
    };
  }

  if (name === "index_file" && result && typeof result === "object") {
    const summary = result as {
      indexedFiles?: number;
      indexedSymbols?: number;
      staleStatus?: string;
    };
    return {
      summary: `Refreshed 1 file and now tracks ${summary.indexedSymbols ?? 0} symbols`,
      detail: [
        `stale status: ${summary.staleStatus ?? "unknown"}`,
        `returned ~${returnedTokens} tokens`,
      ],
    };
  }

  if (name === "get_repo_outline" && result && typeof result === "object") {
    const outline = result as {
      totalFiles?: number;
      totalSymbols?: number;
      languages?: Record<string, number>;
    };
    return {
      summary: `Outlined ${outline.totalFiles ?? 0} files and ${outline.totalSymbols ?? 0} symbols`,
      detail: [
        `languages: ${Object.keys(outline.languages ?? {}).length}`,
        `returned ~${returnedTokens} tokens`,
      ],
    };
  }

  if (name === "get_file_tree" && Array.isArray(result)) {
    return {
      summary: `Returned ${result.length} indexed files`,
      detail: [`returned ~${returnedTokens} tokens`],
    };
  }

  if (name === "get_file_outline" && result && typeof result === "object") {
    const outline = result as {
      filePath?: string;
      symbols?: Array<unknown>;
    };
    return {
      summary: `Outlined ${outline.symbols?.length ?? 0} symbols in ${outline.filePath ?? "file"}`,
      detail: [`returned ~${returnedTokens} tokens`],
    };
  }

  if (name === "suggest_initial_queries" && Array.isArray(result)) {
    return {
      summary: `Suggested ${result.length} starting queries`,
      detail: [`returned ~${returnedTokens} tokens`],
    };
  }

  if (name === "query_code" && result && typeof result === "object") {
    const queryResult = result as {
      intent?: string;
      query?: string;
      symbolMatches?: Array<unknown>;
      textMatches?: Array<unknown>;
      fileContent?: { filePath?: string; content?: string } | null;
      symbolSource?: { items?: Array<{ source?: string }>; source?: string } | null;
      bundle?: { items?: Array<unknown>; estimatedTokens?: number; usedTokens?: number } | null;
    };

    if (queryResult.intent === "discover") {
      return {
        summary: `Found ${queryResult.symbolMatches?.length ?? 0} symbols and ${queryResult.textMatches?.length ?? 0} text matches`,
        detail: [
          `query: ${queryResult.query ?? "none"}`,
          `returned ~${returnedTokens} tokens`,
        ],
      };
    }

    if (queryResult.intent === "source") {
      const sourceTokens = queryResult.fileContent?.content
        ? estimateTokenCount(queryResult.fileContent.content)
        : queryResult.symbolSource?.items?.reduce(
          (total, item) => total + estimateTokenCount(item.source ?? ""),
          0,
        ) ?? estimateTokenCount(queryResult.symbolSource?.source ?? "");
      return {
        summary: queryResult.fileContent?.filePath
          ? `Returned source for ${queryResult.fileContent.filePath}`
          : `Returned ${queryResult.symbolSource?.items?.length ?? 1} source snippets`,
        detail: [`returned ~${returnedTokens} tokens`],
        tokenEstimate: buildTokenEstimate(sourceTokens || null, returnedTokens),
      };
    }

    if (queryResult.intent === "assemble" && queryResult.bundle) {
      const baselineTokens = queryResult.bundle.estimatedTokens ?? null;
      return {
        summary: `Assembled ${queryResult.bundle.items?.length ?? 0} context snippets`,
        detail: [
          `query: ${queryResult.query ?? "none"}`,
          `bundle budget used: ${queryResult.bundle.usedTokens ?? 0}/${baselineTokens ?? 0}`,
        ],
        tokenEstimate: buildTokenEstimate(baselineTokens, returnedTokens),
      };
    }
  }

  if (name === "diagnostics" && result && typeof result === "object") {
    const diagnostics = result as {
      staleStatus?: string;
      indexedFiles?: number;
      changedFiles?: number;
      watch?: { status?: string };
    };
    return {
      summary: `Diagnostics: ${diagnostics.indexedFiles ?? 0} indexed files, watch ${diagnostics.watch?.status ?? "unknown"}`,
      detail: [
        `stale status: ${diagnostics.staleStatus ?? "unknown"}`,
        `changed files: ${diagnostics.changedFiles ?? 0}`,
      ],
    };
  }

  return {
    summary: `${name} completed`,
    detail: [`returned ~${returnedTokens} tokens`],
  };
}

export async function dispatchTool(name: string, args: Record<string, unknown>) {
  const tool = getMcpToolDefinition(name);
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }

  const startedAt = Date.now();
  const correlationId = randomUUID();
  const repoRoot = typeof args.repoRoot === "string" ? args.repoRoot : undefined;
  logger.debug({
    event: "tool_call_start",
    toolName: name,
    argKeys: Object.keys(args).sort(),
  });
  if (repoRoot) {
    emitEngineEvent({
      repoRoot,
      source: "mcp",
      event: "mcp.tool.started",
      level: "debug",
      correlationId,
      data: {
        toolName: name,
        argKeys: Object.keys(args).sort(),
      },
    });
  }

  const engine = await loadEngineModule();
  try {
    const result = await tool.execute(engine, args);
    const completion = summarizeToolCompletion(name, result);
    logger.debug({
      event: "tool_call_finish",
      toolName: name,
      durationMs: Date.now() - startedAt,
    });
    if (repoRoot) {
      emitEngineEvent({
        repoRoot,
        source: "mcp",
        event: "mcp.tool.finished",
        level: "info",
        correlationId,
        data: {
          toolName: name,
          durationMs: Date.now() - startedAt,
          summary: completion.summary,
          detail: completion.detail,
          tokenEstimate: completion.tokenEstimate,
        },
      });
    }
    return result;
  } catch (error) {
    logger.error({
      event: "tool_call_error",
      toolName: name,
      durationMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : String(error),
    });
    if (repoRoot) {
      emitEngineEvent({
        repoRoot,
        source: "mcp",
        event: "mcp.tool.failed",
        level: "error",
        correlationId,
        data: {
          toolName: name,
          durationMs: Date.now() - startedAt,
          message: error instanceof Error ? error.message : String(error),
        },
      });
    }
    throw error;
  }
}

export function createMcpServer() {
  const server = new McpServer({
    name: MCP_SERVER_NAME,
    version: MCP_SERVER_VERSION,
  });

  for (const tool of MCP_TOOL_DEFINITIONS) {
    server.registerTool(tool.name, {
      description: tool.description,
      inputSchema: tool.inputSchema,
    }, async (args: Record<string, unknown>) =>
      asTextResult(await dispatchTool(tool.name, args)));
  }

  return server;
}

async function main() {
  logger.info({
    event: "server_start",
    serverName: MCP_SERVER_NAME,
    serverVersion: MCP_SERVER_VERSION,
  });
  const server = createMcpServer();
  const transport = new StdioServerTransport();

  const closeServer = async () => {
    await server.close();
    process.exit(0);
  };

  process.once("SIGINT", () => {
    void closeServer();
  });
  process.once("SIGTERM", () => {
    void closeServer();
  });

  await server.connect(transport);
  logger.info({ event: "server_connected" });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
