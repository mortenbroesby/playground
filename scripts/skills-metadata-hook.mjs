#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { findProjectRoot } from "workspace-tools";

const repoRoot = findProjectRoot(process.cwd(), "pnpm");
const metadataPath = path.join(
  repoRoot,
  ".skills",
  "registry.metadata.json",
);

function fail(message) {
  console.error(`Skill metadata hook failed: ${message}`);
  process.exit(1);
}

const changedFiles = spawnSync(
  "git",
  ["diff", "--cached", "--name-only", "--diff-filter=AM"],
  { cwd: repoRoot, encoding: "utf8" },
);

if (changedFiles.error) {
  throw changedFiles.error;
}

if (changedFiles.status !== 0) {
  process.exit(changedFiles.status ?? 1);
}

const skillFileChanges = [
  ...new Set(
    changedFiles.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(
        (filePath) =>
          filePath.startsWith(".skills/") &&
          filePath.endsWith("/SKILL.md"),
      ),
  ),
];

if (skillFileChanges.length === 0) {
  process.exit(0);
}

if (!fs.existsSync(metadataPath)) {
  fail(
    `.skills/registry.metadata.json is missing. Add it and include metadata for: ${skillFileChanges
      .map((filePath) => path.basename(path.dirname(filePath)))
      .join(", ")}`,
  );
}

let metadata;
try {
  metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
} catch (error) {
  fail(
    `.skills/registry.metadata.json is not valid JSON: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
}

if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
  fail("Invalid registry metadata shape: expected JSON object.");
}

if (metadata.version !== 1) {
  fail(`Invalid registry metadata version ${String(metadata.version)}: expected 1.`);
}

const skillEntries = metadata.skills;
if (!skillEntries || typeof skillEntries !== "object" || Array.isArray(skillEntries)) {
  fail("Invalid registry metadata shape: expected a `skills` object.");
}

const missingSkillIds = skillFileChanges
  .map((filePath) => path.basename(path.dirname(filePath)))
  .filter((skillId) => !Object.hasOwn(skillEntries, skillId));

if (missingSkillIds.length > 0) {
  fail(
    `Missing registry metadata entries in .skills/registry.metadata.json for: ${missingSkillIds.join(", ")}. Add entries before committing or update the file in the same commit and rerun git commit.`,
  );
}

process.exit(0);
