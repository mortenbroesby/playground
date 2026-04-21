import { realpath, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { afterEach, describe, expect, it } from "vitest";

import {
  diagnostics,
  getContextBundle,
  getFileContent,
  getFileOutline,
  getFileTree,
  getRepoOutline,
  getRankedContext,
  getSymbolSource,
  indexFolder,
  indexFile,
  searchSymbols,
  searchText,
  suggestInitialQueries,
  watchFolder,
} from "../src/index.ts";
import { cleanupFixtureRepos, createFixtureRepo } from "./fixture-repo.ts";

afterEach(async () => {
  await cleanupFixtureRepos();
});

describe("ai-context-engine behavior", () => {
  async function waitFor(
    predicate: () => boolean,
    timeoutMs = 2000,
  ): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (!predicate()) {
      if (Date.now() > deadline) {
        throw new Error("Timed out waiting for condition");
      }
      await delay(20);
    }
  }

  it("indexes a folder and exposes discovery-first queries", async () => {
    const repoRoot = await createFixtureRepo();

    const summary = await indexFolder({ repoRoot });

    expect(summary).toMatchObject({
      indexedFiles: 2,
      indexedSymbols: 5,
      skippedFiles: 1,
      staleStatus: "fresh",
    });

    const repoOutline = await getRepoOutline({ repoRoot });
    expect(repoOutline.totalFiles).toBe(2);
    expect(repoOutline.languages.ts).toBe(2);
    expect(repoOutline.totalSymbols).toBe(5);

    const fileTree = await getFileTree({ repoRoot });
    expect(fileTree.map((file) => file.path)).toEqual([
      "src/math.ts",
      "src/strings.ts",
    ]);

    const fileOutline = await getFileOutline({
      repoRoot,
      filePath: "src/strings.ts",
    });
    expect(fileOutline.symbols.map((symbol) => symbol.name)).toEqual([
      "formatLabel",
      "Greeter",
      "greet",
    ]);

    const suggestions = await suggestInitialQueries({ repoRoot });
    expect(suggestions[0]).toContain("Greeter");
  });

  it("prefers leading doc comments for symbol summaries by default", async () => {
    const repoRoot = await createFixtureRepo();

    await indexFolder({ repoRoot });

    const mathOutline = await getFileOutline({
      repoRoot,
      filePath: "src/math.ts",
    });
    expect(mathOutline.symbols).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "area",
          summary: "Calculate the circle area label.",
          summarySource: "doc-comment",
        }),
      ]),
    );

    const stringsOutline = await getFileOutline({
      repoRoot,
      filePath: "src/strings.ts",
    });
    expect(stringsOutline.symbols).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "formatLabel",
          summary: "Format an area label for display.",
          summarySource: "doc-comment",
        }),
        expect.objectContaining({
          name: "Greeter",
          summary: "Friendly greeter for string output.",
          summarySource: "doc-comment",
        }),
        expect.objectContaining({
          name: "greet",
          summary: "Return a greeting for the provided name.",
          summarySource: "doc-comment",
        }),
      ]),
    );

    const health = await diagnostics({ repoRoot });
    expect(health).toMatchObject({
      summaryStrategy: "doc-comments-first",
      summarySources: {
        "doc-comment": 4,
        signature: 1,
      },
      watch: {
        status: "idle",
        lastEvent: null,
        reindexCount: 0,
      },
    });
  });

  it("can fall back to signature-derived summaries when configured", async () => {
    const repoRoot = await createFixtureRepo();

    await indexFolder({
      repoRoot,
      summaryStrategy: "signature-only",
    });

    const mathOutline = await getFileOutline({
      repoRoot,
      filePath: "src/math.ts",
    });
    expect(mathOutline.symbols).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "area",
          summary:
            "export function area(radius: number): string { const value = PI * radius * radius; return formatLabel(value); }",
          summarySource: "signature",
        }),
      ]),
    );

    const health = await diagnostics({ repoRoot });
    expect(health).toMatchObject({
      summaryStrategy: "signature-only",
      summarySources: {
        signature: 5,
      },
    });
  });

  it("respects .gitignore entries during indexing", async () => {
    const repoRoot = await createFixtureRepo({ includeIgnoredFile: true });

    const summary = await indexFolder({ repoRoot });
    const fileTree = await getFileTree({ repoRoot });

    expect(summary.indexedFiles).toBe(2);
    expect(fileTree.map((file) => file.path)).not.toContain("src/ignored.ts");
  });

  it("anchors indexing and diagnostics to the enclosing git worktree root", async () => {
    const repoRoot = await createFixtureRepo();
    const canonicalRepoRoot = await realpath(repoRoot);
    const nestedRepoRoot = path.join(repoRoot, "src");

    const summary = await indexFolder({ repoRoot: nestedRepoRoot });
    const repoOutline = await getRepoOutline({ repoRoot: nestedRepoRoot });
    const health = await diagnostics({ repoRoot: nestedRepoRoot });

    expect(summary).toMatchObject({
      indexedFiles: 2,
      indexedSymbols: 5,
      staleStatus: "fresh",
    });
    expect(repoOutline).toMatchObject({
      totalFiles: 2,
      totalSymbols: 5,
    });
    expect(health.storageDir).toBe(
      path.join(canonicalRepoRoot, ".ai-context-engine"),
    );
    expect(health.databasePath).toBe(
      path.join(canonicalRepoRoot, ".ai-context-engine", "index.sqlite"),
    );
  });

  it("supports symbol and text search plus exact retrieval", async () => {
    const repoRoot = await createFixtureRepo();

    await indexFolder({ repoRoot });

    const symbolMatches = await searchSymbols({
      repoRoot,
      query: "area",
    });

    expect(symbolMatches[0]).toMatchObject({
      name: "area",
      filePath: "src/math.ts",
      exported: true,
    });

    const symbolSource = await getSymbolSource({
      repoRoot,
      symbolId: symbolMatches[0].id,
      verify: true,
    });
    expect(symbolSource.source).toContain("export function area");
    expect(symbolSource.source).toContain("formatLabel(value)");

    const fileContent = await getFileContent({
      repoRoot,
      filePath: "src/math.ts",
    });
    expect(fileContent.content).toContain("export const PI");

    const textMatches = await searchText({
      repoRoot,
      query: "Hello",
    });
    expect(textMatches[0]).toMatchObject({
      filePath: "src/strings.ts",
    });
  });

  it("extracts symbols from a large file when single-pass tree-sitter parsing fails", async () => {
    const repoRoot = await createFixtureRepo();
    const largeModule = Array.from({ length: 900 }, (_, index) =>
      `export function helper${index}(value: number): number { return value + ${index}; }`,
    ).join("\n");

    await writeFile(path.join(repoRoot, "src", "large.ts"), `${largeModule}\n`);

    const summary = await indexFolder({ repoRoot });
    const fileTree = await getFileTree({ repoRoot });
    const largeOutline = await getFileOutline({
      repoRoot,
      filePath: "src/large.ts",
    });
    const largeContent = await getFileContent({
      repoRoot,
      filePath: "src/large.ts",
    });
    const textMatches = await searchText({
      repoRoot,
      query: "helper899",
      filePattern: "src/large.ts",
    });
    const symbolMatches = await searchSymbols({
      repoRoot,
      query: "helper899",
      filePattern: "src/large.ts",
    });

    expect(summary).toMatchObject({
      indexedFiles: 3,
      staleStatus: "fresh",
    });
    expect(fileTree).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "src/large.ts",
          symbolCount: 900,
        }),
      ]),
    );
    expect(largeOutline.filePath).toBe("src/large.ts");
    expect(largeOutline.symbols).toHaveLength(900);
    expect(largeOutline.symbols[0]).toMatchObject({
      name: "helper0",
    });
    expect(largeContent.content).toContain("helper899");
    expect(textMatches[0]).toMatchObject({
      filePath: "src/large.ts",
    });
    expect(symbolMatches[0]).toMatchObject({
      filePath: "src/large.ts",
      name: "helper899",
    });
  });

  it("indexes a declaration that spans chunk boundaries exactly once", async () => {
    const repoRoot = await createFixtureRepo();
    const filler = Array.from({ length: 220 }, (_, index) =>
      `export function filler${index}(value: number): number { return value + ${index}; }`,
    ).join("\n");
    const spanningFunction = [
      "export function boundaryHelper(value: number): string {",
      "  const parts = [",
      ...Array.from({ length: 180 }, (_, index) => `    "segment-${index}-${"x".repeat(48)}",`),
      "  ];",
      "  return parts.join(value.toString());",
      "}",
    ].join("\n");
    const suffix = Array.from({ length: 40 }, (_, index) =>
      `export const tail${index} = ${index};`,
    ).join("\n");

    await writeFile(
      path.join(repoRoot, "src", "boundary.ts"),
      `${filler}\n${spanningFunction}\n${suffix}\n`,
    );

    await indexFolder({ repoRoot });

    const fileOutline = await getFileOutline({
      repoRoot,
      filePath: "src/boundary.ts",
    });
    const boundarySymbols = fileOutline.symbols.filter(
      (symbol) => symbol.name === "boundaryHelper",
    );
    const symbolMatches = await searchSymbols({
      repoRoot,
      query: "boundaryHelper",
      filePattern: "src/boundary.ts",
    });

    expect(boundarySymbols).toHaveLength(1);
    expect(boundarySymbols[0]).toMatchObject({
      name: "boundaryHelper",
      kind: "function",
      filePath: "src/boundary.ts",
    });
    expect(
      symbolMatches.filter((symbol) => symbol.name === "boundaryHelper"),
    ).toHaveLength(1);
  });

  it("supports language and file pattern filters in search", async () => {
    const repoRoot = await createFixtureRepo();

    await writeFile(
      path.join(repoRoot, "src", "widget.jsx"),
      `export function GreeterWidget() {
  return <div>Hello widget</div>;
}
`,
    );

    await indexFolder({ repoRoot });

    const tsMatches = await searchSymbols({
      repoRoot,
      query: "Greeter",
      language: "ts",
      filePattern: "src/*.ts",
    });
    expect(tsMatches.every((entry) => entry.filePath.endsWith(".ts"))).toBe(true);
    expect(tsMatches.some((entry) => entry.name === "Greeter")).toBe(true);
    expect(tsMatches.some((entry) => entry.filePath.endsWith(".jsx"))).toBe(false);

    const jsxMatches = await searchSymbols({
      repoRoot,
      query: "Greeter",
      language: "jsx",
      filePattern: "src/*.jsx",
    });
    expect(jsxMatches).toHaveLength(1);
    expect(jsxMatches[0]).toMatchObject({
      name: "GreeterWidget",
      filePath: "src/widget.jsx",
    });

    const textMatches = await searchText({
      repoRoot,
      query: "Hello",
      filePattern: "src/*.jsx",
    });
    expect(textMatches).toHaveLength(1);
    expect(textMatches[0]).toMatchObject({
      filePath: "src/widget.jsx",
    });
  });

  it("supports batch symbol source retrieval with optional context lines", async () => {
    const repoRoot = await createFixtureRepo();

    await indexFolder({ repoRoot });

    const symbolMatches = await searchSymbols({
      repoRoot,
      query: "Greeter",
    });
    const greetMatches = await searchSymbols({
      repoRoot,
      query: "greet",
    });

    const symbolSource = await getSymbolSource({
      repoRoot,
      symbolIds: [symbolMatches[0].id, greetMatches[0].id],
      contextLines: 1,
      verify: true,
    });

    expect(symbolSource.requestedContextLines).toBe(1);
    expect(symbolSource.items).toHaveLength(2);
    expect(symbolSource.items[0]).toMatchObject({
      symbol: {
        name: "Greeter",
      },
      verified: true,
    });
    expect(symbolSource.items[0]?.source).toContain(
      "/** Friendly greeter for string output. */",
    );
    expect(symbolSource.items[1]).toMatchObject({
      symbol: {
        name: "greet",
      },
      verified: true,
    });
    expect(symbolSource.items[1]?.source).toContain(
      '// Return a greeting for the provided name.',
    );
  });

  it("assembles bounded context bundles from persisted indexed content", async () => {
    const repoRoot = await createFixtureRepo();

    await indexFolder({ repoRoot });

    const bundle = await getContextBundle({
      repoRoot,
      query: "area",
      tokenBudget: 120,
    });

    expect(bundle.items[0]).toMatchObject({
      role: "target",
      symbol: {
        name: "area",
        filePath: "src/math.ts",
      },
    });
    expect(bundle.items.some((item) => item.symbol.name === "formatLabel")).toBe(
      true,
    );
    expect(bundle.items[0].source).toContain("return formatLabel(value);");
    expect(bundle.truncated).toBe(false);

    await writeFile(
      path.join(repoRoot, "src", "math.ts"),
      `import { formatLabel } from "./strings.js";

export const PI = 3.14;

export function area(radius: number): string {
  return "changed";
}
`,
    );

    const persistedBundle = await getContextBundle({
      repoRoot,
      query: "area",
      tokenBudget: 120,
    });

    expect(persistedBundle.items[0].source).toContain(
      "return formatLabel(value);",
    );
    expect(persistedBundle.items[0].source).not.toContain("changed");
  });

  it("keeps context bundles inside the declared token budget", async () => {
    const repoRoot = await createFixtureRepo();

    await indexFolder({ repoRoot });

    const bundle = await getContextBundle({
      repoRoot,
      query: "area",
      tokenBudget: 10,
    });

    expect(bundle.usedTokens).toBeLessThanOrEqual(bundle.tokenBudget);
  });

  it("returns ranked query context with visible candidate selection", async () => {
    const repoRoot = await createFixtureRepo();

    await indexFolder({ repoRoot });

    const rankedContext = await getRankedContext({
      repoRoot,
      query: "Greeter",
      tokenBudget: 120,
    });

    expect(rankedContext).toMatchObject({
      query: "Greeter",
      candidateCount: expect.any(Number),
      selectedSeedIds: expect.any(Array),
      bundle: {
        tokenBudget: 120,
      },
    });
    expect(rankedContext.candidates[0]).toMatchObject({
      rank: 1,
      reason: 'matched query "Greeter"',
      symbol: {
        name: "Greeter",
        filePath: "src/strings.ts",
      },
      selected: true,
    });
    expect(rankedContext.selectedSeedIds).toContain(
      rankedContext.candidates[0]?.symbol.id,
    );
    expect(rankedContext.bundle.items[0]).toMatchObject({
      role: "target",
      symbol: {
        name: "Greeter",
      },
    });
  });

  it("resolves aliased named imports to the correct dependency symbol", async () => {
    const repoRoot = await createFixtureRepo();

    await writeFile(
      path.join(repoRoot, "src", "formatters.ts"),
      `export function firstFormatter(value: number): string {
  return value.toFixed(1);
}

export function bestFormatter(value: number): string {
  return value.toFixed(2);
}
`,
    );
    await writeFile(
      path.join(repoRoot, "src", "consumer.ts"),
      `import { bestFormatter as format } from "./formatters.js";

export function renderValue(value: number): string {
  return format(value);
}
`,
    );

    await indexFolder({ repoRoot });

    const bundle = await getContextBundle({
      repoRoot,
      query: "renderValue",
      tokenBudget: 200,
    });

    expect(bundle.items.some((item) => item.symbol.name === "bestFormatter")).toBe(
      true,
    );
    expect(bundle.items.some((item) => item.symbol.name === "firstFormatter")).toBe(
      false,
    );
  });

  it("can refresh a single file without a full rebuild", async () => {
    const repoRoot = await createFixtureRepo();

    await indexFolder({ repoRoot });

    await writeFile(
      path.join(repoRoot, "src", "math.ts"),
      `import { formatLabel } from "./strings.js";

export const PI = 3.14;

export function circumference(radius: number): string {
  return formatLabel(2 * PI * radius);
}
`,
    );

    const update = await indexFile({
      repoRoot,
      filePath: "src/math.ts",
    });

    expect(update).toMatchObject({
      indexedFiles: 1,
      indexedSymbols: 2,
      staleStatus: "fresh",
    });

    const symbolMatches = await searchSymbols({
      repoRoot,
      query: "circumference",
    });
    expect(symbolMatches[0]?.name).toBe("circumference");

    const health = await diagnostics({ repoRoot });
    expect(health.storageMode).toBe("wal");
    expect(health.staleStatus).toBe("fresh");
    expect(health).toMatchObject({
      freshnessMode: "metadata",
      freshnessScanned: false,
    });
  });

  it("supports debounced watch mode with changed-file fast refresh", async () => {
    const repoRoot = await createFixtureRepo();
    const reindexEvents: Array<{ changedPaths: string[]; summary?: { indexedFiles: number } }> = [];

    const watcher = await watchFolder({
      repoRoot,
      debounceMs: 50,
      onEvent(event) {
        if (event.type === "reindex") {
          reindexEvents.push({
            changedPaths: event.changedPaths,
            summary: event.summary
              ? {
                  indexedFiles: event.summary.indexedFiles,
                }
              : undefined,
          });
        }
      },
    });

    try {
      await writeFile(
        path.join(repoRoot, "src", "math.ts"),
        `import { formatLabel } from "./strings.js";

export const PI = 3.14;

export function circumference(radius: number): string {
  return formatLabel(2 * PI * radius);
}
`,
      );
      await writeFile(
        path.join(repoRoot, "src", "math.ts"),
        `import { formatLabel } from "./strings.js";

export const PI = 3.14;

export function circumference(radius: number): string {
  return formatLabel(2 * PI * radius + 1);
}
`,
      );

      await waitFor(() => reindexEvents.length >= 1, 4000);

      const symbolMatches = await searchSymbols({
        repoRoot,
        query: "circumference",
      });

      expect(symbolMatches[0]?.name).toBe("circumference");
      expect(reindexEvents).toHaveLength(1);
      expect(reindexEvents[0]?.changedPaths).toContain("src/math.ts");
      expect(reindexEvents[0]?.summary).toMatchObject({
        indexedFiles: 1,
      });

      const health = await diagnostics({ repoRoot });
      expect(health.watch).toMatchObject({
        status: "watching",
        debounceMs: 50,
        pollMs: 50,
        lastEvent: "reindex",
        lastChangedPaths: ["src/math.ts"],
        reindexCount: 1,
        lastError: null,
        lastSummary: {
          indexedFiles: 1,
          staleStatus: "fresh",
        },
      });
    } finally {
      await watcher.close();
    }

    const closedHealth = await diagnostics({ repoRoot });
    expect(closedHealth.watch).toMatchObject({
      status: "idle",
      lastEvent: "close",
    });
    expect(closedHealth.watch.reindexCount).toBeGreaterThanOrEqual(1);
  });

  it("removes deleted files during watch refresh without a full folder reindex", async () => {
    const repoRoot = await createFixtureRepo();
    const reindexEvents: Array<{ changedPaths: string[]; summary?: { indexedFiles: number } }> = [];

    const watcher = await watchFolder({
      repoRoot,
      debounceMs: 50,
      onEvent(event) {
        if (event.type === "reindex") {
          reindexEvents.push({
            changedPaths: event.changedPaths,
            summary: event.summary
              ? {
                  indexedFiles: event.summary.indexedFiles,
                }
              : undefined,
          });
        }
      },
    });

    try {
      await rm(path.join(repoRoot, "src", "math.ts"));

      await waitFor(() => reindexEvents.length >= 1, 4000);

      const symbolMatches = await searchSymbols({
        repoRoot,
        query: "PI",
      });
      const health = await diagnostics({ repoRoot });

      expect(symbolMatches).toHaveLength(0);
      expect(health).toMatchObject({
        indexedFiles: 1,
        currentFiles: 1,
        staleStatus: "fresh",
      });
      expect(reindexEvents).toHaveLength(1);
      expect(reindexEvents[0]?.changedPaths).toContain("src/math.ts");
      expect(reindexEvents[0]?.summary).toMatchObject({
        indexedFiles: 1,
      });
    } finally {
      await watcher.close();
    }
  });

  it("surfaces live freshness drift after the repository changes", async () => {
    const repoRoot = await createFixtureRepo();

    await indexFolder({ repoRoot });

    const initialHealth = await diagnostics({ repoRoot, scanFreshness: true });
    expect(initialHealth).toMatchObject({
      staleStatus: "fresh",
      freshnessMode: "scan",
      freshnessScanned: true,
      indexedFiles: 2,
      currentFiles: 2,
      missingFiles: 0,
      changedFiles: 0,
      extraFiles: 0,
    });
    expect(initialHealth.indexedAt).not.toBeNull();
    expect(initialHealth.indexAgeMs).not.toBeNull();
    expect(initialHealth.currentSnapshotHash).toBe(initialHealth.indexedSnapshotHash);

    await writeFile(
      path.join(repoRoot, "src", "math.ts"),
      `import { formatLabel } from "./strings.js";

export const PI = 3.14;

export function area(radius: number): string {
  return "changed";
}
`,
    );

    const staleHealth = await diagnostics({ repoRoot, scanFreshness: true });
    expect(staleHealth).toMatchObject({
      staleStatus: "stale",
      freshnessMode: "scan",
      freshnessScanned: true,
      indexedFiles: 2,
      currentFiles: 2,
      missingFiles: 0,
      changedFiles: 1,
      extraFiles: 0,
    });
    expect(staleHealth.currentSnapshotHash).not.toBe(
      staleHealth.indexedSnapshotHash,
    );
    expect(staleHealth.staleReasons).toContain("content drift");
  });

  it("rejects file paths that escape the repository root", async () => {
    const repoRoot = await createFixtureRepo();

    await indexFolder({ repoRoot });

    await expect(
      indexFile({
        repoRoot,
        filePath: "../outside.ts",
      }),
    ).rejects.toThrow(/escapes repository root/i);

    await expect(
      getFileContent({
        repoRoot,
        filePath: "../outside.ts",
      }),
    ).rejects.toThrow(/escapes repository root/i);

    await expect(
      getFileOutline({
        repoRoot,
        filePath: "../outside.ts",
      }),
    ).rejects.toThrow(/escapes repository root/i);
  });
});
