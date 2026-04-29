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

if (changedFiles.length === 0) {
  process.exit(0);
}

const shouldRunMarkdown = changedFiles.some((filePath) => filePath.endsWith(".md"));

const shouldRunAgentsCheck = changedFiles.some((filePath) =>
  matches(filePath, [
    "AGENTS.md",
    "CLAUDE.md",
    ".agents",
    ".codex",
    ".husky",
    "scripts/agent-setup-check.mjs",
    "scripts/skills.mjs",
    "scripts/skills-smoke.mjs",
    "scripts/lint-prepush.mjs",
    "package.json",
    ".npmrc",
    ".nvmrc",
  ]),
);

const shouldRunSkillsSmoke = changedFiles.some((filePath) =>
  matches(filePath, [".skills", "scripts/skills.mjs", "scripts/skills-smoke.mjs"]),
);

const shouldRunAstrographTypeLint = changedFiles.some((filePath) =>
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
