#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findProjectRoot } from "workspace-tools";

import { parseSkillMetadata } from "./lib/skills-metadata.mjs";
import {
  getRecentUsageScore,
  getUsageCachePath,
  loadUsageCache,
  recordSkillUsage,
  writeUsageCache,
} from "./lib/skills-usage-cache.mjs";
import {
  rankSearchMatches,
  rankSkillsForList,
  routeTaskFromRegistry,
} from "./skills.mjs";

const repoRoot = findProjectRoot(
  path.dirname(fileURLToPath(import.meta.url)),
  "pnpm",
);

const skillsScriptPath = path.join(repoRoot, "scripts", "skills.mjs");

function runNode(args) {
  return spawnSync("node", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function assertOk(result, context) {
  assert.equal(
    result.status,
    0,
    `${context}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
}

function assertFailed(result, context) {
  assert.notEqual(
    result.status,
    0,
    `${context}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
}

function assertThrowsWithMessage(fn, pattern, context) {
  assert.throws(fn, pattern, context);
}

function ensureDir(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function main() {
  // The smoke tests intentionally pin the parser edge cases that are most
  // likely to regress in this refactor: frontmatter identity parsing and
  // typoed contract keys that must fail loudly.
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
    "unsupported metadata keys should fail clearly",
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
    assert.equal(
      warmedCache.entries["engineering-workflow"].count,
      4,
      "usage cache should retain bounded hit counts for successful loads",
    );
    assert.equal(
      warmedCache.entries["engineering-workflow"].last_used_at,
      4_000,
      "usage cache should track the latest successful load timestamp",
    );

    const freshScore = getRecentUsageScore(
      warmedCache,
      "engineering-workflow",
      4_000,
    );
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

  const listResult = runNode([skillsScriptPath, "list"]);
  assertOk(listResult, "skills list should succeed");
  assert.match(
    listResult.stdout,
    /^engineering-workflow: .* \[daily-driver\] \[group: workflow\]( \[warm\])?$/m,
  );
  assert.doesNotMatch(
    listResult.stdout,
    /^frontend-design:/m,
    "default skills list should stay agent-first instead of dumping the full catalog",
  );

  const listAllResult = runNode([skillsScriptPath, "list", "--all"]);
  assertOk(listAllResult, "skills list --all should succeed");
  assert.match(listAllResult.stdout, /^frontend-design:/m);

  const workflowGroupResult = runNode([
    skillsScriptPath,
    "list",
    "--group",
    "workflow",
  ]);
  assertOk(workflowGroupResult, "skills list --group workflow should succeed");
  assert.match(workflowGroupResult.stdout, /^engineering-workflow:/m);
  assert.doesNotMatch(
    workflowGroupResult.stdout,
    /^documentation-and-adrs:/m,
    "workflow-only list should exclude support skills",
  );

  const searchResult = runNode([skillsScriptPath, "search", "workflow"]);
  assertOk(searchResult, "skills search should succeed");
  assert.match(
    searchResult.stdout,
    /^engineering-workflow: .* \[daily-driver\] \[group: workflow\]( \[warm\])? \[metadata: /m,
  );

  const claudeApiSearchResult = runNode([skillsScriptPath, "search", "claude api"]);
  assertOk(
    claudeApiSearchResult,
    "skills search should preserve catalog hints for imported skills with metadata matches",
  );
  assert.match(
    claudeApiSearchResult.stdout,
    /^claude-api: .* \[group: imported\]( \[warm\])? \[metadata: /m,
  );
  assert.doesNotMatch(
    claudeApiSearchResult.stdout,
    /\[group: undefined\]/,
    "skills search should not drop catalog metadata when rendering fallback-capable skills",
  );

  const contentFallbackSearchResult = runNode([
    skillsScriptPath,
    "search",
    ".finalMessage()",
  ]);
  assertOk(
    contentFallbackSearchResult,
    "skills search content fallback should succeed",
  );
  assert.match(
    contentFallbackSearchResult.stdout,
    /^claude-api: .* \[group: imported\] \[content fallback\]$/m,
  );

  const readResult = runNode([
    skillsScriptPath,
    "read",
    "engineering-workflow",
  ]);
  assertOk(readResult, "skills read should succeed");
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

    const passiveSearchResult = runNode([
      skillsScriptPath,
      "search",
      "workflow",
    ]);
    assertOk(passiveSearchResult, "passive search should still succeed");
    assert.equal(
      fs.existsSync(repoUsageCachePath),
      false,
      "search should not create the local usage cache",
    );

    const cacheCreatingReadResult = runNode([
      skillsScriptPath,
      "read",
      "engineering-workflow",
    ]);
    assertOk(
      cacheCreatingReadResult,
      "skills read should succeed while creating the local usage cache",
    );
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

  const routeResult = runNode([
    skillsScriptPath,
    "route",
    "refactor shared agent hook logic",
    "--json",
  ]);
  assertOk(routeResult, "skills route should succeed");
  const route = JSON.parse(routeResult.stdout);
  assert.equal(route.primarySkill, "engineering-workflow");
  assert.match(route.mode, /^(implement|plan|spec|review|debug|docs)$/);
  assert.ok(
    route.secondarySkills.includes("incremental-implementation"),
    "skills route should preserve the implementation-oriented secondary skill",
  );
  assert.match(
    route.rationale.join(" "),
    /daily-driver|benefit|evidence/i,
    "route rationale should explain policy and evidence contributions",
  );
  assert.ok(
    route.extraRules.includes("agent-infrastructure"),
    "skills route should surface the infrastructure rule for hook work",
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
      activation_mode: "default",
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
      activation_mode: "quiet-until-strong-match",
    },
    {
      id: "gh-stack",
      display_name: "gh-stack",
      description: "Manage stacked pull requests.",
      tags: ["pull requests", "stacked diffs"],
      triggers: ["gh stack", "stacked pr"],
      anti_triggers: [],
      routing_weight: 3,
      daily_driver: false,
      agent_benefit: 3,
      catalog_group: "imported",
      activation_mode: "explicit-only",
    },
  ];

  const syntheticRoute = routeTaskFromRegistry(
    syntheticSkills,
    "build an MCP server with a tool surface",
  );
  assert.equal(
    syntheticRoute.primarySkill,
    "mcp-builder",
    "strong specialist evidence should still outrank generic daily-driver skills",
  );

  const explicitOnlyRoute = routeTaskFromRegistry(
    syntheticSkills,
    "improve implementation workflow",
  );
  assert.notEqual(
    explicitOnlyRoute.primarySkill,
    "gh-stack",
    "explicit-only skills should not auto-promote without direct evidence",
  );

  const explicitOnlySearch = rankSearchMatches(syntheticSkills, "gh-stack");
  assert.equal(
    explicitOnlySearch[0]?.skill.id,
    "gh-stack",
    "explicitly named skills should remain discoverable despite quieter activation modes",
  );

  const policyList = rankSkillsForList(syntheticSkills);
  assert.deepEqual(
    policyList.map((entry) => entry.skill.id),
    ["engineering-workflow"],
    "default list view should stay focused on daily-driver agent-facing skills",
  );

  const registryWriteResult = runNode([skillsScriptPath, "registry"]);
  assertOk(registryWriteResult, "skills registry rebuild should succeed");
  assert.match(
    registryWriteResult.stdout,
    /Wrote \.skills\/registry\.generated\.json/,
  );

  const registryCheckResult = runNode([
    skillsScriptPath,
    "registry",
    "--check",
  ]);
  assertOk(registryCheckResult, "skills registry check should succeed");
  assert.match(
    registryCheckResult.stdout,
    /Skill registry is current: \.skills\/registry\.generated\.json/,
  );
  const generatedRegistry = JSON.parse(
    fs.readFileSync(
      path.join(repoRoot, ".skills", "registry.generated.json"),
      "utf8",
    ),
  );
  const byId = new Map(
    generatedRegistry.skills.map((skill) => [skill.id, skill]),
  );
  assert.deepEqual(
    {
      catalog_group: byId.get("source-driven-development")?.catalog_group,
      activation_mode: byId.get("source-driven-development")?.activation_mode,
      agent_benefit: byId.get("source-driven-development")?.agent_benefit,
      daily_driver: byId.get("source-driven-development")?.daily_driver,
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
      catalog_group: byId.get("claude-api")?.catalog_group,
      activation_mode: byId.get("claude-api")?.activation_mode,
      agent_benefit: byId.get("claude-api")?.agent_benefit,
      daily_driver: byId.get("claude-api")?.daily_driver,
    },
    {
      catalog_group: "imported",
      activation_mode: "quiet-until-strong-match",
      agent_benefit: 3,
      daily_driver: false,
    },
    "claude-api should stay quiet until strong evidence promotes the imported skill",
  );

  const installResult = runNode([
    skillsScriptPath,
    "install",
    "anthropics/skills",
  ]);
  assertFailed(installResult, "skills install should be unsupported");

  const syncResult = runNode([skillsScriptPath, "sync"]);
  assertFailed(syncResult, "skills sync should be unsupported");
}

main();
