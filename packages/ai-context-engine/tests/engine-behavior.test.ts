import { writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  diagnostics,
  getFileContent,
  getFileOutline,
  getFileTree,
  getRepoOutline,
  getSymbolSource,
  indexFolder,
  indexFile,
  searchSymbols,
  searchText,
  suggestInitialQueries,
} from "../src/index.ts";
import { cleanupFixtureRepos, createFixtureRepo } from "./fixture-repo.ts";

afterEach(async () => {
  await cleanupFixtureRepos();
});

describe("ai-context-engine behavior", () => {
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
  });
});
