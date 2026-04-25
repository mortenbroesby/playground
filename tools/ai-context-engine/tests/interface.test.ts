import path from "node:path";
import { execFile } from "node:child_process";
import { realpath, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import { handleCli } from "../src/cli.ts";
import { createMcpServer } from "../src/mcp.ts";
import { indexFolder } from "../src/index.ts";
import { cleanupFixtureRepos, createFixtureRepo } from "./fixture-repo.ts";

const execFileAsync = promisify(execFile);
const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

afterEach(async () => {
  await cleanupFixtureRepos();
});

describe("ai-context-engine interfaces", () => {
  it("serves JSON CLI commands over the library surface", async () => {
    const repoRoot = await createFixtureRepo();

    const initStdout = await handleCli(["init", "--repo", repoRoot]);
    expect(JSON.parse(initStdout)).toMatchObject({
      staleStatus: "unknown",
      watch: {
        status: "idle",
        lastEvent: null,
      },
    });

    await handleCli(["index-folder", "--repo", repoRoot]);
    const stdout = await handleCli(["get-repo-outline", "--repo", repoRoot]);

    expect(JSON.parse(stdout)).toMatchObject({
      totalFiles: 2,
      totalSymbols: 5,
    });

    const diagnosticsStdout = await handleCli(["diagnostics", "--repo", repoRoot]);
    expect(JSON.parse(diagnosticsStdout)).toMatchObject({
      staleStatus: "fresh",
      freshnessMode: "metadata",
      freshnessScanned: false,
      indexedFiles: 2,
      currentFiles: 2,
    });

    const filteredStdout = await handleCli([
      "search-symbols",
      "--repo",
      repoRoot,
      "--query",
      "Greeter",
      "--kind",
      "class",
      "--limit",
      "1",
    ]);
    expect(JSON.parse(filteredStdout)).toHaveLength(1);
    expect(JSON.parse(filteredStdout)[0]).toMatchObject({
      name: "Greeter",
      kind: "class",
    });
    const filteredTextStdout = await handleCli([
      "search-text",
      "--repo",
      repoRoot,
      "--query",
      "Hello",
      "--file-pattern",
      "src/*.ts",
    ]);
    expect(JSON.parse(filteredTextStdout)[0]).toMatchObject({
      filePath: "src/strings.ts",
    });
    const queryCodeDiscoverStdout = await handleCli([
      "query-code",
      "--repo",
      repoRoot,
      "--query",
      "Greeter",
      "--kind",
      "class",
      "--limit",
      "1",
      "--include-text",
    ]);
    expect(JSON.parse(queryCodeDiscoverStdout)).toMatchObject({
      intent: "discover",
      query: "Greeter",
    });
    expect(JSON.parse(queryCodeDiscoverStdout).symbolMatches[0]).toMatchObject({
      name: "Greeter",
      kind: "class",
    });
    expect(JSON.parse(queryCodeDiscoverStdout).textMatches[0]).toMatchObject({
      filePath: "src/strings.ts",
    });
    const greeterId = JSON.parse(filteredStdout)[0].id as string;

    const greetStdout = await handleCli([
      "search-symbols",
      "--repo",
      repoRoot,
      "--query",
      "greet",
      "--kind",
      "method",
      "--limit",
      "1",
    ]);
    const greetId = JSON.parse(greetStdout)[0].id as string;

    const rankedContextStdout = await handleCli([
      "get-ranked-context",
      "--repo",
      repoRoot,
      "--query",
      "Greeter",
      "--budget",
      "120",
    ]);
    expect(JSON.parse(rankedContextStdout)).toMatchObject({
      query: "Greeter",
      bundle: {
        tokenBudget: 120,
      },
    });
    expect(JSON.parse(rankedContextStdout).candidates[0]).toMatchObject({
      symbol: {
        name: "Greeter",
      },
      selected: true,
    });
    const queryCodeAssembleStdout = await handleCli([
      "query-code",
      "--repo",
      repoRoot,
      "--query",
      "Greeter",
      "--budget",
      "120",
      "--include-ranked",
    ]);
    expect(JSON.parse(queryCodeAssembleStdout)).toMatchObject({
      intent: "assemble",
      bundle: {
        tokenBudget: 120,
      },
      ranked: {
        query: "Greeter",
      },
    });

    const symbolSourceStdout = await handleCli([
      "get-symbol-source",
      "--repo",
      repoRoot,
      "--symbols",
      `${greeterId},${greetId}`,
      "--context-lines",
      "1",
    ]);
    expect(JSON.parse(symbolSourceStdout)).toMatchObject({
      requestedContextLines: 1,
    });
    expect(JSON.parse(symbolSourceStdout).items).toHaveLength(2);
    const queryCodeSourceStdout = await handleCli([
      "query-code",
      "--repo",
      repoRoot,
      "--symbols",
      `${greeterId},${greetId}`,
      "--context-lines",
      "1",
      "--verify",
    ]);
    expect(JSON.parse(queryCodeSourceStdout)).toMatchObject({
      intent: "source",
      symbolSource: {
        requestedContextLines: 1,
      },
    });
    expect(JSON.parse(queryCodeSourceStdout).symbolSource.items).toHaveLength(2);

    const signatureOnlyStdout = await handleCli([
      "index-folder",
      "--repo",
      repoRoot,
      "--summary-strategy",
      "signature-only",
    ]);
    expect(JSON.parse(signatureOnlyStdout)).toMatchObject({
      staleStatus: "fresh",
    });

    const watchPromise = handleCli([
      "watch",
      "--repo",
      repoRoot,
      "--debounce-ms",
      "50",
      "--summary-strategy",
      "signature-only",
      "--timeout-ms",
      "250",
    ]);

    await delay(75);
    await writeFile(
      path.join(repoRoot, "src", "math.ts"),
      `import { formatLabel } from "./strings.js";

export const PI = 3.14;

export function circumference(radius: number): string {
  return formatLabel(2 * PI * radius);
}
`,
    );

    const watchStdout = await watchPromise;
    expect(JSON.parse(watchStdout)).toMatchObject({
      debounceMs: 50,
      stopReason: "timeout",
    });
    expect(JSON.parse(watchStdout).reindexCount).toBeGreaterThanOrEqual(0);
    expect(JSON.parse(watchStdout).initialSummary).toMatchObject({
      staleStatus: "fresh",
    });
    expect(JSON.parse(watchStdout).lastSummary).toMatchObject({
      staleStatus: "fresh",
    });

    const signatureDiagnosticsStdout = await handleCli([
      "diagnostics",
      "--repo",
      repoRoot,
    ]);
    const signatureDiagnostics = JSON.parse(signatureDiagnosticsStdout);
    expect(signatureDiagnostics).toMatchObject({
      summaryStrategy: "signature-only",
      summarySources: {
        signature: 5,
      },
      watch: {
        status: "idle",
        debounceMs: 50,
        pollMs: 50,
        lastEvent: "close",
        lastChangedPaths: [],
        lastSummary: {
          staleStatus: "fresh",
        },
      },
    });
    expect(signatureDiagnostics.watch.reindexCount).toBeGreaterThanOrEqual(0);
  }, 35_000);

  it("treats a subdirectory CLI repo path as the enclosing git worktree root", async () => {
    const repoRoot = await createFixtureRepo();
    const canonicalRepoRoot = await realpath(repoRoot);
    const nestedRepoRoot = path.join(repoRoot, "src");

    const summaryStdout = await handleCli([
      "index-folder",
      "--repo",
      nestedRepoRoot,
    ]);
    expect(JSON.parse(summaryStdout)).toMatchObject({
      indexedFiles: 2,
      indexedSymbols: 5,
      staleStatus: "fresh",
    });

    const diagnosticsStdout = await handleCli([
      "diagnostics",
      "--repo",
      nestedRepoRoot,
    ]);
    expect(JSON.parse(diagnosticsStdout)).toMatchObject({
      storageDir: path.join(canonicalRepoRoot, ".ai-context-engine"),
      databasePath: path.join(canonicalRepoRoot, ".ai-context-engine", "index.sqlite"),
      indexedFiles: 2,
      currentFiles: 2,
    });
  }, 15_000);

  it("exposes spec-aligned MCP tools", async () => {
    const repoRoot = await createFixtureRepo();
    const server = createMcpServer();

    const toolsResponse = await server.handleMessage({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
    });

    const tools = (
      toolsResponse.result as {
        tools: Array<{ name: string }>;
      }
    ).tools;

    expect(tools.map((tool) => tool.name)).toEqual([
      "index_folder",
      "index_file",
      "get_repo_outline",
      "get_file_tree",
      "get_file_outline",
      "suggest_initial_queries",
      "query_code",
      "diagnostics",
    ]);

    await server.handleMessage({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "index_folder",
        arguments: {
          repoRoot,
          summaryStrategy: "signature-only",
        },
      },
    });

    const response = await server.handleMessage({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "query_code",
        arguments: {
          repoRoot,
          intent: "discover",
          query: "Greeter",
          kind: "class",
          includeTextMatches: true,
          limit: 1,
        },
      },
    });

    const content = (
      response.result as {
        content: Array<{ type: string; text: string }>;
      }
    ).content[0];
    expect(content.type).toBe("text");
    expect(JSON.parse(content.text)).toMatchObject({
      intent: "discover",
      query: "Greeter",
    });
    expect(JSON.parse(content.text).symbolMatches).toHaveLength(1);
    expect(JSON.parse(content.text).symbolMatches[0]).toMatchObject({
      name: "Greeter",
      kind: "class",
      filePath: "src/strings.ts",
      summarySource: "signature",
    });
    expect(JSON.parse(content.text).textMatches.length).toBeGreaterThan(0);

    const filteredSearchResponse = await server.handleMessage({
      jsonrpc: "2.0",
      id: 31,
      method: "tools/call",
      params: {
        name: "query_code",
        arguments: {
          repoRoot,
          intent: "discover",
          query: "Greeter",
          language: "ts",
          filePattern: "src/*.ts",
          limit: 5,
        },
      },
    });

    const filteredSearchContent = (
      filteredSearchResponse.result as {
        content: Array<{ type: string; text: string }>;
      }
    ).content[0];
    const filteredDiscover = JSON.parse(filteredSearchContent.text);
    expect(filteredDiscover.symbolMatches.every((entry: { filePath: string }) =>
      entry.filePath.endsWith(".ts"),
    )).toBe(true);
    const greeterToolId = JSON.parse(content.text).symbolMatches[0].id as string;

    const greetResponse = await server.handleMessage({
      jsonrpc: "2.0",
      id: 30,
      method: "tools/call",
      params: {
        name: "query_code",
        arguments: {
          repoRoot,
          intent: "discover",
          query: "greet",
          kind: "method",
          limit: 1,
        },
      },
    });

    const greetContent = (
      greetResponse.result as {
        content: Array<{ type: string; text: string }>;
      }
    ).content[0];
    const greetToolId = JSON.parse(greetContent.text).symbolMatches[0].id as string;

    const bundleResponse = await server.handleMessage({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "query_code",
        arguments: {
          repoRoot,
          intent: "assemble",
          query: "Greeter",
          tokenBudget: 120,
          includeRankedCandidates: true,
        },
      },
    });

    const bundleContent = (
      bundleResponse.result as {
        content: Array<{ type: string; text: string }>;
      }
    ).content[0];
    expect(bundleContent.type).toBe("text");
    expect(JSON.parse(bundleContent.text)).toMatchObject({
      intent: "assemble",
      bundle: {
        query: "Greeter",
        tokenBudget: 120,
      },
    });
    expect(JSON.parse(bundleContent.text).bundle.items[0]).toMatchObject({
      symbol: {
        name: "Greeter",
      },
    });
    expect(JSON.parse(bundleContent.text).ranked).toMatchObject({
      query: "Greeter",
      bundle: {
        tokenBudget: 120,
      },
    });
    expect(JSON.parse(bundleContent.text).ranked.candidates[0]).toMatchObject({
      symbol: {
        name: "Greeter",
      },
      selected: true,
    });

    const symbolSourceResponse = await server.handleMessage({
      jsonrpc: "2.0",
      id: 9,
      method: "tools/call",
      params: {
        name: "query_code",
        arguments: {
          repoRoot,
          intent: "source",
          symbolIds: [greeterToolId, greetToolId],
          contextLines: 1,
        },
      },
    });

    const symbolSourceContent = (
      symbolSourceResponse.result as {
        content: Array<{ type: string; text: string }>;
      }
    ).content[0];
    expect(symbolSourceContent.type).toBe("text");
    expect(JSON.parse(symbolSourceContent.text)).toMatchObject({
      intent: "source",
      symbolSource: {
        requestedContextLines: 1,
      },
    });
    expect(JSON.parse(symbolSourceContent.text).symbolSource.items).toHaveLength(2);

    const queryCodeResponse = await server.handleMessage({
      jsonrpc: "2.0",
      id: 10,
      method: "tools/call",
      params: {
        name: "query_code",
        arguments: {
          repoRoot,
          intent: "discover",
          query: "Greeter",
          includeTextMatches: true,
        },
      },
    });

    const queryCodeContent = (
      queryCodeResponse.result as {
        content: Array<{ type: string; text: string }>;
      }
    ).content[0];
    expect(queryCodeContent.type).toBe("text");
    expect(JSON.parse(queryCodeContent.text)).toMatchObject({
      intent: "discover",
      query: "Greeter",
    });
    expect(JSON.parse(queryCodeContent.text).symbolMatches[0]).toMatchObject({
      name: "Greeter",
    });

    const autoAssembleResponse = await server.handleMessage({
      jsonrpc: "2.0",
      id: 11,
      method: "tools/call",
      params: {
        name: "query_code",
        arguments: {
          repoRoot,
          query: "Greeter",
          tokenBudget: 120,
        },
      },
    });

    const autoAssembleContent = (
      autoAssembleResponse.result as {
        content: Array<{ type: string; text: string }>;
      }
    ).content[0];
    expect(JSON.parse(autoAssembleContent.text)).toMatchObject({
      intent: "assemble",
      bundle: {
        tokenBudget: 120,
      },
    });

    const retiredToolResponse = await server.handleMessage({
      jsonrpc: "2.0",
      id: 12,
      method: "tools/call",
      params: {
        name: "search_symbols",
        arguments: {
          repoRoot,
          query: "Greeter",
        },
      },
    });

    expect(retiredToolResponse.error?.message).toMatch(/unknown tool: search_symbols/i);
  }, 20_000);

  it("rejects unsupported summary strategies at runtime boundaries", async () => {
    const repoRoot = await createFixtureRepo();
    const server = createMcpServer();

    await expect(
      indexFolder({
        repoRoot,
        summaryStrategy: "bogus" as "signature-only",
      }),
    ).rejects.toThrow(/unsupported summaryStrategy/i);

    await expect(
      handleCli([
        "index-folder",
        "--repo",
        repoRoot,
        "--summary-strategy",
        "bogus",
      ]),
    ).rejects.toThrow(/unsupported --summary-strategy/i);

    const response = await server.handleMessage({
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "index_folder",
        arguments: {
          repoRoot,
          summaryStrategy: "bogus",
        },
      },
    });

    expect(response.error?.message).toMatch(/unsupported summaryStrategy/i);
  });

  it("rejects malformed CLI arguments instead of silently coercing them", async () => {
    const repoRoot = await createFixtureRepo();

    await expect(
      handleCli([
        "search-symbols",
        "--repo",
        repoRoot,
        "--query",
        "Greeter",
        "--kind",
        "bogus",
      ]),
    ).rejects.toThrow(/unsupported --kind/i);

    await expect(
      handleCli([
        "watch",
        "--repo",
        repoRoot,
        "--debounce-ms",
        "nope",
        "--timeout-ms",
        "50",
      ]),
    ).rejects.toThrow(/invalid numeric argument --debounce-ms/i);

    await expect(
      handleCli([
        "search-symbols",
        "--repo",
        repoRoot,
        "--query",
        "Greeter",
        "--limit",
      ]),
    ).rejects.toThrow(/missing value for argument --limit/i);

    await expect(
      handleCli([
        "search-symbols",
        "--repo",
        repoRoot,
        "--query",
        "Greeter",
        "--limit",
        "0",
      ]),
    ).rejects.toThrow(/limit must be positive/i);

    await expect(
      handleCli([
        "get-ranked-context",
        "--repo",
        repoRoot,
        "--query",
        "Greeter",
        "--budget",
        "0",
      ]),
    ).rejects.toThrow(/tokenBudget must be positive/i);

    await expect(
      handleCli([
        "get-symbol-source",
        "--repo",
        repoRoot,
        "--symbol",
        "fake-symbol",
        "--context-lines",
        "-1",
      ]),
    ).rejects.toThrow(/contextLines must be non-negative/i);

    await expect(
      handleCli([
        "query-code",
        "--repo",
        repoRoot,
        "--intent",
        "assemble",
        "--query",
        "   ",
        "--symbols",
        "   ",
      ]),
    ).rejects.toThrow(/query_code assemble intent requires a non-empty query or symbolIds/i);

    await expect(
      handleCli([
        "get-context-bundle",
        "--repo",
        repoRoot,
        "--query",
        "   ",
        "--symbols",
        "   ",
      ]),
    ).rejects.toThrow(/getContextBundle requires a non-empty query or symbolIds/i);
  });

  it("rejects malformed MCP arguments instead of treating them as empty filters", async () => {
    const repoRoot = await createFixtureRepo();
    const server = createMcpServer();

    const invalidKindResponse = await server.handleMessage({
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "query_code",
        arguments: {
          repoRoot,
          intent: "discover",
          query: "Greeter",
          kind: "bogus",
        },
      },
    });

    expect(invalidKindResponse.error?.message).toMatch(/invalid option|unsupported kind/i);

    const invalidBudgetResponse = await server.handleMessage({
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "query_code",
        arguments: {
          repoRoot,
          intent: "assemble",
          query: "Greeter",
          tokenBudget: "oops",
        },
      },
    });

    expect(invalidBudgetResponse.error?.message).toMatch(/expected number|invalid numeric argument/i);

    const invalidLimitResponse = await server.handleMessage({
      jsonrpc: "2.0",
      id: 8,
      method: "tools/call",
      params: {
        name: "query_code",
        arguments: {
          repoRoot,
          intent: "discover",
          query: "Greeter",
          limit: 0,
        },
      },
    });

    expect(invalidLimitResponse.error?.message).toMatch(/limit must be positive|must be positive/i);

    const invalidContextLinesResponse = await server.handleMessage({
      jsonrpc: "2.0",
      id: 9,
      method: "tools/call",
      params: {
        name: "query_code",
        arguments: {
          repoRoot,
          intent: "source",
          symbolId: "fake-symbol",
          contextLines: -1,
        },
      },
    });

    expect(invalidContextLinesResponse.error?.message).toMatch(
      /contextLines must be non-negative|must be non-negative/i,
    );

    const emptyBundleSeedResponse = await server.handleMessage({
      jsonrpc: "2.0",
      id: 10,
      method: "tools/call",
      params: {
        name: "query_code",
        arguments: {
          repoRoot,
          intent: "assemble",
          query: "   ",
          symbolIds: ["   "],
        },
      },
    });

    expect(emptyBundleSeedResponse.error?.message).toMatch(
      /query_code assemble intent requires a non-empty query or symbolIds/i,
    );

    const invalidQueryCodeResponse = await server.handleMessage({
      jsonrpc: "2.0",
      id: 11,
      method: "tools/call",
      params: {
        name: "query_code",
        arguments: {
          repoRoot,
        },
      },
    });

    expect(invalidQueryCodeResponse.error?.message).toMatch(
      /query_code auto intent resolved to discover and requires a non-empty query/i,
    );
  });

  it("exposes a workspace bin wrapper for cli commands", async () => {
    const repoRoot = await createFixtureRepo();
    const binPath = path.join(packageRoot, "scripts", "ai-context-engine.mjs");

    const { stdout } = await execFileAsync(process.execPath, [
      binPath,
      "cli",
      "diagnostics",
      "--repo",
      repoRoot,
    ]);

    expect(JSON.parse(stdout)).toMatchObject({
      storageMode: "wal",
      storageBackend: "sqlite",
    });
  }, 15_000);
});
