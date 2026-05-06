#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findProjectRoot } from "workspace-tools";

import { parseSkillMetadata } from "./lib/skills-metadata.mjs";

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

function main() {
  // The smoke tests intentionally pin the parser edge cases that are most
  // likely to regress in this refactor: quoted commas inside inline arrays and
  // typoed contract keys that must fail loudly.
  const inlineArrayMetadata = parseSkillMetadata({
    filePath: "inline-array-fixture/SKILL.md",
    content: `---
name: inline-array-fixture
description: Inline array fixture
triggers: ["compare A, B options", "ship"]
---
`,
  });
  assert.deepEqual(
    inlineArrayMetadata.triggers,
    ["compare A, B options", "ship"],
    "quoted inline array entries should preserve commas inside values",
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

  const listResult = runNode([skillsScriptPath, "list"]);
  assertOk(listResult, "skills list should succeed");
  assert.match(
    listResult.stdout,
    /^engineering-workflow: Use for spec, plan, build, test, review, simplify, or ship workflows\./m,
  );

  const searchResult = runNode([skillsScriptPath, "search", "workflow"]);
  assertOk(searchResult, "skills search should succeed");
  assert.match(searchResult.stdout, /^engineering-workflow: .* \[metadata: /m);

  const contentFallbackSearchResult = runNode([
    skillsScriptPath,
    "search",
    "Cross-cutting support skills",
  ]);
  assertOk(
    contentFallbackSearchResult,
    "skills search content fallback should succeed",
  );
  assert.match(
    contentFallbackSearchResult.stdout,
    /^engineering-workflow: .* \[content fallback\]$/m,
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
  assert.ok(
    route.extraRules.includes("agent-infrastructure"),
    "skills route should surface the infrastructure rule for hook work",
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
