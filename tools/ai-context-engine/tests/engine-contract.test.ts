import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  DEFAULT_SUMMARY_STRATEGY,
  ENGINE_TOOLS,
  loadRepoEngineConfig,
  createDefaultEngineConfig,
  resolveEnginePaths,
} from "../src/index.ts";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map(async (dir) => {
      await import("node:fs/promises").then((fs) =>
        fs.rm(dir, { recursive: true, force: true }),
      );
    }),
  );
});

describe("ai-context-engine contract", () => {
  it("uses repo-local storage artifacts aligned with the engine name", () => {
    const repoRoot = "/tmp/playground";

    expect(resolveEnginePaths(repoRoot)).toEqual({
      storageDir: "/tmp/playground/.ai-context-engine",
      databasePath: "/tmp/playground/.ai-context-engine/index.sqlite",
      repoMetaPath: "/tmp/playground/.ai-context-engine/repo-meta.json",
      integrityPath: "/tmp/playground/.ai-context-engine/integrity.sha256",
      rawCacheDir: "/tmp/playground/.ai-context-engine/raw-cache",
      eventsPath: "/tmp/playground/.ai-context-engine/events.jsonl",
    });
  });

  it("defaults to a spec-aligned engine config", () => {
    const config = createDefaultEngineConfig({
      repoRoot: "/tmp/playground",
    });

    expect(config).toMatchObject({
      repoRoot: "/tmp/playground",
      languages: ["ts", "tsx", "js", "jsx"],
      respectGitIgnore: true,
      storageMode: "wal",
      staleStatus: "unknown",
      summaryStrategy: DEFAULT_SUMMARY_STRATEGY,
    });

    expect(config.paths.databasePath).toContain(".ai-context-engine/index.sqlite");
  });

  it("advertises the required engine tools", () => {
    expect(ENGINE_TOOLS).toEqual([
      "init",
      "index_folder",
      "index_file",
      "get_repo_outline",
      "get_file_tree",
      "get_file_outline",
      "suggest_initial_queries",
      "query_code",
      "diagnostics",
    ]);
  });

  it("loads repo-root config defaults when present", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "ai-context-engine-config-"));
    tempDirs.push(repoRoot);

    await writeFile(
      path.join(repoRoot, "ai-context-engine.config.json"),
      JSON.stringify({
        summaryStrategy: "signature-only",
        observability: {
          enabled: true,
          port: 0,
          recentLimit: 17,
          snapshotIntervalMs: 250,
        },
      }),
    );

    const config = await loadRepoEngineConfig(repoRoot);

    expect(config.summaryStrategy).toBe("signature-only");
    expect(config.observability).toMatchObject({
      enabled: true,
      host: "127.0.0.1",
      port: 0,
      recentLimit: 17,
      snapshotIntervalMs: 250,
    });
    expect(config.configPath).toContain("ai-context-engine.config.json");
  });

  it("fails clearly for invalid repo-root config", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "ai-context-engine-config-"));
    tempDirs.push(repoRoot);

    await writeFile(
      path.join(repoRoot, "ai-context-engine.config.json"),
      JSON.stringify({
        observability: {
          recentLimit: 0,
        },
      }),
    );

    await expect(loadRepoEngineConfig(repoRoot)).rejects.toThrow(
      /Invalid ai-context-engine\.config\.json/i,
    );
  });
});
