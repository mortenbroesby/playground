import path from "node:path";
import { execFile, spawn } from "node:child_process";
import { once } from "node:events";
import { realpath, writeFile } from "node:fs/promises";
import net from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { decode } from "@msgpack/msgpack";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterEach, describe, expect, it } from "vitest";

import { handleCli } from "../src/cli.ts";
import { MCP_SERVER_NAME, MCP_TOOL_DEFINITIONS } from "../src/mcp-contract.ts";
import { dispatchTool } from "../src/mcp.ts";
import { ASTROGRAPH_PACKAGE_VERSION, indexFolder } from "../src/index.ts";
import { cleanupFixtureRepos, createFixtureRepo } from "./fixture-repo.ts";

const execFileAsync = promisify(execFile);
const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

async function waitFor(
  predicate: () => boolean,
  timeoutMs = 5_000,
): Promise<void> {
  const startedAt = Date.now();
  while (!predicate()) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(`Timed out after ${timeoutMs}ms`);
    }
    await delay(25);
  }
}

async function startObservabilityServer(
  repoRoot: string,
  extraArgs: string[] = [],
) {
  const child = spawn(
    process.execPath,
    [
      path.join(packageRoot, "scripts", "ai-context-engine.mjs"),
      "observability",
      "--repo",
      repoRoot,
      ...extraArgs,
    ],
    {
      cwd: packageRoot,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  const startup = await new Promise<{ host: string; port: number; repoRoot: string }>((resolve, reject) => {
    let stdout = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      const newlineIndex = stdout.indexOf("\n");
      if (newlineIndex === -1) {
        return;
      }

      try {
        resolve(JSON.parse(stdout.slice(0, newlineIndex)) as { host: string; port: number; repoRoot: string });
      } catch (error) {
        reject(error);
      }
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      reject(new Error(`observability server exited before startup: ${code ?? "unknown"}`));
    });
  });

  return {
    ...startup,
    stderr: () => stderr,
    async close() {
      child.kill("SIGTERM");
      await once(child, "exit").catch(() => undefined);
    },
  };
}

async function listenOnPort(host: string, port: number) {
  return await new Promise<net.Server>((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once("error", reject);
    server.listen(port, host, () => {
      server.removeListener("error", reject);
      resolve(server);
    });
  });
}

async function listenOnFirstAvailablePortInRange(
  host: string,
  start: number,
  end: number,
) {
  for (let port = start; port <= end; port += 1) {
    try {
      const server = await listenOnPort(host, port);
      return { server, port };
    } catch (error) {
      if (
        error instanceof Error
        && "code" in error
        && error.code === "EADDRINUSE"
      ) {
        continue;
      }
      throw error;
    }
  }

  throw new Error(`No available port found in ${start}-${end}`);
}

function asTextResultForTest(value: unknown) {
  return JSON.stringify(value, null, 2);
}

