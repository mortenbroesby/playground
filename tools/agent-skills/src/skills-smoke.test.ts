#!/usr/bin/env node
import { describe, it } from "vitest";

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { findProjectRoot } from "workspace-tools";

import { parseSkillMetadata } from "./lib/skills-metadata.ts";
import {
  getRecentUsageScore,
  getUsageCachePath,
  loadUsageCache,
  recordSkillUsage,
  writeUsageCache,
} from "./lib/skills-usage-cache.ts";
import {
  rankSearchMatches,
  rankSkillsForList,
  type ActivationMode,
  type RegistrySkill,
  routeTaskFromRegistry,
} from "./lib/skills-routing.ts";

const repoRoot = findProjectRoot(
  path.dirname(fileURLToPath(import.meta.url)),
  "pnpm",
);
const cliScript = path.join(
  repoRoot,
  "tools",
  "agent-skills",
  "dist",
  "cli.js",
);
const hookScript = path.join(
  repoRoot,
  "tools",
  "agent-skills",
  "dist",
  "hooks",
  "skills-metadata-hook.js",
);
const skillsScriptNodeArgs = [cliScript];
const skillsHookNodeArgs = [hookScript];

function runNode(
  args: string[],
  options: { env?: Record<string, string> } = {},
) {
  return spawnSync("node", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      ...options.env,
    },
  });
}

function runSkillCommand(args: string[]) {
  return runNode([...skillsScriptNodeArgs, ...args]);
}

function runSkillMetadataHook(
  args: string[],
  env: Record<string, string> = {},
) {
  return runNode([...skillsHookNodeArgs, ...args], { env });
}

