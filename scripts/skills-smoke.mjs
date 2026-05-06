#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const result = spawnSync("pnpm", [
  "--filter",
  "@playground/agent-skills",
  "run",
  "smoke",
], {
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);

