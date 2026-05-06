#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { findProjectRoot } from "workspace-tools";

const repoRoot = findProjectRoot(process.cwd(), "pnpm");
const metadataPath = path.join(
  repoRoot,
  ".skills",
  ".metadata",
  "registry.metadata.json",
);
const metadataRelativePath = path.relative(repoRoot, metadataPath);

function parseJsonArray(input: string): string[] {
  // Shared parsing/validation helper for env and explicit file-list inputs.
  const parsed = JSON.parse(input);
  if (!Array.isArray(parsed)) {
    throw new Error("expected JSON array");
  }

  return parsed.map((value) => String(value).trim()).filter(Boolean);
}

interface HookOptions {
  mode: "staged" | "range" | "explicit" | "auto-range";
  files: string | null;
  range: string | null;
  from: string | null;
  to: string | null;
}

function parseArguments(): HookOptions {
  // Supports hook call sites for pre-commit (staged), pre-push (range), and
  // targeted invocations where test tooling passes a synthetic file list.
  const args = process.argv.slice(2);
  const options: HookOptions = {
    mode: "staged",
    files: null,
    range: null,
    from: null,
    to: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === undefined) {
      continue;
    }

    if (arg === "--help") {
      console.log(`Usage:
  node scripts/skills-metadata-hook.mjs
  node scripts/skills-metadata-hook.mjs --range <rev1..rev2>
  node scripts/skills-metadata-hook.mjs --from <rev> --to <rev>
  node scripts/skills-metadata-hook.mjs --auto-range
  node scripts/skills-metadata-hook.mjs --files <json-array>`);
      process.exit(0);
    }

    if (arg.startsWith("--range=")) {
      options.mode = "range";
      options.range = arg.slice("--range=".length);
      continue;
    }

    if (arg === "--range") {
      if (index + 1 >= args.length) {
        fail("--range requires an argument.");
      }

      const next = args[index + 1];
      if (next === undefined) {
        fail("--range requires an argument.");
      }

      options.mode = "range";
      options.range = next;
      index += 1;
      continue;
    }

    if (arg === "--from") {
      if (index + 1 >= args.length) {
        fail("--from requires an argument.");
      }

      const next = args[index + 1];
      if (next === undefined) {
        fail("--from requires an argument.");
      }

      options.mode = "range";
      options.from = next;
      index += 1;
      continue;
    }

    if (arg === "--to") {
      if (index + 1 >= args.length) {
        fail("--to requires an argument.");
      }

      const next = args[index + 1];
      if (next === undefined) {
        fail("--to requires an argument.");
      }

      options.mode = "range";
      options.to = next;
      index += 1;
      continue;
    }

    if (arg.startsWith("--files=")) {
      options.mode = "explicit";
      options.files = arg.slice("--files=".length);
      continue;
    }

    if (arg === "--files") {
      if (index + 1 >= args.length) {
        fail("--files requires an argument.");
      }

      const next = args[index + 1];
      if (next === undefined) {
        fail("--files requires an argument.");
      }

      options.mode = "explicit";
      options.files = next;
      index += 1;
      continue;
    }

    if (arg === "--auto-range") {
      options.mode = "auto-range";
      continue;
    }

    fail(`Unknown argument: ${arg}`);
  }

  if (options.mode === "range" && options.from && options.to) {
    options.range = `${options.from}..${options.to}`;
  }

  return options;
}

function fail(message: string): never {
  console.error(`Skill metadata hook failed: ${message}`);
  process.exit(1);
}

interface SpawnResult {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
}

function runGitCommand(args: string[]): string[] | null {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
  }) as SpawnResult;

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    return null;
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function getUpstreamBranch(): string | null {
  const upstream = runGitCommand([
    "rev-parse",
    "--abbrev-ref",
    "--symbolic-full-name",
    "@{u}",
  ]);
  if (!upstream || upstream.length === 0) {
    return null;
  }

  return upstream[0] ?? null;
}

function getCurrentBranch(): string | null {
  const branch = runGitCommand(["rev-parse", "--abbrev-ref", "HEAD"]);
  if (!branch || branch.length === 0) {
    return null;
  }

  return branch[0] ?? null;
}

function getChangedSkillFilesFromArguments(options: HookOptions): string[] {
  const envFiles = process.env.SKILL_METADATA_GUARD_FILES;
  if (envFiles) {
    try {
      return parseJsonArray(envFiles);
    } catch (error) {
      fail(`SKILL_METADATA_GUARD_FILES must be a JSON array: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (options.mode === "explicit") {
    if (!options.files) {
      return [];
    }

    try {
      return parseJsonArray(options.files);
    } catch (error) {
      fail(`--files must be a JSON array: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (options.mode === "range") {
    if (!options.range) {
      fail("range mode requires --range or both --from and --to.");
    }

    return runGitCommand(["diff", "--name-only", "--diff-filter=AM", options.range]) ?? [];
  }

  if (options.mode === "auto-range") {
    const upstream = getUpstreamBranch();
    if (!upstream) {
      const branch = getCurrentBranch();
      if (!branch || branch === "HEAD") {
        return [];
      }

      return runGitCommand([
        "diff",
        "--name-only",
        "--diff-filter=AM",
        `origin/${branch}..HEAD`,
      ]) ?? [];
    }

    return (
      runGitCommand(["diff", "--name-only", "--diff-filter=AM", `${upstream}..HEAD`]) ??
      []
    );
  }

  return (
    runGitCommand(["diff", "--cached", "--name-only", "--diff-filter=AM"]) ?? []
  );
}

interface MetadataShape {
  version?: number;
  skills?: Record<string, unknown>;
}

const options = parseArguments();
const changedFiles = getChangedSkillFilesFromArguments(options);
const skillFileChanges = [...new Set(
  changedFiles.filter(
    (filePath) =>
      filePath.startsWith(".skills/") && filePath.endsWith("/SKILL.md"),
  ),
)];

if (skillFileChanges.length === 0) {
  process.exit(0);
}

if (!fs.existsSync(metadataPath)) {
  fail(
    `${metadataRelativePath} is missing. Add it and include metadata for: ${skillFileChanges
      .map((filePath) => path.basename(path.dirname(filePath)))
      .join(", ")}`,
  );
}

let metadata: MetadataShape;
try {
  metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8")) as MetadataShape;
} catch (error) {
  fail(
    `${metadataRelativePath} is not valid JSON: ${
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
  .filter((skillId) => !Object.hasOwn(skillEntries as Record<string, unknown>, skillId));

if (missingSkillIds.length > 0) {
  fail(
    `Missing registry metadata entries in ${metadataRelativePath} for: ${missingSkillIds.join(", ")}. Add entries before committing or update the file in the same commit and rerun git commit.`,
  );
}

process.exit(0);
