#!/usr/bin/env node
/// <reference types="node/test" />
import type { describe as nodeDescribe, it as nodeIt } from "node:test";

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { findProjectRoot } from "workspace-tools";

import { parseSkillMetadata } from "./lib/skills-metadata";
import { prepareSearchQuery } from "./lib/skills-text-search";
import {
  rankMiniSearchMatches,
} from "./lib/skills-minisearch";
import {
  rankSearchMatches,
  rankSkillsForList,
  type SkillGroup,
  type SkillTier,
  type RegistrySkill,
  routeTaskFromRegistry,
} from "./lib/skills-routing";

declare const describe: typeof nodeDescribe;
declare const it: typeof nodeIt;

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
const searchEvalFixturePath = path.join(
  repoRoot,
  "tools",
  "agent-skills",
  "src",
  "fixtures",
  "search-evals.json",
);

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

type SearchEvalFixture = {
  query: string;
  expected_top_1: string;
  expected_top_3: string[];
  forbidden: string[];
};

function loadSearchEvalFixtures(): SearchEvalFixture[] {
  return JSON.parse(fs.readFileSync(searchEvalFixturePath, "utf8")) as SearchEvalFixture[];
}

function assertSearchEngineMatchesEvalFixtures(
  engineName: string,
  runSearch: (query: string) => { skill: RegistrySkill }[],
  fixtures: SearchEvalFixture[],
) {
  for (const fixture of fixtures) {
    const matches = runSearch(fixture.query);
    assert.ok(matches.length > 0, `${engineName}: expected at least one match for "${fixture.query}"`);
    assert.equal(
      matches[0]?.skill.id,
      fixture.expected_top_1,
      `${engineName}: wrong top-1 result for "${fixture.query}"`,
    );

    const topThree = matches.slice(0, 3).map((entry) => entry.skill.id);
    for (const expectedSkillId of fixture.expected_top_3) {
      assert.ok(
        topThree.includes(expectedSkillId),
        `${engineName}: expected top-3 to include "${expectedSkillId}" for "${fixture.query}", got ${topThree.join(", ")}`,
      );
    }

    const matchedSkillIds = matches.map((entry) => entry.skill.id);
    for (const forbiddenSkillId of fixture.forbidden) {
      assert.ok(
        !matchedSkillIds.includes(forbiddenSkillId),
        `${engineName}: forbidden skill "${forbiddenSkillId}" matched "${fixture.query}"`,
      );
    }
  }
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

  const preparedCiQuery = prepareSearchQuery("ci");
  assert.ok(
    preparedCiQuery.expandedTokens.includes("continuous"),
    "CI shorthand should expand to continuous",
  );
  assert.ok(
    preparedCiQuery.expandedTokens.includes("integration"),
    "CI shorthand should expand to integration",
  );
  assert.ok(
    preparedCiQuery.expandedTokens.includes("pipeline"),
    "CI shorthand should expand to pipeline-oriented metadata",
  );

  const preparedPipelineQuery = prepareSearchQuery("pipeline");
  assert.ok(
    preparedPipelineQuery.expandedTokens.includes("ci"),
    "Pipeline queries should map back to CI shorthand",
  );

  const listResult = runSkillCommand(["list"]);
  assertOk(listResult);
  assert.match(
    listResult.stdout,
    /^engineering-workflow: .* \[group: workflow\] \[tier: daily\]$/m,
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
    /^engineering-workflow: .* \[group: workflow\] \[tier: daily\] \[metadata: /m,
  );
  assert.match(
    searchResult.stdout,
    /\[metadata: minisearch\]/,
    "default skills search should use MiniSearch unless an explicit engine override is passed",
  );

  const claudeApiSearchResult = runSkillCommand(["search", "claude api"]);
  assertOk(claudeApiSearchResult);
  assert.match(
    claudeApiSearchResult.stdout,
    /^claude-api: .* \[group: imported\] \[tier: quiet\] \[metadata: /m,
  );
  assert.doesNotMatch(
    claudeApiSearchResult.stdout,
    /\[group: undefined\]/,
    "skills search should not drop catalog metadata when rendering fallback-capable skills",
  );

  const contentFallbackSearchResult = runSkillCommand([
    "search",
    "--content",
    ".finalMessage()",
  ]);
  assertOk(contentFallbackSearchResult);
  assert.match(
    contentFallbackSearchResult.stdout,
    /^claude-api: .* \[group: imported\] \[tier: quiet\] \[content fallback\]$/m,
  );

  const metadataOnlyMissResult = runSkillCommand([
    "search",
    ".finalMessage()",
  ]);
  assertFailed(metadataOnlyMissResult);

  const readResult = runSkillCommand(["read", "engineering-workflow"]);
  assertOk(readResult);
  assert.match(
    readResult.stdout,
    /^Base directory: \.skills\/engineering-workflow$/m,
  );
  assert.match(readResult.stdout, /# Engineering Workflow/i);

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
    /daily|tier|evidence/i,
    "route rationale should explain policy and evidence contributions",
  );
  assert.ok(
    route.extraRules.includes("agent-infrastructure"),
    "route should surface the infrastructure rule for hook work",
  );

  const syntheticSkills: RegistrySkill[] = [
    {
      id: "engineering-workflow",
      display_name: "engineering-workflow",
      description: "General implementation workflow.",
      tags: ["implementation", "workflow"],
      triggers: ["build", "implement"],
      anti_triggers: [],
      group: "workflow" as SkillGroup,
      tier: "daily" as SkillTier,
    },
    {
      id: "mcp-builder",
      display_name: "mcp-builder",
      description: "Build MCP servers and tool surfaces.",
      tags: ["mcp", "server", "tools"],
      triggers: ["mcp", "tool surface", "model context protocol"],
      anti_triggers: [],
      group: "specialist" as SkillGroup,
      tier: "quiet" as SkillTier,
    },
    {
      id: "gh-stack",
      display_name: "gh-stack",
      description: "Manage stacked pull requests.",
      tags: ["pull requests", "stacked pr"],
      triggers: ["gh stack", "stacked pr"],
      anti_triggers: [],
      group: "imported" as SkillGroup,
      tier: "explicit" as SkillTier,
    },
    {
      id: "ci-tooling",
      display_name: "ci-tooling",
      description: "Automate build validation and release workflows.",
      tags: ["build", "release", "pipeline"],
      triggers: ["continuous integration", "release validation"],
      anti_triggers: [],
      group: "specialist" as SkillGroup,
      tier: "normal" as SkillTier,
    },
  ];

  const syntheticRoute = routeTaskFromRegistry(
    syntheticSkills,
    "build an MCP server with a tool surface",
  );
  assert.equal(
    syntheticRoute.primarySkill,
    "mcp-builder",
    "strong specialist evidence should still outrank generic daily-tier skills",
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

  const explicitOnlySearch = rankSearchMatches(
    syntheticSkills,
    "gh-stack",
  );
  assert.equal(
    explicitOnlySearch[0]?.skill.id,
    "gh-stack",
    "explicitly named skills should remain discoverable despite quieter activation modes",
  );

  const bm25Search = rankSearchMatches(
    syntheticSkills,
    "build an mcp server with a tool surface",
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

  const miniSearchSynonymSearch = rankMiniSearchMatches(
    syntheticSkills,
    "ci",
  );
  assert.equal(
    miniSearchSynonymSearch[0]?.skill.id,
    "ci-tooling",
    "MiniSearch should use the shared query synonym expansion for short aliases like ci",
  );
  assert.ok(
    miniSearchSynonymSearch[0]?.reasons.includes("synonym"),
    "MiniSearch results should expose synonym expansion when shared query mapping was applied",
  );

  const policyList = rankSkillsForList(syntheticSkills, {});
  assert.deepEqual(
    policyList.map((entry) => entry.skill.id),
    ["engineering-workflow"],
    "default list view should stay focused on daily-tier agent-facing skills",
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
  const searchEvalFixtures = loadSearchEvalFixtures();
  const generatedRegistrySkills = generatedRegistry.skills as RegistrySkill[];
  assertSearchEngineMatchesEvalFixtures(
    "minisearch",
    (query) => rankMiniSearchMatches(generatedRegistrySkills, query),
    searchEvalFixtures,
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
      group: sourceDrivenDevelopment.group,
      tier: sourceDrivenDevelopment.tier,
    },
    {
      group: "support",
      tier: "normal",
    },
    "source-driven-development should be classified as a normal support skill",
  );
  assert.deepEqual(
    {
      group: claudeApi.group,
      tier: claudeApi.tier,
    },
    {
      group: "imported",
      tier: "quiet",
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
