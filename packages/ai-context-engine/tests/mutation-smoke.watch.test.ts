import { rm } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { afterEach, describe, expect, it } from "vitest";

import { diagnostics, searchSymbols, watchFolder } from "../src/index.ts";
import { cleanupFixtureRepos, createFixtureRepo } from "./fixture-repo.ts";

afterEach(async () => {
  await cleanupFixtureRepos();
});

async function waitFor(
  predicate: () => boolean,
  timeoutMs = 4000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) {
      throw new Error("Timed out waiting for watch refresh");
    }
    await delay(20);
  }
}

describe("mutation smoke watch boundaries", () => {
  it("removes deleted files during watch refresh", async () => {
    const repoRoot = await createFixtureRepo();
    const reindexEvents: Array<{ changedPaths: string[]; indexedFiles?: number }> = [];

    const watcher = await watchFolder({
      repoRoot,
      debounceMs: 50,
      onEvent(event) {
        if (event.type === "reindex") {
          reindexEvents.push({
            changedPaths: event.changedPaths,
            indexedFiles: event.summary?.indexedFiles,
          });
        }
      },
    });

    try {
      await rm(path.join(repoRoot, "src", "math.ts"));
      await waitFor(() => reindexEvents.length >= 1);

      expect(await searchSymbols({ repoRoot, query: "PI" })).toHaveLength(0);
      expect(await diagnostics({ repoRoot })).toMatchObject({
        indexedFiles: 1,
        currentFiles: 1,
        staleStatus: "fresh",
      });
      expect(reindexEvents).toHaveLength(1);
      expect(reindexEvents[0]?.changedPaths).toContain("src/math.ts");
      expect(reindexEvents[0]?.indexedFiles).toBe(1);
    } finally {
      await watcher.close();
    }
  });
});