async function withMcpClient<T>(
  run: (context: {
    client: Client;
    stderr: () => string;
  }) => Promise<T>,
) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(packageRoot, "scripts", "ai-context-engine.mjs"), "mcp"],
    cwd: packageRoot,
    stderr: "pipe",
  });
  let stderr = "";
  const stderrStream = transport.stderr as
    | (NodeJS.ReadableStream & { setEncoding?: (encoding: BufferEncoding) => void })
    | null;
  stderrStream?.setEncoding?.("utf8");
  stderrStream?.on("data", (chunk) => {
    stderr += String(chunk);
  });

  const client = new Client({
    name: "vitest",
    version: "1.0.0",
  });

  try {
    await client.connect(transport);
    return await run({
      client,
      stderr: () => stderr,
    });
  } finally {
    await client.close();
  }
}

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
      storageDir: path.join(canonicalRepoRoot, ".astrograph"),
      databasePath: path.join(canonicalRepoRoot, ".astrograph", "index.sqlite"),
      storageVersion: 1,
      indexedFiles: 2,
      currentFiles: 2,
    });
  }, 15_000);

  it("exposes spec-aligned MCP tools", async () => {
    const repoRoot = await createFixtureRepo();
    await withMcpClient(async ({ client, stderr }) => {
      const toolsResult = await client.listTools();
      const indexResult = await client.callTool({
        name: "index_folder",
        arguments: {
          repoRoot,
          summaryStrategy: "signature-only",
        },
      });
      const discoverResult = await client.callTool({
        name: "query_code",
        arguments: {
          repoRoot,
          intent: "discover",
          query: "Greeter",
          kind: "class",
          includeTextMatches: true,
          limit: 1,
        },
      });
      const filteredSearchResult = await client.callTool({
        name: "query_code",
        arguments: {
          repoRoot,
          intent: "discover",
          query: "Greeter",
          language: "ts",
          filePattern: "src/*.ts",
          limit: 5,
        },
      });
      const greetResult = await client.callTool({
        name: "query_code",
        arguments: {
          repoRoot,
          intent: "discover",
          query: "greet",
          kind: "method",
          limit: 1,
        },
      });
      const bundleResult = await client.callTool({
        name: "query_code",
        arguments: {
          repoRoot,
          intent: "assemble",
          query: "Greeter",
          tokenBudget: 120,
          includeRankedCandidates: true,
        },
      });

      expect(stderr()).toBe("");
      expect(indexResult.isError).not.toBe(true);

      const tools = (toolsResult as {
        tools: Array<{ name: string }>;
      }).tools;

      expect(tools.map((tool) => tool.name)).toEqual(
        MCP_TOOL_DEFINITIONS.map((tool) => tool.name),
      );

      const content = (
        discoverResult as {
        content: Array<{ type: string; text: string }>;
        }).content[0];
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

      const filteredSearchContent = (
        filteredSearchResult as {
        content: Array<{ type: string; text: string }>;
        }).content[0];
      const filteredDiscover = JSON.parse(filteredSearchContent.text);
      expect(filteredDiscover.symbolMatches.every((entry: { filePath: string }) =>
        entry.filePath.endsWith(".ts"),
      )).toBe(true);
      const greeterToolId = JSON.parse(content.text).symbolMatches[0].id as string;

      const greetContent = (
        greetResult as {
        content: Array<{ type: string; text: string }>;
        }).content[0];
      const greetToolId = JSON.parse(greetContent.text).symbolMatches[0].id as string;

      const bundleContent = (
        bundleResult as {
        content: Array<{ type: string; text: string }>;
        }).content[0];
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

      const symbolSourceResponse = await dispatchTool("query_code", {
        repoRoot,
        intent: "source",
        symbolIds: [greeterToolId, greetToolId],
        contextLines: 1,
      });

      const symbolSourceContent = asTextResultForTest(symbolSourceResponse);
      expect(JSON.parse(symbolSourceContent)).toMatchObject({
        intent: "source",
        symbolSource: {
          requestedContextLines: 1,
        },
      });
      expect(JSON.parse(symbolSourceContent).symbolSource.items).toHaveLength(2);

      const queryCodeResponse = await dispatchTool("query_code", {
        repoRoot,
        intent: "discover",
        query: "Greeter",
        includeTextMatches: true,
      });

      const queryCodeContent = asTextResultForTest(queryCodeResponse);
      expect(JSON.parse(queryCodeContent)).toMatchObject({
        intent: "discover",
        query: "Greeter",
      });
      expect(JSON.parse(queryCodeContent).symbolMatches[0]).toMatchObject({
        name: "Greeter",
      });

      const autoAssembleResponse = await dispatchTool("query_code", {
        repoRoot,
        query: "Greeter",
        tokenBudget: 120,
      });

      const autoAssembleContent = asTextResultForTest(autoAssembleResponse);
      expect(JSON.parse(autoAssembleContent)).toMatchObject({
        intent: "assemble",
        bundle: {
          tokenBudget: 120,
        },
      });

      await expect(
        dispatchTool("search_symbols", {
          repoRoot,
          query: "Greeter",
        }),
      ).rejects.toThrow(/unknown tool: search_symbols/i);
    });
  }, 20_000);

  it("boots the SDK-backed MCP stdio server and handles initialize, tools/list, and tools/call", async () => {
    const repoRoot = await createFixtureRepo();
    const canonicalRepoRoot = await realpath(repoRoot);
    await withMcpClient(async ({ client, stderr }) => {
      expect(client.getServerVersion()).toMatchObject({
        name: MCP_SERVER_NAME,
        version: ASTROGRAPH_PACKAGE_VERSION,
      });

      const tools = await client.listTools();
      expect(tools.tools.map((tool) => tool.name)).toEqual(
        MCP_TOOL_DEFINITIONS.map((tool) => tool.name),
      );

      const diagnostics = await client.callTool({
        name: "diagnostics",
        arguments: {
          repoRoot,
        },
      });
      const diagnosticsContent = (
        diagnostics as {
          content: Array<{ type: string; text: string }>;
        }
      ).content[0];

      expect(stderr()).toBe("");
      expect(JSON.parse(diagnosticsContent.text)).toMatchObject({
        engineVersion: ASTROGRAPH_PACKAGE_VERSION,
        storageDir: path.join(canonicalRepoRoot, ".astrograph"),
        storageVersion: 1,
      });
    });
  }, 15000);

  it("serves Bun-backed live observability over health, recent, and websocket events", async () => {
    const repoRoot = await createFixtureRepo();
    const canonicalRepoRoot = await realpath(repoRoot);
    await writeFile(
      path.join(repoRoot, "astrograph.config.json"),
      JSON.stringify({
        observability: {
          port: 0,
          recentLimit: 20,
          snapshotIntervalMs: 100,
        },
      }),
    );
    const server = await startObservabilityServer(repoRoot);
    const messages: Array<Record<string, unknown>> = [];
    const socket = new WebSocket(`ws://${server.host}:${server.port}/events`);

    socket.addEventListener("message", (event) => {
      void (async () => {
        const payload = event.data instanceof Blob
          ? await event.data.text()
          : String(event.data);
        messages.push(JSON.parse(payload) as Record<string, unknown>);
      })();
    });

    try {
      await waitFor(() => messages.some((message) => message.type === "snapshot"));

      const viewerResponse = await fetch(`http://${server.host}:${server.port}/`);
      const viewerHtml = await viewerResponse.text();
      expect(viewerHtml).toContain("@astrograph observability");
      expect(viewerHtml).toContain("root");

      const healthResponse = await fetch(`http://${server.host}:${server.port}/health`);
      const health = await healthResponse.json() as { storageDir: string; watch: { status: string } };
      expect(health.storageDir).toContain(".astrograph");
      expect(health.watch.status).toBe("idle");

      const msgpackHealthResponse = await fetch(`http://${server.host}:${server.port}/health?format=msgpack`, {
        headers: {
          Accept: "application/msgpack",
        },
      });
      const msgpackHealth = decode(
        new Uint8Array(await msgpackHealthResponse.arrayBuffer()),
      ) as { storageDir: string };
      expect(msgpackHealth.storageDir).toContain(".astrograph");

      await handleCli(["index-folder", "--repo", repoRoot]);

      await withMcpClient(async ({ client }) => {
        await client.callTool({
          name: "query_code",
          arguments: {
            repoRoot,
            intent: "source",
            filePath: "src/math.ts",
          },
        });
      });

      await waitFor(() =>
        messages.some((message) =>
          message.type === "event"
            && (
              (message.event as { event?: string } | undefined)?.event === "index-worker.finished"
              || (message.event as { event?: string } | undefined)?.event === "mcp.tool.finished"
            )
        ),
      );

      const recentResponse = await fetch(`http://${server.host}:${server.port}/recent`);
      const recent = await recentResponse.json() as {
        repoRoot: string;
        events: Array<{
          event: string;
          source: string;
          data?: {
            summary?: string;
            tokenEstimate?: {
              savedTokens?: number;
            };
          };
        }>;
      };
      expect(recent.repoRoot).toBe(canonicalRepoRoot);
      expect(recent.events.some((event) =>
        event.event === "index-worker.finished" && event.source === "index-worker",
      )).toBe(true);
      const toolEvent = recent.events.find((event) =>
        event.event === "mcp.tool.finished" && event.source === "mcp",
      );
      expect(toolEvent?.data?.summary).toContain("Returned source");
      expect(toolEvent?.data?.tokenEstimate?.savedTokens).toBeGreaterThanOrEqual(0);
      expect(server.stderr()).toBe("");
    } finally {
      socket.close();
      await server.close();
    }
  }, 45_000);

  it("serves msgpack websocket events when requested", async () => {
    const repoRoot = await createFixtureRepo();
    await writeFile(
      path.join(repoRoot, "astrograph.config.json"),
      JSON.stringify({
        observability: {
          port: 0,
          recentLimit: 20,
          snapshotIntervalMs: 100,
        },
      }),
    );

    const server = await startObservabilityServer(repoRoot, ["--dev"]);
    const binaryMessages: Array<Record<string, unknown>> = [];
    const socket = new WebSocket(
      `ws://${server.host}:${server.port}/events?encoding=msgpack`,
    );
    socket.binaryType = "arraybuffer";

    socket.addEventListener("message", (event) => {
      if (typeof event.data === "string") {
        binaryMessages.push(JSON.parse(event.data) as Record<string, unknown>);
        return;
      }

      const message = decode(new Uint8Array(event.data as ArrayBuffer)) as Record<string, unknown>;
      binaryMessages.push(message);
    });

    try {
      await waitFor(() => binaryMessages.some((message) => message.type === "snapshot"), 15_000);
      await handleCli(["index-folder", "--repo", repoRoot]);
      await waitFor(() =>
        binaryMessages.some((message) =>
          message.type === "event"
            && (message.event as { event?: string } | undefined)?.event === "index-worker.finished"
        ),
      );
    } finally {
      socket.close();
      await server.close();
    }
  }, 45_000);

  it("falls back to another port in the 34323 range when the requested port is busy", async () => {
    const repoRoot = await createFixtureRepo();
    const blocked = await listenOnFirstAvailablePortInRange("127.0.0.1", 34323, 35322);

    await writeFile(
      path.join(repoRoot, "astrograph.config.json"),
      JSON.stringify({
        observability: {
          port: blocked.port,
          recentLimit: 10,
          snapshotIntervalMs: 100,
        },
      }),
    );

    const server = await startObservabilityServer(repoRoot);

    try {
      expect(server.port).not.toBe(blocked.port);
      expect(server.port).toBeGreaterThanOrEqual(34323);
      expect(server.port).toBeLessThanOrEqual(35322);

      const healthResponse = await fetch(`http://${server.host}:${server.port}/health`);
      expect(healthResponse.ok).toBe(true);
    } finally {
      await server.close();
      await new Promise<void>((resolve, reject) => {
        blocked.server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  }, 30_000);

  it("rejects unsupported summary strategies at runtime boundaries", async () => {
    const repoRoot = await createFixtureRepo();

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

    await expect(
      dispatchTool("index_folder", {
        repoRoot,
        summaryStrategy: "bogus",
      }),
    ).rejects.toThrow(/unsupported summaryStrategy/i);
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

    await expect(
      dispatchTool("query_code", {
        repoRoot,
        intent: "discover",
        query: "Greeter",
        kind: "bogus",
      }),
    ).rejects.toThrow(/invalid option|unsupported kind/i);

    await expect(
      dispatchTool("query_code", {
        repoRoot,
        intent: "assemble",
        query: "Greeter",
        tokenBudget: "oops",
      }),
    ).rejects.toThrow(/expected number|invalid numeric argument/i);

    await expect(
      dispatchTool("query_code", {
        repoRoot,
        intent: "discover",
        query: "Greeter",
        limit: 0,
      }),
    ).rejects.toThrow(/limit must be positive|must be positive/i);

    await expect(
      dispatchTool("query_code", {
        repoRoot,
        intent: "source",
        symbolId: "fake-symbol",
        contextLines: -1,
      }),
    ).rejects.toThrow(/contextLines must be non-negative|must be non-negative/i);

    await expect(
      dispatchTool("query_code", {
        repoRoot,
        intent: "assemble",
        query: "   ",
        symbolIds: ["   "],
      }),
    ).rejects.toThrow(/query_code assemble intent requires a non-empty query or symbolIds/i);

    await expect(
      dispatchTool("query_code", {
        repoRoot,
      }),
    ).rejects.toThrow(/query_code auto intent resolved to discover and requires a non-empty query/i);
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
