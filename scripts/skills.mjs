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
const distPath = path.join(
  repoRoot,
  "tools",
  "agent-skills",
  "dist",
  "cli.js",
);
const sourcePath = path.join(
  repoRoot,
  "tools",
  "agent-skills",
  "src",
  "cli.ts",
);
const runtimeFlags = ["--experimental-specifier-resolution=node"];
const sourceFlags = ["--experimental-strip-types", ...runtimeFlags];

const result = spawnSync(
  process.execPath,
  [
    ...(fs.existsSync(distPath)
      ? [...runtimeFlags, distPath]
      : [...sourceFlags, sourcePath]),
    ...process.argv.slice(2),
  ],
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
