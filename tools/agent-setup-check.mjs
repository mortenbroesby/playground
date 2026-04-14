#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);

const requiredPaths = [
  "AGENTS.md",
  "CLAUDE.md",
  ".agents/hooks",
  ".agents/commands",
  ".agents/rules",
  ".agents/skills",
  ".agents/references",
  ".agents/skills/engineering-workflow/SKILL.md",
  ".codex/rules/playground.rules",
  ".claude/settings.json",
  ".husky/post-commit",
  "codex/rules",
];

const forbiddenPaths = [
  ".claude-plugin",
  "plugins",
];

const symlinks = new Map([
  [".claude/commands", "../.agents/commands"],
  [".claude/hooks", "../.agents/hooks"],
  [".claude/rules", "../.agents/rules"],
  [".claude/skills", "../.agents/skills"],
  [".codex/prompts", "../.agents/commands"],
  [".codex/skills", "../.agents/skills"],
  [".github/skills", "../.agents/skills"],
  [".opencode/commands", "../.agents/commands"],
  [".opencode/skills", "../.agents/skills"],
  ["codex/rules", "../.codex/rules"],
]);

const failures = [];

function fail(message) {
  failures.push(message);
}

for (const relativePath of requiredPaths) {
  if (!fs.existsSync(path.join(repoRoot, relativePath))) {
    fail(`missing ${relativePath}`);
  }
}

for (const relativePath of forbiddenPaths) {
  if (fs.existsSync(path.join(repoRoot, relativePath))) {
    fail(`forbidden runtime-specific plugin path still exists: ${relativePath}`);
  }
}

for (const [relativePath, expectedTarget] of symlinks) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`missing symlink ${relativePath}`);
    continue;
  }

  const stat = fs.lstatSync(absolutePath);
  if (!stat.isSymbolicLink()) {
    fail(`${relativePath} is not a symlink`);
    continue;
  }

  const actualTarget = fs.readlinkSync(absolutePath);
  if (actualTarget !== expectedTarget) {
    fail(
      `${relativePath} points to ${actualTarget}, expected ${expectedTarget}`,
    );
  }
}

try {
  JSON.parse(
    fs.readFileSync(path.join(repoRoot, ".claude/settings.json"), "utf8"),
  );
} catch (error) {
  fail(`.claude/settings.json is invalid JSON: ${error.message}`);
}

const hooksDir = path.join(repoRoot, ".agents/hooks");
for (const entry of fs.readdirSync(hooksDir)) {
  if (!entry.endsWith(".mjs")) {
    continue;
  }

  const hookPath = path.join(hooksDir, entry);
  const result = spawnSync(process.execPath, ["--check", hookPath], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    fail(`${path.relative(repoRoot, hookPath)} failed node --check`);
  }
}

if (failures.length > 0) {
  console.error(`Agent setup check failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log("Agent setup check passed.");
