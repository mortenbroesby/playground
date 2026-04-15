import { describe, expect, it } from "vitest";

import {
  ENGINE_PHASE_1_TOOLS,
  createDefaultEngineConfig,
  resolveEnginePaths,
} from "../src/index.ts";

describe("ai-context-engine phase 1 contract", () => {
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

  it("defaults to a spec-aligned phase 1 engine config", () => {
    const config = createDefaultEngineConfig({
      repoRoot: "/tmp/playground",
    });

    expect(config).toMatchObject({
      repoRoot: "/tmp/playground",
      languages: ["ts", "tsx", "js", "jsx"],
      respectGitIgnore: true,
      storageMode: "wal",
      staleStatus: "unknown",
    });

    expect(config.paths.databasePath).toContain(".ai-context-engine/index.sqlite");
  });

  it("advertises the required phase 1 tools before implementation expands", () => {
    expect(ENGINE_PHASE_1_TOOLS).toEqual([
      "init",
      "index_folder",
      "index_file",
      "get_repo_outline",
      "get_file_tree",
      "get_file_outline",
      "suggest_initial_queries",
      "search_symbols",
      "search_text",
      "get_context_bundle",
      "get_file_content",
      "get_symbol_source",
      "diagnostics",
    ]);
  });
});
