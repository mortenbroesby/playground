#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { findProjectRoot } from "workspace-tools";

const OPENSKILLS_VERSION = "1.5.0";
const EXPECTED_SKILLS_SYMLINK = "../.agents/skills";
const MANAGED_BLOCK_START = /<skills_system\b[^>]*>/;
const MANAGED_BLOCK_END = "</skills_system>";

const repoRoot = findProjectRoot(
  path.dirname(fileURLToPath(import.meta.url)),
  "pnpm",
);

const agentsPath = path.join(repoRoot, "AGENTS.md");
const claudeSkillsPath = path.join(repoRoot, ".claude", "skills");
const canonicalSkillsPath = path.join(repoRoot, ".agents", "skills");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function usage() {
  console.log(`Usage:
  pnpm skills:install <source> [-- <openskills install args>]
  pnpm skills:list [-- <openskills list args>]
  pnpm skills:read <skill-name> [-- <openskills read args>]
  pnpm skills:sync [-- <openskills sync args>]

Notes:
  - Project-local installs only. The repo keeps \`.agents/skills\` canonical via
    the enforced \`.claude/skills -> ../.agents/skills\` symlink.
  - \`skills:sync\` owns the root AGENTS.md merge and rejects custom output paths.
  - Wrapper pinned to openskills@${OPENSKILLS_VERSION}.`);
}

function assertCanonicalSkillsSymlink() {
  if (!fs.existsSync(claudeSkillsPath)) {
    fail(
      "Missing .claude/skills symlink. Run `pnpm agents:check` and restore the repo agent adapters.",
    );
  }

  const stat = fs.lstatSync(claudeSkillsPath);
  if (!stat.isSymbolicLink()) {
    fail(".claude/skills must remain a symlink to ../.agents/skills.");
  }

  const actualTarget = fs.readlinkSync(claudeSkillsPath);
  if (actualTarget !== EXPECTED_SKILLS_SYMLINK) {
    fail(
      `.claude/skills points to ${actualTarget}. Expected ${EXPECTED_SKILLS_SYMLINK}.`,
    );
  }
}

function resolveOpenSkillsInvocation() {
  const localBin = path.join(repoRoot, "node_modules", ".bin", "openskills");
  if (fs.existsSync(localBin)) {
    return { command: localBin, prefixArgs: [] };
  }

  return {
    command: "pnpm",
    prefixArgs: ["dlx", `openskills@${OPENSKILLS_VERSION}`],
  };
}

function runOpenSkills(args, { stdio = "inherit" } = {}) {
  const invocation = resolveOpenSkillsInvocation();
  const env = { ...process.env };

  if (
    invocation.command === "pnpm" &&
    invocation.prefixArgs[0] === "dlx" &&
    !env.XDG_CACHE_HOME
  ) {
    env.XDG_CACHE_HOME = path.join(os.tmpdir(), "playground-pnpm-cache");
  }

  const result = spawnSync(invocation.command, [...invocation.prefixArgs, ...args], {
    cwd: repoRoot,
    env,
    encoding: "utf8",
    stdio,
  });

  if (result.error) {
    fail(result.error.message);
  }

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }

  return result;
}

function assertFlagsNotPresent(args, disallowedFlags, errorMessage) {
  if (
    args.some((arg) =>
      [...disallowedFlags].some(
        (disallowedFlag) =>
          arg === disallowedFlag || arg.startsWith(`${disallowedFlag}=`),
      ),
    )
  ) {
    fail(errorMessage);
  }
}

function splitWrapperFlags(args) {
  const wrapperFlags = {
    allowFirstPartyReplace: false,
  };
  const forwardedArgs = [];

  for (const arg of args) {
    if (arg === "--allow-first-party-replace") {
      wrapperFlags.allowFirstPartyReplace = true;
      continue;
    }

    forwardedArgs.push(arg);
  }

  return { wrapperFlags, forwardedArgs };
}

function firstPositionalArg(args) {
  return args.find((arg) => !arg.startsWith("-")) ?? null;
}

function getTrackedFirstPartySkillNames() {
  const result = spawnSync("git", ["ls-files", ".agents/skills"], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    fail(result.error.message);
  }

  if (result.status !== 0) {
    fail(
      result.stderr.trim() || "Failed to enumerate tracked first-party skills.",
    );
  }

  return new Set(
    result.stdout
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((filePath) => filePath.split("/")[2])
      .filter(Boolean),
  );
}

function collectSkillNamesFromDirectory(rootDir) {
  const discovered = new Set();
  const stack = [rootDir];

  while (stack.length > 0) {
    const currentDir = stack.pop();
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    if (entries.some((entry) => entry.isFile() && entry.name === "SKILL.md")) {
      discovered.add(path.basename(currentDir));
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      if (entry.name === ".git" || entry.name === "node_modules") {
        continue;
      }

      stack.push(path.join(currentDir, entry.name));
    }
  }

  return [...discovered];
}

function isGitUrl(value) {
  return (
    value.startsWith("git@") ||
    value.startsWith("ssh://") ||
    value.startsWith("https://") ||
    value.startsWith("http://")
  );
}

function isGitHubShorthand(value) {
  return /^[^/\s]+\/[^/\s]+$/.test(value);
}

function cloneSourceToTempDir(source) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "playground-skills-source-"));
  const cloneUrl = isGitHubShorthand(source)
    ? `https://github.com/${source}.git`
    : source;
  const result = spawnSync(
    "git",
    ["clone", "--depth", "1", cloneUrl, tempDir],
    {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  if (result.error) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    fail(result.error.message);
  }

  if (result.status !== 0) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    fail(
      result.stderr.trim() ||
        `Failed to inspect install source ${source} before install.`,
    );
  }

  return tempDir;
}

