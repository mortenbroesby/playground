import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  ASTROGRAPH_PACKAGE_VERSION,
  ASTROGRAPH_VERSION_PARTS,
  DEFAULT_SUMMARY_STRATEGY,
  ENGINE_STORAGE_VERSION,
  ENGINE_TOOLS,
  assessAstrographVersionBump,
  loadRepoEngineConfig,
  createDefaultEngineConfig,
  parseAstrographVersion,
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
      storageDir: "/tmp/playground/.astrograph",
      databasePath: "/tmp/playground/.astrograph/index.sqlite",
      repoMetaPath: "/tmp/playground/.astrograph/repo-meta.json",
      integrityPath: "/tmp/playground/.astrograph/integrity.sha256",
      storageVersionPath: "/tmp/playground/.astrograph/storage-version.json",
      rawCacheDir: "/tmp/playground/.astrograph/raw-cache",
      eventsPath: "/tmp/playground/.astrograph/events.jsonl",
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

    expect(config.paths.databasePath).toContain(".astrograph/index.sqlite");
    expect(ENGINE_STORAGE_VERSION).toBe(1);
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

  it("uses package.json as the canonical Astrograph version source", () => {
    expect(ASTROGRAPH_PACKAGE_VERSION).toBe("0.0.1-alpha.2");
    expect(parseAstrographVersion(ASTROGRAPH_PACKAGE_VERSION)).toEqual({
      major: 0,
      minor: 0,
      patch: 1,
      increment: 2,
    });
    expect(ASTROGRAPH_VERSION_PARTS).toEqual({
      major: 0,
      minor: 0,
      patch: 1,
      increment: 2,
    });
  });

  it("enforces Astrograph bump rules for increment and semver resets", () => {
    expect(
      assessAstrographVersionBump(
        { major: 0, minor: 0, patch: 1, increment: 0 },
        { major: 0, minor: 0, patch: 1, increment: 1 },
      ),
    ).toMatchObject({
      ok: true,
      kind: "increment",
    });

    expect(
      assessAstrographVersionBump(
        { major: 0, minor: 0, patch: 1, increment: 4 },
        { major: 0, minor: 0, patch: 2, increment: 0 },
      ),
    ).toMatchObject({
      ok: true,
      kind: "patch",
    });

    expect(
      assessAstrographVersionBump(
        { major: 0, minor: 0, patch: 1, increment: 4 },
        { major: 0, minor: 0, patch: 2, increment: 1 },
      ),
    ).toMatchObject({
      ok: false,
      kind: null,
    });
  });

  it("loads repo-root config defaults when present", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "ai-context-engine-config-"));
    tempDirs.push(repoRoot);

    await writeFile(
      path.join(repoRoot, "astrograph.config.json"),
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
    expect(config.configPath).toContain("astrograph.config.json");
  });

  it("fails clearly for invalid repo-root config", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "ai-context-engine-config-"));
    tempDirs.push(repoRoot);

    await writeFile(
      path.join(repoRoot, "astrograph.config.json"),
      JSON.stringify({
        observability: {
          recentLimit: 0,
        },
      }),
    );

    await expect(loadRepoEngineConfig(repoRoot)).rejects.toThrow(
      /Invalid astrograph\.config\.json/i,
    );
  });
});
