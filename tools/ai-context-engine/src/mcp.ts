#!/usr/bin/env node

import process from "node:process";

import { parseSummaryStrategy } from "./config.ts";
import { parseQueryCodeMcpInput } from "./validation.ts";
import {
  diagnostics,
  getFileOutline,
  getFileTree,
  getRepoOutline,
  indexFile,
  indexFolder,
  queryCode,
  suggestInitialQueries,
} from "./index.ts";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: number | string | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number | string | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties: false;
  };
}

const toolDefinitions: McpTool[] = [
  tool("index_folder", "Index all supported files under a repository root.", {
    repoRoot: stringProp("Repository root path"),
    summaryStrategy: stringProp("Optional summary strategy override"),
  }, ["repoRoot"]),
  tool("index_file", "Refresh a single supported file within a repository.", {
    repoRoot: stringProp("Repository root path"),
    filePath: stringProp("Path relative to the repository root"),
    summaryStrategy: stringProp("Optional summary strategy override"),
  }, ["repoRoot", "filePath"]),
  tool("get_repo_outline", "Return file and symbol counts grouped by language.", {
    repoRoot: stringProp("Repository root path"),
  }, ["repoRoot"]),
  tool("get_file_tree", "Return indexed files with language and symbol counts.", {
    repoRoot: stringProp("Repository root path"),
  }, ["repoRoot"]),
  tool("get_file_outline", "Return symbols for one indexed file.", {
    repoRoot: stringProp("Repository root path"),
    filePath: stringProp("Path relative to the repository root"),
  }, ["repoRoot", "filePath"]),
  tool("suggest_initial_queries", "Suggest likely entry points before code retrieval.", {
    repoRoot: stringProp("Repository root path"),
  }, ["repoRoot"]),
  tool("query_code", "Unified code query surface for discovery, exact retrieval, and bounded assembly.", {
    repoRoot: stringProp("Repository root path"),
    intent: {
      type: "string",
      description: "discover, source, or assemble",
    },
    query: stringProp("Optional query for discover and assemble intents"),
    symbolId: stringProp("Optional indexed symbol id"),
    symbolIds: {
      type: "array",
      items: stringProp("Indexed symbol id"),
      description: "Optional indexed symbol ids",
    },
    filePath: stringProp("Optional path relative to the repository root"),
    kind: {
      type: "string",
      description: "Optional symbol kind filter",
    },
    language: {
      type: "string",
      description: "Optional language filter (ts, tsx, js, jsx)",
    },
    filePattern: {
      type: "string",
      description: "Optional glob-like file path filter",
    },
    limit: {
      type: "number",
      description: "Optional maximum number of symbol results",
    },
    contextLines: {
      type: "number",
      description: "Optional surrounding context line count",
    },
    verify: {
      type: "boolean",
      description: "Verify symbol-source content hash before returning",
    },
    tokenBudget: {
      type: "number",
      description: "Optional bundle token budget",
    },
    includeTextMatches: {
      type: "boolean",
      description: "When discover intent is used, include raw text matches too",
    },
    includeRankedCandidates: {
      type: "boolean",
      description: "When assemble intent is used, include ranked candidate output too",
    },
  }, ["repoRoot", "intent"]),
  tool("diagnostics", "Report storage and freshness metadata.", {
    repoRoot: stringProp("Repository root path"),
    scanFreshness: {
      type: "boolean",
      description: "When true, walk and hash the live repository to detect drift",
    },
  }, ["repoRoot"]),
];

function stringProp(description: string) {
  return {
    type: "string",
    description,
  };
}

function tool(
  name: string,
  description: string,
  properties: Record<string, unknown>,
  required: string[],
): McpTool {
  return {
    name,
    description,
    inputSchema: {
      type: "object",
      properties,
      required,
      additionalProperties: false,
    },
  };
}

function asTextResult(value: unknown) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

