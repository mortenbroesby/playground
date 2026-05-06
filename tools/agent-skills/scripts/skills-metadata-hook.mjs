#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { findProjectRoot } from "workspace-tools";

const repoRoot = findProjectRoot(
  path.dirname(fileURLToPath(import.meta.url)),
  "pnpm",
);
function getHookDistPath() {
  return path.join(
    repoRoot,
    "tools",
    "agent-skills",
    "dist",
    "hooks",
    "skills-metadata-hook.js",
  );
}

const distPath = getHookDistPath();

if (!fs.existsSync(distPath)) {
  const buildResult = spawnSync(
    "pnpm",
    ["--filter", "@playground/agent-skills", "run", "build"],
    {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: "inherit",
      env: process.env,
    },
  );

  if (buildResult.error) {
    throw buildResult.error;
  }

  if (typeof buildResult.status === "number" && buildResult.status !== 0) {
    process.exit(buildResult.status);
  }
}

const args = process.argv.slice(2);
const forwardedArgs = args[0] === "--" ? args.slice(1) : args;

const result = spawnSync(
  process.execPath,
  [distPath, ...forwardedArgs],
  {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "inherit",
    env: process.env,
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