function assertOk(result: {
  status: number | null;
  stdout: string;
  stderr: string;
}) {
  assert.equal(
    result.status,
    0,
    `Command should succeed.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
}

function assertFailed(result: {
  status: number | null;
  stdout: string;
  stderr: string;
}) {
  assert.notEqual(
    result.status,
    0,
    `Command should fail.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
}

function assertThrowsWithMessage(
  callback: () => unknown,
  pattern: RegExp,
  message: string,
) {
  assert.throws(callback, pattern, message);
}

function ensureDir(directoryPath: string): void {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function assertAgentSkillsSmoke(): void {
  // The smoke tests intentionally pin parser edges and routing defaults likely
  // to regress during another migration.
  const frontmatterIdentity = parseSkillMetadata({
    filePath: "inline-array-fixture/SKILL.md",
    content: `---
name: inline-array-fixture
description: Inline array fixture
---
`,
  });
  assert.deepEqual(
    frontmatterIdentity,
    {
      name: "inline-array-fixture",
      description: "Inline array fixture",
    },
    "frontmatter parsing should keep minimal skill identity fields",
  );

  assertThrowsWithMessage(
    () =>
      parseSkillMetadata({
        filePath: "typo-fixture/SKILL.md",
        content: `---
name: typo-fixture
description: Typo fixture
trigger:
  - compare options
---
`,
      }),
    /unknown frontmatter field "trigger"/,
    "unsupported metadata keys should fail loudly",
  );

  assertThrowsWithMessage(
    () =>
      parseSkillMetadata({
        filePath: "indented-top-level-fixture/SKILL.md",
        content: `---
name: indented-top-level-fixture
description: Valid description
  invalid-indentation:
    - should-fail
---
`,
      }),
    /unexpected indented continuation line/,
    "frontmatter parser should reject indented continuation lines",
  );

  const tempRepoRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "skills-usage-cache-smoke-"),
  );
  ensureDir(path.join(tempRepoRoot, ".skills"));

  try {
    const emptyCache = loadUsageCache(tempRepoRoot);
    assert.deepEqual(
      emptyCache,
      {
        version: 1,
        entries: {},
      },
      "missing usage cache should load as an empty advisory structure",
    );

    recordSkillUsage(tempRepoRoot, "engineering-workflow", 1_000);
    recordSkillUsage(tempRepoRoot, "engineering-workflow", 2_000);
    recordSkillUsage(tempRepoRoot, "engineering-workflow", 3_000);
    recordSkillUsage(tempRepoRoot, "engineering-workflow", 4_000);

    const warmedCache = loadUsageCache(tempRepoRoot);
    const warmedWorkflowEntry = warmedCache.entries["engineering-workflow"];
    assert.ok(warmedWorkflowEntry);
    assert.equal(
      warmedWorkflowEntry.count,
      4,
      "usage cache should retain bounded hit counts for successful loads",
    );
    assert.equal(
      warmedWorkflowEntry.last_used_at,
      4_000,
      "usage cache should track the latest successful load timestamp",
    );

    const freshScore = getRecentUsageScore(warmedCache, "engineering-workflow", 4_000);
    const olderScore = getRecentUsageScore(
      warmedCache,
      "engineering-workflow",
      4_000 + 14 * 24 * 60 * 60 * 1_000,
    );
    assert.ok(
      freshScore > 0,
      "fresh successful loads should provide a small positive advisory score",
    );
    assert.ok(
      freshScore > olderScore,
      "usage recency should decay over time",
    );

    writeUsageCache(tempRepoRoot, {
      version: 1,
      entries: {
        "engineering-workflow": {
          count: 99,
          last_used_at: 4_000,
        },
      },
    });
    const saturatedScore = getRecentUsageScore(
      loadUsageCache(tempRepoRoot),
      "engineering-workflow",
      4_000,
    );
    assert.ok(
      saturatedScore <= 3,
      "repeated usage should saturate so recency stays advisory only",
    );
  } finally {
    fs.rmSync(tempRepoRoot, { recursive: true, force: true });
  }

  const listResult = runSkillCommand(["list"]);
  assertOk(listResult);
  assert.match(
    listResult.stdout,
    /^engineering-workflow: .* \[daily-driver\] \[group: workflow\]( \[warm\])?$/m,
  );
  assert.doesNotMatch(
    listResult.stdout,
    /^frontend-design:/m,
    "default skills list should stay agent-first instead of dumping the full catalog",
  );

  const listAllResult = runSkillCommand(["list", "--all"]);
  assertOk(listAllResult);
  assert.match(listAllResult.stdout, /^frontend-design:/m);

  const workflowGroupResult = runSkillCommand(["list", "--group", "workflow"]);
  assertOk(workflowGroupResult);
  assert.match(workflowGroupResult.stdout, /^engineering-workflow:/m);
  assert.doesNotMatch(
    workflowGroupResult.stdout,
    /^documentation-and-adrs:/m,
    "workflow-only list should exclude support skills",
  );

  const searchResult = runSkillCommand(["search", "workflow"]);
  assertOk(searchResult);
  assert.match(
    searchResult.stdout,
    /^engineering-workflow: .* \[daily-driver\] \[group: workflow\]( \[warm\])? \[metadata: /m,
  );

  const claudeApiSearchResult = runSkillCommand(["search", "claude api"]);
  assertOk(claudeApiSearchResult);
  assert.match(
    claudeApiSearchResult.stdout,
    /^claude-api: .* \[group: imported\]( \[warm\])? \[metadata: /m,
  );
  assert.doesNotMatch(
    claudeApiSearchResult.stdout,
    /\[group: undefined\]/,
    "skills search should not drop catalog metadata when rendering fallback-capable skills",
  );

  const contentFallbackSearchResult = runSkillCommand([
    "search",
    ".finalMessage()",
  ]);
  assertOk(contentFallbackSearchResult);
  assert.match(
    contentFallbackSearchResult.stdout,
    /^claude-api: .* \[group: imported\] \[content fallback\]$/m,
  );

  const readResult = runSkillCommand(["read", "engineering-workflow"]);
  assertOk(readResult);
  assert.match(
    readResult.stdout,
    /^Base directory: \.skills\/engineering-workflow$/m,
  );
  assert.match(readResult.stdout, /# Engineering Workflow/i);

  const repoUsageCachePath = getUsageCachePath(repoRoot);
  const existingRepoUsageCache = fs.existsSync(repoUsageCachePath)
    ? fs.readFileSync(repoUsageCachePath, "utf8")
    : null;
  try {
    fs.rmSync(repoUsageCachePath, { force: true });

    const passiveSearchResult = runSkillCommand(["search", "workflow"]);
    assertOk(passiveSearchResult);
    assert.equal(
      fs.existsSync(repoUsageCachePath),
      false,
      "search should not create the local usage cache",
    );

    const cacheCreatingReadResult = runSkillCommand(["read", "engineering-workflow"]);
    assertOk(cacheCreatingReadResult);
    const repoUsageCache = loadUsageCache(repoRoot);
    assert.ok(
      repoUsageCache.entries["engineering-workflow"],
      "successful skill loads should record advisory usage",
    );
    assert.ok(
      repoUsageCache.entries["engineering-workflow"].last_used_at > 0,
      "successful skill loads should record a timestamp",
    );
  } finally {
    if (existingRepoUsageCache === null) {
      fs.rmSync(repoUsageCachePath, { force: true });
    } else {
      fs.writeFileSync(repoUsageCachePath, existingRepoUsageCache);
    }
  }

  const routeResult = runSkillCommand([
    "route",
    "refactor shared agent hook logic",
    "--json",
  ]);
  assertOk(routeResult);
  const route = JSON.parse(routeResult.stdout);
  assert.equal(route.primarySkill, "engineering-workflow");
  assert.match(route.mode, /^(implement|plan|spec|review|debug|docs)$/);
  assert.ok(
    route.secondarySkills.includes("incremental-implementation"),
    "route secondary skills should preserve implementation-oriented default",
  );
  assert.match(
    route.rationale.join(" "),
    /daily-driver|benefit|evidence/i,
    "route rationale should explain policy and evidence contributions",
  );
  assert.ok(
    route.extraRules.includes("agent-infrastructure"),
    "route should surface the infrastructure rule for hook work",
  );

const syntheticSkills = [
    {
      id: "engineering-workflow",
      display_name: "engineering-workflow",
      description: "General implementation workflow.",
      tags: ["implementation", "workflow"],
      triggers: ["build", "implement"],
      anti_triggers: [],
      routing_weight: 5,
      daily_driver: true,
      agent_benefit: 5,
      catalog_group: "workflow",
      activation_mode: "default" as ActivationMode,
    },
    {
      id: "mcp-builder",
      display_name: "mcp-builder",
      description: "Build MCP servers and tool surfaces.",
      tags: ["mcp", "server", "tools"],
      triggers: ["mcp", "tool surface", "model context protocol"],
      anti_triggers: [],
      routing_weight: 4,
      daily_driver: false,
      agent_benefit: 3,
      catalog_group: "specialist",
      activation_mode: "quiet-until-strong-match" as ActivationMode,
    },
    {
      id: "gh-stack",
      display_name: "gh-stack",
      description: "Manage stacked pull requests.",
      tags: ["pull requests", "stacked pr"],
      triggers: ["gh stack", "stacked pr"],
      anti_triggers: [],
      routing_weight: 3,
      daily_driver: false,
      agent_benefit: 3,
      catalog_group: "imported",
      activation_mode: "explicit-only" as ActivationMode,
    },
    {
      id: "ci-tooling",
      display_name: "ci-tooling",
      description: "Automate build validation and release workflows.",
      tags: ["build", "release", "pipeline"],
      triggers: ["continuous integration", "release validation"],
      anti_triggers: [],
      routing_weight: 3,
      daily_driver: false,
      agent_benefit: 2,
      catalog_group: "specialist",
      activation_mode: "default" as ActivationMode,
    },
  ];

  const syntheticRoute = routeTaskFromRegistry(
    syntheticSkills,
    "build an MCP server with a tool surface",
    repoRoot,
  );
  assert.equal(
    syntheticRoute.primarySkill,
    "mcp-builder",
    "strong specialist evidence should still outrank generic daily-driver skills",
  );

  const explicitOnlyRoute = routeTaskFromRegistry(
    syntheticSkills,
    "improve implementation workflow",
    repoRoot,
  );
  assert.notEqual(
    explicitOnlyRoute.primarySkill,
    "gh-stack",
    "explicit-only skills should not auto-promote without direct evidence",
  );

  const explicitOnlySearch = rankSearchMatches(
    syntheticSkills,
    "gh-stack",
    repoRoot,
  );
  assert.equal(
    explicitOnlySearch[0]?.skill.id,
    "gh-stack",
    "explicitly named skills should remain discoverable despite quieter activation modes",
  );

  const bm25Search = rankSearchMatches(
    syntheticSkills,
    "build an mcp server with a tool surface",
    repoRoot,
  );
  assert.equal(
    bm25Search[0]?.skill.id,
    "mcp-builder",
    "BM25-anchored query matching should favor MCP-specialist over generic workflow for tool-building tasks",
  );
  assert.ok(
    bm25Search[0]?.reasons.includes("bm25"),
    "metadata ranking should expose BM25 as a contributing reason",
  );

  const bm25SynonymSearch = rankSearchMatches(
    syntheticSkills,
    "ci",
    repoRoot,
  );
  assert.equal(
    bm25SynonymSearch[0]?.skill.id,
    "ci-tooling",
    "BM25 synonym expansion should map short aliases like ci to broader matching terms",
  );
  assert.ok(
    bm25SynonymSearch[0]?.reasons.includes("bm25"),
    "CI alias matching should still be powered by BM25 evidence",
  );

  const policyList = rankSkillsForList(syntheticSkills, {}, repoRoot);
  assert.deepEqual(
    policyList.map((entry) => entry.skill.id),
    ["engineering-workflow"],
    "default list view should stay focused on daily-driver agent-facing skills",
  );

  const registryWriteResult = runSkillCommand(["registry"]);
  assertOk(registryWriteResult);
  assert.match(
    registryWriteResult.stdout,
    /Wrote \.skills\/\.metadata\/registry\.generated\.json/,
  );

  const registryCheckResult = runSkillCommand(["registry", "--check"]);
  assertOk(registryCheckResult);
  assert.match(
    registryCheckResult.stdout,
    /Skill registry is current: \.skills\/\.metadata\/registry\.generated\.json/,
  );

  const generatedRegistry = JSON.parse(
    fs.readFileSync(
      path.join(repoRoot, ".skills", ".metadata", "registry.generated.json"),
      "utf8",
    ),
  );
  const byId = new Map<string, Record<string, unknown>>(
    generatedRegistry.skills.map((skill: { id: string; [key: string]: unknown }) => [
      skill.id,
      skill,
    ]),
  );
  const sourceDrivenDevelopment = byId.get("source-driven-development");
  const claudeApi = byId.get("claude-api");
  assert.ok(sourceDrivenDevelopment);
  assert.ok(claudeApi);

  assert.deepEqual(
    {
      catalog_group: sourceDrivenDevelopment.catalog_group,
      activation_mode: sourceDrivenDevelopment.activation_mode,
      agent_benefit: sourceDrivenDevelopment.agent_benefit,
      daily_driver: sourceDrivenDevelopment.daily_driver,
    },
    {
      catalog_group: "support",
      activation_mode: "high-priority-when-relevant",
      agent_benefit: 4,
      daily_driver: false,
    },
    "source-driven-development should be classified as high-value support",
  );
  assert.deepEqual(
    {
      catalog_group: claudeApi.catalog_group,
      activation_mode: claudeApi.activation_mode,
      agent_benefit: claudeApi.agent_benefit,
      daily_driver: claudeApi.daily_driver,
    },
    {
      catalog_group: "imported",
      activation_mode: "quiet-until-strong-match",
      agent_benefit: 3,
      daily_driver: false,
    },
    "claude-api should stay quiet until strong evidence promotes the imported skill",
  );

  const metadataHookMissingEntryResult = runSkillMetadataHook(
    [
      "--files",
      JSON.stringify([
        ".skills/brainstorming/SKILL.md",
        ".skills/non-existent-id/SKILL.md",
      ]),
    ],
  );
  assertFailed(metadataHookMissingEntryResult);
  assert.match(metadataHookMissingEntryResult.stderr, /non-existent-id/);

  const metadataHookSuccessResult = runSkillMetadataHook(
    ["--files", JSON.stringify([".skills/brainstorming/SKILL.md"])],
  );
  assertOk(metadataHookSuccessResult);

  const installResult = runSkillCommand(["install", "anthropics/skills"]);
  assertFailed(installResult);

  const syncResult = runSkillCommand(["sync"]);
  assertFailed(syncResult);
}

describe("agent-skills smoke", () => {
  it("validates parser, routing, and CLI integration contract", () => {
    assertAgentSkillsSmoke();
  });
});
