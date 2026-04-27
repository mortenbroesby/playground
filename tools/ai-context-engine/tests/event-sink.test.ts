import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { appendEngineEvent, readRecentEngineEvents } from "../src/index.ts";
import { resolveEnginePaths } from "../src/config.ts";
import { cleanupFixtureRepos, createFixtureRepo } from "./fixture-repo.ts";

afterEach(async () => {
  await cleanupFixtureRepos();
});

describe("event sink privacy", () => {
  it("redacts source-like event payload fields by default", async () => {
    const repoRoot = await createFixtureRepo();

    await appendEngineEvent({
      repoRoot,
      source: "mcp",
      event: "test.event",
      level: "info",
      data: {
        source: "export const token = 'sk-123456789012345678901234';",
        preview: "const answer = 42;",
        nested: {
          text: "return apiKey;",
          token: "ghp_123456789012345678901234567890123456",
        },
        note: "safe metadata",
      },
    });

    const [event] = await readRecentEngineEvents({ repoRoot, limit: 1 });
    expect(event?.data).toMatchObject({
      source: "[REDACTED:secret]",
      preview: "[REDACTED:source-text]",
      nested: {
        text: "[REDACTED:source-text]",
        token: "[REDACTED:secret]",
      },
      note: "safe metadata",
    });
  });

  it("allows local source-text opt-out while still scrubbing obvious secrets", async () => {
    const repoRoot = await createFixtureRepo();

    await writeFile(
      path.join(repoRoot, "astrograph.config.json"),
      JSON.stringify({
        observability: {
          redactSourceText: false,
        },
      }),
    );

    await appendEngineEvent({
      repoRoot,
      source: "mcp",
      event: "test.event",
      level: "info",
      data: {
        source: "export const answer = 42;",
        token: "sk-123456789012345678901234",
      },
    });

    const [event] = await readRecentEngineEvents({ repoRoot, limit: 1 });
    expect(event?.data).toMatchObject({
      source: "export const answer = 42;",
      token: "[REDACTED:secret]",
    });

    const paths = resolveEnginePaths(repoRoot);
    const rawLog = await readFile(paths.eventsPath, "utf8");
    expect(rawLog).not.toContain("sk-123456789012345678901234");
  });
});