function requireString(params: Record<string, unknown>, key: string): string {
  const value = params[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing required argument: ${key}`);
  }
  return value;
}

async function dispatchTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    case "index_folder":
      return indexFolder({
        repoRoot: requireString(args, "repoRoot"),
        summaryStrategy:
          typeof args.summaryStrategy === "string"
            ? parseSummaryStrategy(args.summaryStrategy, "summaryStrategy")
            : undefined,
      });
    case "index_file":
      return indexFile({
        repoRoot: requireString(args, "repoRoot"),
        filePath: requireString(args, "filePath"),
        summaryStrategy:
          typeof args.summaryStrategy === "string"
            ? parseSummaryStrategy(args.summaryStrategy, "summaryStrategy")
            : undefined,
      });
    case "get_repo_outline":
      return getRepoOutline({ repoRoot: requireString(args, "repoRoot") });
    case "get_file_tree":
      return getFileTree({ repoRoot: requireString(args, "repoRoot") });
    case "get_file_outline":
      return getFileOutline({
        repoRoot: requireString(args, "repoRoot"),
        filePath: requireString(args, "filePath"),
      });
    case "suggest_initial_queries":
      return suggestInitialQueries({ repoRoot: requireString(args, "repoRoot") });
    case "query_code":
      return queryCode(parseQueryCodeMcpInput(args));
    case "diagnostics":
      return diagnostics({
        repoRoot: requireString(args, "repoRoot"),
        scanFreshness: args.scanFreshness === true,
      });
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export function createMcpServer() {
  return {
    async handleMessage(request: JsonRpcRequest): Promise<JsonRpcResponse> {
      try {
        switch (request.method) {
          case "initialize":
            return {
              jsonrpc: "2.0",
              id: request.id ?? null,
              result: {
                protocolVersion: "2024-11-05",
                serverInfo: {
                  name: "@playground/ai-context-engine",
                  version: "0.0.1",
                },
                capabilities: {
                  tools: {},
                },
              },
            };
          case "tools/list":
            return {
              jsonrpc: "2.0",
              id: request.id ?? null,
              result: {
                tools: toolDefinitions,
              },
            };
          case "tools/call": {
            const params = request.params ?? {};
            const name = requireString(params, "name");
            const args =
              typeof params.arguments === "object" && params.arguments !== null
                ? (params.arguments as Record<string, unknown>)
                : {};
            const result = await dispatchTool(name, args);
            return {
              jsonrpc: "2.0",
              id: request.id ?? null,
              result: asTextResult(result),
            };
          }
          default:
            throw new Error(`Unsupported method: ${request.method}`);
        }
      } catch (error) {
        return {
          jsonrpc: "2.0",
          id: request.id ?? null,
          error: {
            code: -32000,
            message: error instanceof Error ? error.message : String(error),
          },
        };
      }
    },
  };
}

function parseFrames(buffer: string) {
  const messages: string[] = [];
  let remaining = buffer;

  while (true) {
    const headerEnd = remaining.indexOf("\r\n\r\n");
    if (headerEnd === -1) {
      break;
    }

    const header = remaining.slice(0, headerEnd);
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) {
      throw new Error("Missing Content-Length header");
    }
    const length = Number(match[1]);
    const bodyStart = headerEnd + 4;
    const bodyEnd = bodyStart + length;
    if (remaining.length < bodyEnd) {
      break;
    }

    messages.push(remaining.slice(bodyStart, bodyEnd));
    remaining = remaining.slice(bodyEnd);
  }

  return {
    messages,
    remaining,
  };
}

async function main() {
  const server = createMcpServer();
  let buffer = "";
  let queue = Promise.resolve();

  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk: string) => {
    queue = queue
      .then(async () => {
        buffer += chunk;
        const parsed = parseFrames(buffer);
        buffer = parsed.remaining;

        for (const message of parsed.messages) {
          const response = await server.handleMessage(
            JSON.parse(message) as JsonRpcRequest,
          );
          const payload = JSON.stringify(response);
          process.stdout.write(
            `Content-Length: ${Buffer.byteLength(payload, "utf8")}\r\n\r\n${payload}`,
          );
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`${message}\n`);
        process.exitCode = 1;
      });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
