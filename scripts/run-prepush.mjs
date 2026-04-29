#!/usr/bin/env node

import { spawnSync } from "node:child_process";

function run(command, args, { allowFailure = false } = {}) {
  const result = spawnSync(command, args, {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  if (!allowFailure && typeof result.status === "number" && result.status !== 0) {
    if (result.stdout) {
      process.stdout.write(result.stdout);
    }
    if (result.stderr) {
      process.stderr.write(result.stderr);
    }
    process.exit(result.status);
  }

  return result;
}

function getChangedFiles() {
  const result = run("git", ["diff", "--name-only", "--diff-filter=ACMR", "main...HEAD"], {
    allowFailure: true,
  });

  if (result.status !== 0) {
    return [];
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function runFallback() {
  const changedFiles = getChangedFiles();
  const args = ["scripts/lint-prepush.mjs", ...changedFiles];
  const result = spawnSync("node", args, {
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  process.exit(result.status ?? 0);
}

const lintPrepush = run("pnpm", ["exec", "lint-prepush"], { allowFailure: true });

if (lintPrepush.status === 0) {
  if (lintPrepush.stdout) {
    process.stdout.write(lintPrepush.stdout);
  }
  if (lintPrepush.stderr) {
    process.stderr.write(lintPrepush.stderr);
  }
  process.exit(0);
}

const combinedOutput = `${lintPrepush.stdout ?? ""}\n${lintPrepush.stderr ?? ""}`;
if (combinedOutput.includes("Loading Configuration") || combinedOutput.includes("TypeError: Cannot read properties of undefined")) {
  process.stderr.write("lint-prepush failed internally; falling back to repo pre-push dispatcher.\n");
  runFallback();
}

if (lintPrepush.stdout) {
  process.stdout.write(lintPrepush.stdout);
}
if (lintPrepush.stderr) {
  process.stderr.write(lintPrepush.stderr);
}
process.exit(lintPrepush.status ?? 1);
