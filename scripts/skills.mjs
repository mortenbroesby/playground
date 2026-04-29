#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findProjectRoot } from "workspace-tools";

const repoRoot = findProjectRoot(
  path.dirname(fileURLToPath(import.meta.url)),
  "pnpm",
);
const skillsRoot = path.join(repoRoot, ".skills");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function usage() {
  console.log(`Usage:
  pnpm skills:list
  pnpm skills:search <query>
  pnpm skills:read <skill-name>[,<skill-name>...]

Notes:
  - Repo-owned skills live directly in \`.skills/\`.
  - Skill discovery is command-first and on-demand.
  - \`skills:install\` and \`skills:sync\` are intentionally unsupported in this repo architecture.`);
}

function ensureSkillsRoot() {
  if (!fs.existsSync(skillsRoot)) {
    fail("Missing .skills directory.");
  }
}

function extractDescription(contents) {
  const frontmatterMatch = contents.match(
    /^---\r?\n[\s\S]*?\r?\ndescription:\s*(.+)\r?\n[\s\S]*?\r?\n---/,
  );
  if (frontmatterMatch) {
    return frontmatterMatch[1].trim().replace(/^["']|["']$/g, "");
  }

  return contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(
      (line) =>
        line &&
        !line.startsWith("#") &&
        line !== "---" &&
        !/^[a-z_][a-z0-9_-]*:/i.test(line),
    )
    ?? "";
}

function collectSkills(rootDir) {
  const skills = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const currentDir = stack.pop();
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    if (entries.some((entry) => entry.isFile() && entry.name === "SKILL.md")) {
      const skillPath = path.join(currentDir, "SKILL.md");
      const skillName = path.basename(currentDir);
      const contents = fs.readFileSync(skillPath, "utf8");
      const description = extractDescription(contents);

      skills.push({
        name: skillName,
        dir: currentDir,
        skillPath,
        relativeDir: path.relative(repoRoot, currentDir),
        description,
        contents,
      });
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      if (entry.name === "node_modules" || entry.name === ".git") {
        continue;
      }

      stack.push(path.join(currentDir, entry.name));
    }
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

function getAllSkills() {
  ensureSkillsRoot();
  return collectSkills(skillsRoot);
}

function splitRequestedSkillNames(args) {
  return args
    .flatMap((arg) => arg.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function listSkills() {
  for (const skill of getAllSkills()) {
    console.log(skill.name);
  }
}

function searchSkills(query) {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    fail("`pnpm skills:search` requires a non-empty query.");
  }

  const matches = getAllSkills().filter((skill) => {
    const haystack = [
      skill.name,
      skill.relativeDir,
      skill.description,
      skill.contents.slice(0, 4000),
    ]
      .join("\n")
      .toLowerCase();

    return haystack.includes(needle);
  });

  if (matches.length === 0) {
    process.exit(1);
  }

  for (const skill of matches) {
    console.log(`${skill.name}: ${skill.description || skill.relativeDir}`);
  }
}

function readSkills(names) {
  const requestedNames = splitRequestedSkillNames(names);
  if (requestedNames.length === 0) {
    fail("`pnpm skills:read` requires at least one skill name.");
  }

  const allSkills = getAllSkills();
  const byName = new Map(allSkills.map((skill) => [skill.name, skill]));

  for (const skillName of requestedNames) {
    const skill = byName.get(skillName);
    if (!skill) {
      fail(`Unknown skill: ${skillName}`);
    }

    if (requestedNames.length > 1) {
      console.log(`=== ${skill.name} ===`);
    }
    console.log(`Base directory: ${skill.relativeDir}`);
    console.log("");
    process.stdout.write(skill.contents);
    if (!skill.contents.endsWith("\n")) {
      process.stdout.write("\n");
    }
    if (requestedNames.length > 1 && skillName !== requestedNames.at(-1)) {
      console.log("");
    }
  }
}

function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === "--help" || command === "-h") {
    usage();
    return;
  }

  switch (command) {
    case "list":
      listSkills();
      return;
    case "search":
      searchSkills(args.join(" "));
      return;
    case "read":
      readSkills(args);
      return;
    case "install":
      fail("`pnpm skills:install` is not supported in the root .skills architecture.");
    case "sync":
      fail("`pnpm skills:sync` is not supported. Keep AGENTS.md thin and load skills on demand.");
    default:
      fail(`Unknown skills command: ${command}`);
  }
}

main();
