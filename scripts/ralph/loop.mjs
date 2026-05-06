#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { setTimeout } from "node:timers/promises";

const repoRoot = process.cwd();
const promptTemplatePath = path.join(repoRoot, "scripts", "ralph", "prompt.md");
const DEFAULT_ROUNDS = 1;
const DEFAULT_AUTOPILOT_ROUNDS = 25;
const DEFAULT_AUTOPILOT_WAIT_MS = 0;

function parseArgs(argv) {
  const args = {
    dir: "",
    agent: "",
    agentCommand: "",
    storyId: "",
    model: "",
    sandbox: "workspace-write",
    dryRun: false,
    autoCommit: false,
    enforceBranch: false,
    list: false,
    rounds: DEFAULT_ROUNDS,
    roundsSpecified: false,
    autopilot: false,
    autopilotMaxRounds: DEFAULT_AUTOPILOT_ROUNDS,
    autopilotMaxRoundsSpecified: false,
    autopilotWaitMs: DEFAULT_AUTOPILOT_WAIT_MS,
    all: false,
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

    if (token === "--story") {
      args.storyId = argv[index + 1] ?? "";
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

    if (token === "--rounds") {
      args.rounds = parsePositiveInteger(
        argv[index + 1],
        index,
        argv.length,
        "--rounds",
      );
      args.roundsSpecified = true;
      index += 1;
      continue;
    }

    if (token === "--autopilot") {
      args.autopilot = true;
      continue;
    }

    if (token === "--autopilot-max-rounds") {
      args.autopilotMaxRounds = parsePositiveInteger(
        argv[index + 1],
        index,
        argv.length,
        "--autopilot-max-rounds",
      );
      args.autopilotMaxRoundsSpecified = true;
      index += 1;
      continue;
    }

    if (token === "--autopilot-wait-ms") {
      args.autopilotWaitMs = parseNonNegativeInteger(
        argv[index + 1],
        index,
        argv.length,
        "--autopilot-wait-ms",
      );
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

    if (token === "--list") {
      args.list = true;
      continue;
    }

    if (token === "--all") {
      args.all = true;
      continue;
    }
  }

  return args;
}

function parsePositiveInteger(rawValue, position, argvLength, flagName) {
  const parsed = Number.parseInt(rawValue ?? "", 10);

  if (!Number.isFinite(parsed)) {
    fail(
      `Invalid ${flagName} value "${rawValue}" at position ${position + 1} of ${argvLength}. Use ${flagName} <positive integer>.`,
    );
  }

  if (parsed <= 0) {
    fail(`${flagName} must be a positive integer, got ${parsed}.`);
  }

  return parsed;
}

function parseNonNegativeInteger(rawValue, position, argvLength, flagName) {
  const parsed = Number.parseInt(rawValue ?? "", 10);

  if (!Number.isFinite(parsed)) {
    fail(
      `Invalid ${flagName} value "${rawValue}" at position ${position + 1} of ${argvLength}. Use ${flagName} <integer >= 0>.`,
    );
  }

  if (parsed < 0) {
    fail(`${flagName} must be >= 0, got ${parsed}.`);
  }

  return parsed;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

async function runWithPause(waitMs) {
  if (waitMs <= 0) {
    return;
  }

  await setTimeout(waitMs);
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

function normalizeStatus(story) {
  if (story?.passes === true) {
    return "done";
  }

  if (typeof story?.status === "string" && story.status.trim() !== "") {
    const status = story.status.trim().toLowerCase();
    if (status === "complete" || status === "completed") {
      return "done";
    }
    return status;
  }

  return "pending";
}

function validatePrd(prd) {
  const issues = [];

  if (!prd || typeof prd !== "object" || Array.isArray(prd)) {
    issues.push("`prd.json` must contain a JSON object.");
    return issues;
  }

  if (typeof prd.title !== "string" || prd.title.trim() === "") {
    issues.push("`title` must be a non-empty string.");
  }

  if (!Array.isArray(prd.stories) || prd.stories.length === 0) {
    issues.push("`stories` must be a non-empty array.");
    return issues;
  }

  const storyIds = new Set();

  prd.stories.forEach((story, index) => {
    const label = `stories[${index}]`;

    if (!story || typeof story !== "object" || Array.isArray(story)) {
      issues.push(`${label} must be an object.`);
      return;
    }

    if (typeof story.id !== "string" || story.id.trim() === "") {
      issues.push(`${label}.id must be a non-empty string.`);
    } else if (storyIds.has(story.id)) {
      issues.push(`${label}.id '${story.id}' is duplicated.`);
    } else {
      storyIds.add(story.id);
    }

    if (typeof story.title !== "string" || story.title.trim() === "") {
      issues.push(`${label}.title must be a non-empty string.`);
    }

    const status = normalizeStatus(story);
    const allowedStatuses = new Set(["pending", "in_progress", "blocked", "done"]);

    if (!allowedStatuses.has(status)) {
      issues.push(
        `${label}.status must be one of pending, in_progress, blocked, done.`,
      );
    }
  });

  return issues;
}

/**
 * Pick the next story for one run.
 *
 * Explicit --story always wins.
 * Otherwise prefer in-progress stories, then pending by priority, then blocked.
 */
function pickNextStory(stories, storyId, skipStoryIds = new Set()) {
  if (storyId) {
    return stories.find((story) => story?.id === storyId);
  }

  return stories
    .map((story, index) => ({ ...story, _index: index }))
    .filter((story) => normalizeStatus(story) !== "done")
    .filter((story) => !skipStoryIds.has(story.id))
    .sort((left, right) => {
      const statusOrder = new Map([
        ["in_progress", 0],
        ["pending", 1],
        ["blocked", 2],
      ]);

      const statusDelta =
        (statusOrder.get(normalizeStatus(left)) ?? 99) -
        (statusOrder.get(normalizeStatus(right)) ?? 99);

      if (statusDelta !== 0) {
        return statusDelta;
      }

      const priorityDelta =
        normalizePriority(left.priority) - normalizePriority(right.priority);

      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return left._index - right._index;
    })[0];
}

function formatStories(stories) {
  return stories
    .map((story) => {
      const status = normalizeStatus(story);
      const priority = story.priority ?? "none";
      return `- ${story.id}: ${story.title} [status=${status}, priority=${priority}]`;
    })
    .join("\n");
}

function joinChecks(checks) {
  if (!Array.isArray(checks) || checks.length === 0) {
    return "- No explicit checks listed in `prd.json`. Use the narrowest relevant project checks.";
  }

  return checks.map((check) => `- ${check}`).join("\n");
}

function readRecentProgress(progressPath) {
  const raw = fs.readFileSync(progressPath, "utf8").trim();

  if (!raw) {
    return "No prior progress logged yet.";
  }

  const lines = raw.split("\n");
  const tail = lines.slice(-16).join("\n").trim();
  return tail || "No prior progress logged yet.";
}

function buildPrompt({
  template,
  runDir,
  prd,
  story,
  branch,
  autoCommit,
  recentProgress,
  storySummary,
  roundIndex,
  roundTotal,
}) {
  return template
    .replaceAll("{{RUN_DIR}}", runDir)
    .replaceAll("{{PRD_TITLE}}", prd.title || "Untitled Ralph Run")
    .replaceAll("{{BRANCH_NAME}}", prd.branchName || "(not specified)")
    .replaceAll("{{CURRENT_BRANCH}}", branch || "(detached)")
    .replaceAll("{{STORY_ID}}", story.id || "UNKNOWN")
    .replaceAll("{{STORY_TITLE}}", story.title || "Untitled story")
    .replaceAll("{{STORY_STATUS}}", normalizeStatus(story))
    .replaceAll(
      "{{STORY_NOTES}}",
      story.notes || "No additional story notes were provided.",
    )
    .replaceAll("{{STORY_SUMMARY}}", storySummary)
    .replaceAll("{{RECENT_PROGRESS}}", recentProgress)
    .replaceAll("{{CHECKS}}", joinChecks(prd.checks))
    .replaceAll("{{ROUND_INDEX}}", String(roundIndex))
    .replaceAll("{{ROUND_TOTAL}}", String(roundTotal))
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
  let promptPath = path.join(runDirPath, `prompt-${stamp}.md`);
  let suffix = 1;

  while (fs.existsSync(promptPath)) {
    promptPath = path.join(runDirPath, `prompt-${stamp}-${suffix}.md`);
    suffix += 1;
  }

  fs.writeFileSync(promptPath, prompt, "utf8");
  return promptPath;
}

function writeLastRun(runDirPath, payload) {
  const lastRunPath = path.join(runDirPath, "last-run.json");
  fs.writeFileSync(lastRunPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return lastRunPath;
}

function exitWithAgentResult(result, agentLabel, diagnostics) {
  const status = result.status ?? 1;

  if (status !== 0) {
    console.error(
      [
        `${agentLabel} exited with status ${status}.`,
        ...diagnostics.map((line) => `- ${line}`),
      ].join("\n"),
    );
  }

  process.exit(status);
}

function runAgentRound({
  agent,
  agentCommand,
  model,
  sandbox,
  prompt,
  repoRootPath,
  lastMessagePath,
  diagnostics,
}) {
  if (agentCommand) {
    const result = spawnSync(agentCommand, {
      cwd: repoRootPath,
      shell: true,
      stdio: ["pipe", "inherit", "inherit"],
      input: prompt,
      encoding: "utf8",
    });

    return exitWithAgentResult(
      result,
      "Custom agent command",
      diagnostics,
    );
  }

  if (agent === "codex") {
    const codexArgs = [
      "exec",
      "--cd",
      repoRootPath,
      "--sandbox",
      sandbox || "workspace-write",
      "--output-last-message",
      lastMessagePath,
      "-",
    ];

    if (model) {
      codexArgs.splice(1, 0, "--model", model);
    }

    const result = spawnSync("codex", codexArgs, {
      cwd: repoRootPath,
      stdio: ["pipe", "inherit", "inherit"],
      input: prompt,
      encoding: "utf8",
    });

    return exitWithAgentResult(result, "Codex", diagnostics);
  }

  if (agent === "claude") {
    const claudeArgs = ["-p", "--permission-mode", "acceptEdits", prompt];

    if (model) {
      claudeArgs.splice(1, 0, "--model", model);
    }

    const result = spawnSync("claude", claudeArgs, {
      cwd: repoRootPath,
      stdio: "inherit",
      encoding: "utf8",
    });

    return exitWithAgentResult(result, "Claude", diagnostics);
  }

  return fail(`Unsupported agent: ${agent}`);
}

function hasRunFiles(runDirPath) {
  return (
    fs.existsSync(path.join(runDirPath, "prd.json"))
    && fs.existsSync(path.join(runDirPath, "progress.txt"))
  );
}

function resolveRunStates(baseDirPath, useAll) {
  if (!fs.existsSync(baseDirPath)) {
    fail(`Ralph run directory does not exist: ${path.relative(repoRoot, baseDirPath)}`);
  }

  const baseStats = fs.statSync(baseDirPath);

  if (!baseStats.isDirectory()) {
    fail(`Ralph run path must be a directory: ${baseDirPath}`);
  }

  const directPrd = path.join(baseDirPath, "prd.json");
  const directProgress = path.join(baseDirPath, "progress.txt");
  const directRun =
    fs.existsSync(directPrd) && fs.existsSync(directProgress)
      ? [baseDirPath]
      : [];

  if (directRun.length > 0) {
    return directRun;
  }

  if (!useAll) {
    fail(
      "Ralph run directory does not contain `prd.json` and `progress.txt`. "
      + "Use --all to execute across child run directories.",
    );
  }

  const childRuns = fs
    .readdirSync(baseDirPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(baseDirPath, entry.name))
    .filter(hasRunFiles)
    .sort();

  if (childRuns.length === 0) {
    fail(`No Ralph runs found under ${path.relative(repoRoot, baseDirPath)}.`);
  }

  return childRuns;
}

function loadRunState(runDirPath) {
  const relativeRunDir = path.relative(repoRoot, runDirPath);
  return {
    runDirPath,
    relativeRunDir,
    prdPath: path.join(runDirPath, "prd.json"),
    progressPath: path.join(runDirPath, "progress.txt"),
    lastMessagePath: path.join(runDirPath, "last-message.txt"),
    selectedStoryIds: new Set(),
  };
}

function listRunState(state) {
  const prd = readJson(state.prdPath);
  const issues = validatePrd(prd);

  if (issues.length > 0) {
    fail(
      [
        `Invalid PRD in ${state.relativeRunDir}:`,
        ...issues.map((issue) => `- ${issue}`),
      ].join("\n"),
    );
  }

  console.log(`${state.relativeRunDir}:`);
  console.log(formatStories(prd.stories));
}

function statusOrderForStory(story) {
  const map = new Map([
    ["in_progress", 0],
    ["pending", 1],
    ["blocked", 2],
    ["done", 3],
  ]);
  return map.get(normalizeStatus(story)) ?? 99;
}

function pickGlobalCandidate(runStates, args, branch, enforceBranch) {
  const candidates = [];
  const requestedStory = args.storyId;

  for (let runIndex = 0; runIndex < runStates.length; runIndex += 1) {
    const state = runStates[runIndex];
    const prd = readJson(state.prdPath);
    const issues = validatePrd(prd);

    if (issues.length > 0) {
      fail(
        [
          `Invalid \`prd.json\` in ${state.relativeRunDir}:`,
          ...issues.map((issue) => `- ${issue}`),
        ].join("\n"),
      );
    }

    if (
      enforceBranch &&
      typeof prd.branchName === "string" &&
      prd.branchName.trim() !== "" &&
      prd.branchName !== branch
    ) {
      fail(
        [
          `Current branch ${branch} does not match PRD branch ${prd.branchName} for ${state.relativeRunDir}.`,
          "Re-run on the intended branch or omit --enforce-branch.",
        ].join("\n"),
      );
    }

    const story = pickNextStory(
      prd.stories,
      requestedStory,
      requestedStory ? new Set() : state.selectedStoryIds,
    );

    if (!story) {
      continue;
    }

    candidates.push({
      state,
      prd,
      story,
      runIndex,
      storySummary: formatStories(prd.stories),
      recentProgress: "",
      priority: normalizePriority(story.priority),
      statusOrder: statusOrderForStory(story),
      status: normalizeStatus(story),
    });
  }

  if (candidates.length === 0) {
    return null;
  }

  if (requestedStory && candidates.length > 1) {
    fail(
      `Story ${requestedStory} exists in multiple runs: `
      + `${candidates.map((c) => c.state.relativeRunDir).join(", ")}`,
    );
  }

  const selected = candidates.sort((left, right) => {
    if (left.statusOrder !== right.statusOrder) {
      return left.statusOrder - right.statusOrder;
    }

    if (left.priority !== right.priority) {
      return left.priority - right.priority;
    }

    if (left.runIndex !== right.runIndex) {
      return left.runIndex - right.runIndex;
    }

    return 0;
  })[0];

  selected.recentProgress = readRecentProgress(selected.state.progressPath);

  return selected;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.autopilot && !args.dryRun && !args.agent && !args.agentCommand) {
    fail(
      "--autopilot requires --agent or --agent-command. Use --dry-run if no agent should run now.",
    );
  }

  if (
    args.autopilot
    && args.roundsSpecified
    && args.autopilotMaxRoundsSpecified
  ) {
    fail("--rounds and --autopilot-max-rounds are mutually exclusive in autopilot mode.");
  }

  const requestedBranch = currentBranch();
  const baseRunDir = path.resolve(
    repoRoot,
    args.dir || (args.all ? ".ralph" : path.join(".ralph", "feature")),
  );
  const runDirectoryPaths = resolveRunStates(
    baseRunDir,
    args.all,
  );
  const runStates = runDirectoryPaths.map(loadRunState);

  runStates.forEach((state) => {
    if (!fs.existsSync(state.prdPath)) {
      fail(`Missing PRD file: ${path.relative(repoRoot, state.prdPath)}`);
    }

    if (!fs.existsSync(state.progressPath)) {
      fail(
        `Missing progress log: ${path.relative(repoRoot, state.progressPath)}`,
      );
    }
  });

  if (args.list) {
    console.log(
      `Ralph loops in ${path.relative(repoRoot, baseRunDir)}`
      + `${args.all ? " (merged)" : ""}:`,
    );
    runStates.forEach((state) => {
      listRunState(state);
    });
    return;
  }

  if (args.rounds <= 0) {
    fail("--rounds must be a positive integer.");
  }

  const requestedRounds = Number.parseInt(String(args.rounds), 10);
  const effectiveRounds = args.autopilot
    ? args.roundsSpecified
      ? requestedRounds
      : args.autopilotMaxRounds
    : requestedRounds;
  const template = fs.readFileSync(promptTemplatePath, "utf8");
  let executedRounds = 0;
  let endedDueToNoWork = false;

  for (let roundIndex = 1; roundIndex <= effectiveRounds; roundIndex += 1) {
    const candidate = pickGlobalCandidate(
      runStates,
      args,
      requestedBranch,
      args.enforceBranch,
    );

    if (!candidate) {
      if (executedRounds === 0) {
        if (args.storyId) {
          fail(`Story not found: ${args.storyId}`);
        }

        console.log(
          `No pending stories remain in ${path.relative(repoRoot, baseRunDir)}`
          + `${args.all ? " (merged)" : ""}`,
        );
        return;
      }

      endedDueToNoWork = true;
      console.log(
        args.autopilot
          ? `Autopilot reached completion after ${executedRounds} round(s).`
          : `No additional pending stories for round ${roundIndex}.`,
      );
      break;
    }

    const prompt = buildPrompt({
      template,
      runDir: candidate.state.relativeRunDir,
      prd: candidate.prd,
      story: candidate.story,
      branch: requestedBranch,
      autoCommit: args.autoCommit,
      recentProgress: candidate.recentProgress,
      storySummary: candidate.storySummary,
      roundIndex,
      roundTotal: effectiveRounds,
    });

    const promptPath = writePrompt(candidate.state.runDirPath, prompt);
    const lastRunPath = writeLastRun(candidate.state.runDirPath, {
      generatedAt: new Date().toISOString(),
      branch: requestedBranch,
      rounds: {
        index: roundIndex,
        total: effectiveRounds,
      },
      storyId: candidate.story.id,
      storyTitle: candidate.story.title,
      storyStatus: normalizeStatus(candidate.story),
      runDir: candidate.state.relativeRunDir,
      promptPath: path.relative(repoRoot, promptPath),
    });

    executedRounds += 1;
    if (!args.storyId) {
      candidate.state.selectedStoryIds.add(candidate.story.id);
    }

    console.log(
      `Round ${roundIndex}/${effectiveRounds}: selected ${candidate.state.relativeRunDir}`
      + ` / ${candidate.story.id} - ${candidate.story.title} [status=${candidate.status}]`,
    );
    console.log(`Prompt file: ${path.relative(repoRoot, promptPath)}`);
    console.log(`Last run file: ${path.relative(repoRoot, lastRunPath)}`);
    console.log(
      `Last message file: ${path.relative(repoRoot, candidate.state.lastMessagePath)}`,
    );

    if (args.dryRun || (!args.agent && !args.agentCommand)) {
      continue;
    }

    runAgentRound({
      agent: args.agent,
      agentCommand: args.agentCommand,
      model: args.model,
      sandbox: args.sandbox,
      prompt,
      repoRootPath: repoRoot,
      lastMessagePath: candidate.state.lastMessagePath,
      diagnostics: [
        `Inspect ${path.relative(repoRoot, promptPath)} for the generated prompt.`,
        `Inspect ${path.relative(repoRoot, lastRunPath)} for run metadata.`,
        `Inspect ${path.relative(repoRoot, candidate.state.lastMessagePath)} if the agent wrote a final message.`,
      ],
    });

    if (args.autopilot && args.autopilotWaitMs > 0) {
      await runWithPause(args.autopilotWaitMs);
    }
  }

  if (args.dryRun || (!args.agent && !args.agentCommand)) {
    if (executedRounds > 1) {
      console.log(`Dry run complete for ${executedRounds} round(s).`);
    } else {
      console.log("Dry run only. Inspect the generated prompt file and re-run with an agent.");
    }
    return;
  }

  if (executedRounds === 0) {
    fail("No stories were selected for execution.");
  }

  if (args.autopilot) {
    if (endedDueToNoWork) {
      return;
    }

    if (executedRounds >= effectiveRounds) {
      console.log(
        `Autopilot reached the configured cap of ${effectiveRounds} round(s).`,
      );
    }
    return;
  }

  if (executedRounds < effectiveRounds) {
    const roundsStatus =
      args.storyId
        ? `Requested ${effectiveRounds} rounds for ${args.storyId}.`
        : `Requested ${effectiveRounds} rounds, but only ${executedRounds} stories remained.`;
    console.log(roundsStatus);
  }

  console.log(`Completed ${executedRounds} round(s).`);
}

await main();
