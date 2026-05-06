#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const changedFiles = [...new Set(process.argv.slice(2).filter(Boolean))];

function matches(filePath, prefixes) {
  return prefixes.some((prefix) => filePath === prefix || filePath.startsWith(`${prefix}/`));
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }
}

function getChangedFiles() {
  if (changedFiles.length > 0) {
    return changedFiles;
  }

  const result = spawnSync("git", ["diff", "--name-only", "--diff-filter=ACMR", "main...HEAD"], {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    return [];
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

const files = getChangedFiles();

if (files.length === 0) {
  process.exit(0);
}

const shouldRunMarkdown = files.some((filePath) => filePath.endsWith(".md"));

const shouldRunAgentsCheck = files.some((filePath) =>
  matches(filePath, [
    "AGENTS.md",
    "CLAUDE.md",
    ".agents",
    ".codex",
    ".husky",
    "tools/agent-skills",
    "scripts/agent-setup-check.mjs",
    "tools/agent-skills/scripts/skills.mjs",
    "tools/agent-skills/scripts/skills-smoke.mjs",
    "tools/agent-skills/scripts/skills-metadata-hook.mjs",
    "scripts/prepush-checks.mjs",
    "package.json",
    "pnpm-lock.yaml",
    ".npmrc",
    ".nvmrc",
  ]),
);

// Keep the trigger surface aligned with the actual implementation boundaries.
// Keep the smoke trigger aligned with the current skills implementation surface
// in `tools/agent-skills`.
const shouldRunSkillsSmoke = files.some((filePath) =>
  matches(filePath, [
    ".skills",
    "tools/agent-skills",
    "tools/agent-skills/scripts/skills.mjs",
    "tools/agent-skills/scripts/skills-smoke.mjs",
    "tools/agent-skills/scripts/skills-metadata-hook.mjs",
    "tools/agent-skills/src",
  ]),
);

if (shouldRunMarkdown) {
  run("pnpm", ["lint:md"]);
}

if (shouldRunAgentsCheck) {
  run("pnpm", ["agents:check"]);
}

if (shouldRunSkillsSmoke) {
  run("pnpm", ["--filter", "@playground/agent-skills", "run", "skills:smoke"]);
}
