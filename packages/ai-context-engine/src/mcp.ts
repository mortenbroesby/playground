#!/usr/bin/env node

import process from "node:process";

import {
  diagnostics,
  getFileContent,
  getFileOutline,
  getFileTree,
  getRepoOutline,
  getSymbolSource,
  indexFile,
  indexFolder,
  searchSymbols,
  searchText,
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
  }, ["repoRoot"]),
  tool("index_file", "Refresh a single supported file within a repository.", {
    repoRoot: stringProp("Repository root path"),
    filePath: stringProp("Path relative to the repository root"),
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
  tool("search_symbols", "Search indexed symbols by name and signature.", {
    repoRoot: stringProp("Repository root path"),
    query: stringProp("Search query"),
  }, ["repoRoot", "query"]),
  tool("search_text", "Search indexed raw source text.", {
    repoRoot: stringProp("Repository root path"),
    query: stringProp("Search query"),
  }, ["repoRoot", "query"]),
  tool("get_file_content", "Fetch full indexed file content from the raw cache.", {
    repoRoot: stringProp("Repository root path"),
    filePath: stringProp("Path relative to the repository root"),
  }, ["repoRoot", "filePath"]),
  tool("get_symbol_source", "Fetch exact source for one indexed symbol.", {
    repoRoot: stringProp("Repository root path"),
    symbolId: stringProp("Indexed symbol id"),
    verify: { type: "boolean", description: "Verify content hash before returning" },
  }, ["repoRoot", "symbolId"]),
  tool("diagnostics", "Report storage and freshness metadata.", {
    repoRoot: stringProp("Repository root path"),
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
      return indexFolder({ repoRoot: requireString(args, "repoRoot") });
    case "index_file":
      return indexFile({
        repoRoot: requireString(args, "repoRoot"),
        filePath: requireString(args, "filePath"),
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
    case "search_symbols":
      return searchSymbols({
        repoRoot: requireString(args, "repoRoot"),
        query: requireString(args, "query"),
      });
    case "search_text":
      return searchText({
        repoRoot: requireString(args, "repoRoot"),
        query: requireString(args, "query"),
      });
    case "get_file_content":
      return getFileContent({
        repoRoot: requireString(args, "repoRoot"),
        filePath: requireString(args, "filePath"),
      });
    case "get_symbol_source":
      return getSymbolSource({
        repoRoot: requireString(args, "repoRoot"),
        symbolId: requireString(args, "symbolId"),
        verify: args.verify === true,
      });
    case "diagnostics":
      return diagnostics({ repoRoot: requireString(args, "repoRoot") });
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

  process.stdin.setEncoding("utf8");
  process.stdin.on("data", async (chunk: string) => {
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
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
