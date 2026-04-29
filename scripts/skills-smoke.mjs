#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findProjectRoot } from "workspace-tools";

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

function main() {
  const listResult = runNode([skillsScriptPath, "list"]);
  assertOk(listResult, "skills list should succeed");
  assert.match(listResult.stdout, /^engineering-workflow$/m);

  const searchResult = runNode([skillsScriptPath, "search", "workflow"]);
  assertOk(searchResult, "skills search should succeed");
  assert.match(searchResult.stdout, /^engineering-workflow:/m);

  const readResult = runNode([skillsScriptPath, "read", "engineering-workflow"]);
  assertOk(readResult, "skills read should succeed");
  assert.match(readResult.stdout, /^Base directory: \.skills\/engineering-workflow$/m);
  assert.match(readResult.stdout, /# Engineering Workflow/i);

  const installResult = runNode([skillsScriptPath, "install", "anthropics/skills"]);
  assertFailed(installResult, "skills install should be unsupported");

  const syncResult = runNode([skillsScriptPath, "sync"]);
  assertFailed(syncResult, "skills sync should be unsupported");
}

main();
