#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { findProjectRoot } from "workspace-tools";

const repoRoot = findProjectRoot(path.dirname(fileURLToPath(import.meta.url)), "pnpm");

const requiredPaths = [
  "AGENTS.md",
  "CLAUDE.md",
  ".agents/hooks",
  ".agents/commands",
  ".agents/rules",
  ".agents/references",
  ".skills",
  ".skills/engineering-workflow/SKILL.md",
  ".codex/rules/playground.rules",
  ".claude/settings.json",
  ".husky/post-commit",
  "codex/rules",
];

const forbiddenPaths = [
  ".agents/context",
  ".agents/skills",
  ".claude-plugin",
  "plugins",
  ".claude/skills",
  ".codex/skills",
  ".github/skills",
  ".opencode/skills",
];

const symlinks = new Map([
  [".claude/commands", "../.agents/commands"],
  [".claude/hooks", "../.agents/hooks"],
  [".claude/rules", "../.agents/rules"],
  [".codex/prompts", "../.agents/commands"],
  [".opencode/commands", "../.agents/commands"],
  ["codex/rules", "../.codex/rules"],
]);

const failures = [];

function fail(message) {
  failures.push(message);
}

function requireContent(filePath, snippet, description) {
  const absolutePath = path.join(repoRoot, filePath);
  const content = fs.readFileSync(absolutePath, "utf8");
  if (!content.includes(snippet)) {
    fail(`${filePath} missing ${description}`);
  }
}

function forbidContent(filePath, snippet, description) {
  const absolutePath = path.join(repoRoot, filePath);
  const content = fs.readFileSync(absolutePath, "utf8");
  if (content.includes(snippet)) {
    fail(`${filePath} still contains ${description}`);
  }
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

requireContent("AGENTS.md", "`pnpm skills:list`", "on-demand skills list command");
requireContent("AGENTS.md", "`pnpm skills:search <query>`", "on-demand skills search command");
requireContent("AGENTS.md", "`pnpm skills:read <skill-name>`", "on-demand skills read command");
forbidContent("AGENTS.md", "<skills_system>", "generated skills catalog block");
forbidContent("AGENTS.md", ".agents/context/active-context.md", "removed active context reference");

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
