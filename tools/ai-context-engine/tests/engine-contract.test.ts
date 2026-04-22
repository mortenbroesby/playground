import { describe, expect, it } from "vitest";

import {
  DEFAULT_SUMMARY_STRATEGY,
  ENGINE_TOOLS,
  createDefaultEngineConfig,
  resolveEnginePaths,
} from "../src/index.ts";

describe("ai-context-engine contract", () => {
  it("uses repo-local storage artifacts aligned with the engine name", () => {
    const repoRoot = "/tmp/playground";

    expect(resolveEnginePaths(repoRoot)).toEqual({
      storageDir: "/tmp/playground/.ai-context-engine",
      databasePath: "/tmp/playground/.ai-context-engine/index.sqlite",
      repoMetaPath: "/tmp/playground/.ai-context-engine/repo-meta.json",
      integrityPath: "/tmp/playground/.ai-context-engine/integrity.sha256",
      rawCacheDir: "/tmp/playground/.ai-context-engine/raw-cache",
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
});
