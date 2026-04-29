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
    "scripts/agent-setup-check.mjs",
    "scripts/skills.mjs",
    "scripts/skills-smoke.mjs",
    "scripts/prepush-checks.mjs",
    "package.json",
    "pnpm-lock.yaml",
    ".npmrc",
    ".nvmrc",
  ]),
);

const shouldRunSkillsSmoke = files.some((filePath) =>
  matches(filePath, [".skills", "scripts/skills.mjs", "scripts/skills-smoke.mjs"]),
);

const shouldRunAstrographTypeLint = files.some((filePath) =>
  matches(filePath, ["tools/ai-context-engine"]),
);

if (shouldRunMarkdown) {
  run("pnpm", ["lint:md"]);
}

if (shouldRunAgentsCheck) {
  run("pnpm", ["agents:check"]);
}

if (shouldRunSkillsSmoke) {
  run("node", ["scripts/skills-smoke.mjs"]);
}

if (shouldRunAstrographTypeLint) {
  run("pnpm", ["--filter", "@astrograph/astrograph", "type-lint"]);
}