function resolveInstallSourceRoot(source) {
  const candidatePath = path.resolve(repoRoot, source);
  if (fs.existsSync(candidatePath)) {
    return {
      type: "local",
      rootDir: candidatePath,
      cleanup: () => {},
    };
  }

  if (isGitUrl(source) || isGitHubShorthand(source)) {
    const rootDir = cloneSourceToTempDir(source);
    return {
      type: "git",
      rootDir,
      cleanup: () => fs.rmSync(rootDir, { recursive: true, force: true }),
    };
  }

  fail(
    [
      `Unsupported install source for collision preflight: ${source}`,
      "Use a local path, GitHub owner/repo shorthand, or git URL.",
    ].join("\n"),
  );
}

function assertNoFirstPartySkillCollisions(installArgs, allowFirstPartyReplace) {
  if (allowFirstPartyReplace) {
    return;
  }

  const source = firstPositionalArg(installArgs);
  if (!source) {
    fail("`pnpm skills:install` requires a source argument.");
  }

  const protectedSkills = getTrackedFirstPartySkillNames();
  const resolvedSource = resolveInstallSourceRoot(source);

  try {
    const incomingSkills = collectSkillNamesFromDirectory(resolvedSource.rootDir);
    const collisions = incomingSkills.filter((skillName) =>
      protectedSkills.has(skillName),
    );

    if (collisions.length === 0) {
      return;
    }

    fail(
      [
        "Install would overwrite repo-owned first-party skills.",
        `Colliding skills: ${collisions.sort().join(", ")}`,
        "Pass `--allow-first-party-replace` only if you intend to replace checked-in skills.",
      ].join("\n"),
    );
  } finally {
    resolvedSource.cleanup();
  }
}

function extractManagedBlock(contents) {
  const startMatch = contents.match(MANAGED_BLOCK_START);
  if (!startMatch || startMatch.index == null) {
    fail("OpenSkills sync output did not contain a <skills_system> block.");
  }

  const endIndex = contents.indexOf(
    MANAGED_BLOCK_END,
    startMatch.index + startMatch[0].length,
  );
  if (endIndex === -1) {
    fail("OpenSkills sync output did not contain a closing </skills_system> tag.");
  }

  return contents
    .slice(startMatch.index, endIndex + MANAGED_BLOCK_END.length)
    .trim();
}

function normalizeManagedBlock(block) {
  return block
    .replaceAll(
      "npx openskills read <skill-name>",
      "pnpm skills:read <skill-name>",
    )
    .replaceAll(
      "npx openskills read skill-one,skill-two",
      "pnpm skills:read skill-one && pnpm skills:read skill-two",
    )
    .replace("How to use skills:\n- Invoke:", "How to use skills:\n\n- Invoke:")
    .replace("Usage notes:\n- Only use", "Usage notes:\n\n- Only use");
}

function mergeManagedBlock(existingContents, managedBlock) {
  const startMatch = existingContents.match(MANAGED_BLOCK_START);

  if (!startMatch || startMatch.index == null) {
    const trimmed = existingContents.trimEnd();
    return `${trimmed}\n\n${managedBlock}\n`;
  }

  const endIndex = existingContents.indexOf(
    MANAGED_BLOCK_END,
    startMatch.index + startMatch[0].length,
  );
  if (endIndex === -1) {
    fail("Existing AGENTS.md has an unterminated <skills_system> block.");
  }

  return [
    existingContents.slice(0, startMatch.index).trimEnd(),
    managedBlock,
    existingContents.slice(endIndex + MANAGED_BLOCK_END.length).trimStart(),
  ]
    .filter(Boolean)
    .join("\n\n")
    .concat("\n");
}

async function syncAgents(args) {
  assertFlagsNotPresent(
    args,
    new Set(["-o", "--output"]),
    "`pnpm skills:sync` manages AGENTS.md directly. Omit custom output flags.",
  );

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "playground-openskills-"));
  const generatedAgentsPath = path.join(tempDir, "AGENTS.generated.md");

  try {
    runOpenSkills(["sync", "--output", generatedAgentsPath, ...args]);

    const [generatedContents, existingContents] = await Promise.all([
      readFile(generatedAgentsPath, "utf8"),
      readFile(agentsPath, "utf8"),
    ]);

    const managedBlock = normalizeManagedBlock(
      extractManagedBlock(generatedContents),
    );
    const nextContents = mergeManagedBlock(existingContents, managedBlock);
    await writeFile(agentsPath, nextContents, "utf8");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === "--help" || command === "-h") {
    usage();
    return;
  }

  assertCanonicalSkillsSymlink();

  switch (command) {
    case "install": {
      const { wrapperFlags, forwardedArgs } = splitWrapperFlags(args);
      assertFlagsNotPresent(
        forwardedArgs,
        new Set(["--global", "--universal"]),
        "This repo only supports project-local OpenSkills installs through the .claude/skills symlink.",
      );
      if (forwardedArgs.length === 0) {
        fail("`pnpm skills:install` requires a source argument.");
      }
      assertNoFirstPartySkillCollisions(
        forwardedArgs,
        wrapperFlags.allowFirstPartyReplace,
      );
      runOpenSkills(["install", ...forwardedArgs]);
      return;
    }
    case "list":
      runOpenSkills(["list", ...args]);
      return;
    case "read":
      if (args.length === 0) {
        fail("`pnpm skills:read` requires at least one skill name.");
      }
      runOpenSkills(["read", ...args]);
      return;
    case "sync":
      await syncAgents(args);
      return;
    default:
      fail(`Unknown skills command: ${command}`);
  }
}

await main();
