#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const promptTemplatePath = path.join(repoRoot, "scripts", "ralph", "prompt.md");

function parseArgs(argv) {
  const args = {
    dir: "",
    agent: "",
    agentCommand: "",
    model: "",
    sandbox: "workspace-write",
    dryRun: false,
    autoCommit: false,
    enforceBranch: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--dir") {
      args.dir = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (token === "--agent") {
      args.agent = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (token === "--agent-command") {
      args.agentCommand = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (token === "--model") {
      args.model = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (token === "--sandbox") {
      args.sandbox = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (token === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (token === "--auto-commit") {
      args.autoCommit = true;
      continue;
    }

    if (token === "--enforce-branch") {
      args.enforceBranch = true;
      continue;
    }
  }

  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function currentBranch() {
  return execFileSync("git", ["branch", "--show-current"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();
}

function normalizePriority(priority) {
  const order = new Map([
    ["critical", 0],
    ["high", 1],
    ["medium", 2],
    ["low", 3],
  ]);

  if (typeof priority === "number") {
    return priority;
  }

  if (typeof priority === "string") {
    return order.get(priority.toLowerCase()) ?? 99;
  }

  return 99;
}

function pickNextStory(stories) {
  return stories
    .map((story, index) => ({ ...story, _index: index }))
    .filter((story) => story?.passes !== true)
    .sort((left, right) => {
      const priorityDelta =
        normalizePriority(left.priority) - normalizePriority(right.priority);

      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return left._index - right._index;
    })[0];
}

function joinChecks(checks) {
  if (!Array.isArray(checks) || checks.length === 0) {
    return "- No explicit checks listed in `prd.json`. Use the narrowest relevant project checks.";
  }

  return checks.map((check) => `- ${check}`).join("\n");
}

function buildPrompt({ template, runDir, prd, story, branch, autoCommit }) {
  return template
    .replaceAll("{{RUN_DIR}}", runDir)
    .replaceAll("{{PRD_TITLE}}", prd.title || "Untitled Ralph Run")
    .replaceAll("{{BRANCH_NAME}}", prd.branchName || "(not specified)")
    .replaceAll("{{CURRENT_BRANCH}}", branch || "(detached)")
    .replaceAll("{{STORY_ID}}", story.id || "UNKNOWN")
    .replaceAll("{{STORY_TITLE}}", story.title || "Untitled story")
    .replaceAll(
      "{{STORY_NOTES}}",
      story.notes || "No additional story notes were provided.",
    )
    .replaceAll("{{CHECKS}}", joinChecks(prd.checks))
    .replaceAll(
      "{{COMMIT_POLICY}}",
      autoCommit
        ? [
            "If checks pass and the story is fully complete, commit all changes for this iteration.",
            "Commit message format: `feat: [Story ID] - [Story Title]`.",
          ].join("\n")
        : [
            "Do not commit automatically.",
            "Leave the worktree ready for human review after updating `prd.json` and `progress.txt`.",
          ].join("\n"),
    );
}

function writePrompt(runDirPath, prompt) {
  const stamp = new Date().toISOString().replaceAll(":", "-");
  const promptPath = path.join(runDirPath, `prompt-${stamp}.md`);
  fs.writeFileSync(promptPath, prompt, "utf8");
  return promptPath;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
const relativeRunDir = args.dir || path.join(".ralph", "feature");
const absoluteRunDir = path.resolve(repoRoot, relativeRunDir);

if (!fs.existsSync(absoluteRunDir)) {
  fail(`Ralph run directory does not exist: ${relativeRunDir}`);
}

const prdPath = path.join(absoluteRunDir, "prd.json");
const progressPath = path.join(absoluteRunDir, "progress.txt");

if (!fs.existsSync(prdPath)) {
  fail(`Missing PRD file: ${path.relative(repoRoot, prdPath)}`);
}

if (!fs.existsSync(progressPath)) {
  fail(`Missing progress log: ${path.relative(repoRoot, progressPath)}`);
}

const prd = readJson(prdPath);
const story = pickNextStory(Array.isArray(prd.stories) ? prd.stories : []);

if (!story) {
  console.log(`No pending stories remain in ${relativeRunDir}`);
  process.exit(0);
}

const branch = currentBranch();

if (
  args.enforceBranch &&
  typeof prd.branchName === "string" &&
  prd.branchName.trim() !== "" &&
  prd.branchName !== branch
) {
  fail(
    [
      `Current branch ${branch} does not match PRD branch ${prd.branchName}.`,
      "Re-run on the intended branch or omit --enforce-branch.",
    ].join("\n"),
  );
}

const template = fs.readFileSync(promptTemplatePath, "utf8");
const prompt = buildPrompt({
  template,
  runDir: relativeRunDir,
  prd,
  story,
  branch,
  autoCommit: args.autoCommit,
});
const promptPath = writePrompt(absoluteRunDir, prompt);
const lastMessagePath = path.join(absoluteRunDir, "last-message.txt");

console.log(`Selected story: ${story.id} - ${story.title}`);
console.log(`Run directory: ${relativeRunDir}`);
console.log(`Prompt file: ${path.relative(repoRoot, promptPath)}`);

if (args.dryRun || (!args.agent && !args.agentCommand)) {
  console.log("Dry run only. Inspect the generated prompt file and re-run with an agent.");
  process.exit(0);
}

if (args.agentCommand) {
  const result = spawnSync(args.agentCommand, {
    cwd: repoRoot,
    shell: true,
    stdio: ["pipe", "inherit", "inherit"],
    input: prompt,
    encoding: "utf8",
  });

  process.exit(result.status ?? 1);
}

if (args.agent === "codex") {
  const codexArgs = [
    "exec",
    "--cd",
    repoRoot,
    "--sandbox",
    args.sandbox || "workspace-write",
    "--output-last-message",
    lastMessagePath,
    "-",
  ];

  if (args.model) {
    codexArgs.splice(1, 0, "--model", args.model);
  }

  const result = spawnSync("codex", codexArgs, {
    cwd: repoRoot,
    stdio: ["pipe", "inherit", "inherit"],
    input: prompt,
    encoding: "utf8",
  });

  process.exit(result.status ?? 1);
}

if (args.agent === "claude") {
  const claudeArgs = [
    "-p",
    "--permission-mode",
    "acceptEdits",
    prompt,
  ];

  if (args.model) {
    claudeArgs.splice(1, 0, "--model", args.model);
  }

  const result = spawnSync("claude", claudeArgs, {
    cwd: repoRoot,
    stdio: "inherit",
    encoding: "utf8",
  });

  process.exit(result.status ?? 1);
}

fail(`Unsupported agent: ${args.agent}`);
