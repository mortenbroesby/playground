#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import process from "node:process";

const BYPASS_ENV = "SKIP_DOCS_CHECK";
const BYPASS_MEMORY_ENV = "SKIP_MEMORY_CHECK";
const LARGE_FILE_COUNT = 4;
const LARGE_LINE_COUNT = 120;

function git(args) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function stagedPaths() {
  const output = git([
    "diff",
    "--cached",
    "--name-only",
    "--diff-filter=ACMRT",
  ]);
  return output === "" ? [] : output.split("\n").filter(Boolean);
}

function changedLineCount(paths) {
  const relevantPaths = new Set(paths);
  const output = git(["diff", "--cached", "--numstat", "--diff-filter=ACMRT"]);

  if (output === "") {
    return 0;
  }

  return output.split("\n").reduce((total, line) => {
    const [additions, deletions, ...pathParts] = line.split("\t");
    const filePath = pathParts.join("\t");

    if (!relevantPaths.has(filePath)) {
      return total;
    }

    const added = Number.parseInt(additions, 10);
    const deleted = Number.parseInt(deletions, 10);

    return (
      total +
      (Number.isFinite(added) ? added : 0) +
      (Number.isFinite(deleted) ? deleted : 0)
    );
  }, 0);
}

function isDocPath(filePath) {
  return (
    /(^|\/)(README|AGENTS)\.md$/.test(filePath) ||
    filePath.startsWith("docs/") ||
    filePath.startsWith("vault/") ||
    filePath === ".github/copilot-instructions.md"
  );
}

function isMemoryPath(filePath) {
  return filePath.startsWith("vault/02 Repositories/");
}

function isGeneratedPath(filePath) {
  return /(^|\/)(dist|\.next|\.turbo|node_modules)\//.test(filePath);
}

function isRelevantChange(filePath) {
  if (isDocPath(filePath) || isGeneratedPath(filePath)) {
    return false;
  }

  return (
    /\.(cjs|css|html|js|jsx|json|mdx|mjs|scss|ts|tsx|ya?ml)$/.test(filePath) ||
    filePath.startsWith(".husky/") ||
    filePath.startsWith("tools/hooks/") ||
    filePath === "pnpm-lock.yaml"
  );
}

function isStructuralChange(filePath) {
  return (
    /(^|\/)package\.json$/.test(filePath) ||
    /(^|\/)tsconfig[^/]*\.json$/.test(filePath) ||
    /(^|\/)vite\.config\.[cm]?[jt]s$/.test(filePath) ||
    /(^|\/)eslint\.config\.[cm]?[jt]s$/.test(filePath) ||
    filePath === "pnpm-workspace.yaml" ||
    filePath === "turbo.json" ||
    filePath === "vercel.json" ||
    filePath.startsWith(".husky/") ||
    filePath.startsWith("tools/hooks/")
  );
}

const paths = stagedPaths();
const docsUpdated = paths.some(isDocPath);
const memoryUpdated = paths.some(isMemoryPath);
const relevantPaths = paths.filter(isRelevantChange);
const structuralPaths = relevantPaths.filter(isStructuralChange);
const changedLines = changedLineCount(relevantPaths);
const looksLarge =
  relevantPaths.length >= LARGE_FILE_COUNT ||
  changedLines >= LARGE_LINE_COUNT ||
  structuralPaths.length > 0;
const docsBypassed = process.env[BYPASS_ENV] === "1";
const memoryBypassed = process.env[BYPASS_MEMORY_ENV] === "1";

if (paths.length === 0 || !looksLarge) {
  process.exit(0);
}

if (!memoryUpdated && !memoryBypassed) {
  const summary = [
    "Large staged change detected without a repo memory note.",
    "",
    `Relevant files: ${relevantPaths.length}`,
    `Relevant changed lines: ${changedLines}`,
  ];

  if (structuralPaths.length > 0) {
    summary.push(`Structural files: ${structuralPaths.join(", ")}`);
  }

  summary.push(
    "",
    "Stage a vault note under vault/02 Repositories/ before committing.",
    `For an intentional no-memory commit, rerun with ${BYPASS_MEMORY_ENV}=1 git commit ...`,
  );

  console.error(summary.join("\n"));
  process.exit(1);
}

if (docsUpdated || docsBypassed) {
  if (!memoryUpdated && memoryBypassed) {
    console.warn(
      [
        "Large staged change detected without a repo memory note.",
        `Continuing because ${BYPASS_MEMORY_ENV}=1 is set.`,
      ].join("\n"),
    );
  }

  process.exit(0);
}

const summary = [
  "Large staged change detected without a README, AGENTS, docs, or vault update.",
  "",
  `Relevant files: ${relevantPaths.length}`,
  `Relevant changed lines: ${changedLines}`,
];

if (structuralPaths.length > 0) {
  summary.push(`Structural files: ${structuralPaths.join(", ")}`);
}

summary.push(
  "",
  "Stage the matching documentation update before committing.",
  `For an intentional no-docs commit, rerun with ${BYPASS_ENV}=1 git commit ...`,
);

console.error(summary.join("\n"));
process.exit(1);
