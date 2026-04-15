import { afterEach, describe, expect, it } from "vitest";

import { handleCli } from "../src/cli.ts";
import { createMcpServer } from "../src/mcp.ts";
import { cleanupFixtureRepos, createFixtureRepo } from "./fixture-repo.ts";

afterEach(async () => {
  await cleanupFixtureRepos();
});

describe("ai-context-engine interfaces", () => {
  it("serves JSON CLI commands over the library surface", async () => {
    const repoRoot = await createFixtureRepo();

    await handleCli(["index-folder", "--repo", repoRoot]);
    const stdout = await handleCli(["get-repo-outline", "--repo", repoRoot]);

    expect(JSON.parse(stdout)).toMatchObject({
      totalFiles: 2,
      totalSymbols: 5,
    });

    const diagnosticsStdout = await handleCli(["diagnostics", "--repo", repoRoot]);
    expect(JSON.parse(diagnosticsStdout)).toMatchObject({
      staleStatus: "fresh",
      indexedFiles: 2,
      currentFiles: 2,
    });
  });

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

    expect(tools.map((tool) => tool.name)).toContain(
      "get_symbol_source",
    );
    expect(tools.map((tool) => tool.name)).toContain("get_context_bundle");
    expect(tools.map((tool) => tool.name)).toContain("diagnostics");

    await server.handleMessage({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "index_folder",
        arguments: {
          repoRoot,
        },
      },
    });

    const response = await server.handleMessage({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "search_symbols",
        arguments: {
          repoRoot,
          query: "Greeter",
        },
      },
    });

    const content = (
      response.result as {
        content: Array<{ type: string; text: string }>;
      }
    ).content[0];
    expect(content.type).toBe("text");
    expect(JSON.parse(content.text)[0]).toMatchObject({
      name: "Greeter",
      filePath: "src/strings.ts",
    });

    const bundleResponse = await server.handleMessage({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "get_context_bundle",
        arguments: {
          repoRoot,
          query: "Greeter",
          tokenBudget: 120,
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
      query: "Greeter",
    });
    expect(JSON.parse(bundleContent.text).items[0]).toMatchObject({
      symbol: {
        name: "Greeter",
      },
    });
  });
});
