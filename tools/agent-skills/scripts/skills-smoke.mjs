#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const result = spawnSync("pnpm", [
  "--filter",
  "@playground/agent-skills",
  "run",
  "build",
], {
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  throw result.error;
}

if ((result.status ?? 1) !== 0) {
  process.exit(result.status ?? 1);
}

const testResult = spawnSync("node", [
  "--test",
  "dist/skills-smoke.test.js",
], {
  stdio: "inherit",
  env: process.env,
});

if (testResult.error) {
  throw testResult.error;
}

process.exit(testResult.status ?? 1);
