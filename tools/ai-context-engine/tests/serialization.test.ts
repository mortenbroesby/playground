import { afterEach, describe, expect, it } from "vitest";

import {
  diagnostics,
  getFileTree,
  getRepoOutline,
  indexFolder,
} from "../src/index.ts";
import { serializeToolResult } from "../src/serialization.ts";
import { cleanupFixtureRepos, createFixtureRepo } from "./fixture-repo.ts";

afterEach(async () => {
  await cleanupFixtureRepos();
});

describe("machine result serialization", () => {
  it("preserves optimized diagnostics, repo outline, and file tree payloads", async () => {
    const repoRoot = await createFixtureRepo();
    await indexFolder({ repoRoot });

    const diagnosticsResult = await diagnostics({ repoRoot });
    const repoOutline = await getRepoOutline({ repoRoot });
    const fileTree = await getFileTree({ repoRoot });

    expect(JSON.parse(serializeToolResult("diagnostics", diagnosticsResult))).toEqual(
      diagnosticsResult,
    );
    expect(JSON.parse(serializeToolResult("get_repo_outline", repoOutline))).toEqual(
      repoOutline,
    );
    expect(JSON.parse(serializeToolResult("get_file_tree", fileTree))).toEqual(fileTree);
  });

  it("falls back to native JSON for unsupported tool payloads", () => {
    const payload = {
      intent: "discover",
      symbolMatches: [{ id: "symbol-1" }],
    };

    expect(serializeToolResult("query_code", payload)).toBe(JSON.stringify(payload));
  });

  it("can still produce CLI-compatible pretty JSON when requested", async () => {
    const repoRoot = await createFixtureRepo();
    await indexFolder({ repoRoot });

    const diagnosticsResult = await diagnostics({ repoRoot });

    expect(serializeToolResult("diagnostics", diagnosticsResult, { pretty: true })).toBe(
      JSON.stringify(diagnosticsResult, null, 2),
    );
  });
});
