#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const outputPath = path.join(
  repoRoot,
  ".agents",
  "context",
  "claude-mem-context.local.md",
);

function parseArgs(argv) {
  const args = {
    project: path.basename(repoRoot),
    platformSource: "codex",
    url: "http://localhost:37777",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--project") {
      args.project = argv[index + 1] ?? args.project;
      index += 1;
      continue;
    }

    if (token === "--platform") {
      args.platformSource = argv[index + 1] ?? args.platformSource;
      index += 1;
      continue;
    }

    if (token === "--url") {
      args.url = argv[index + 1] ?? args.url;
      index += 1;
      continue;
    }
  }

  return args;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function extractContextBlock(content) {
  const match = content.match(
    /<claude-mem-context>[\s\S]*?<\/claude-mem-context>/u,
  );

  return match?.[0]?.trim() ?? null;
}

function readCodexContextFile() {
  const codexAgentsPath = path.join(os.homedir(), ".codex", "AGENTS.md");

  if (!fs.existsSync(codexAgentsPath)) {
    return null;
  }

  const content = fs.readFileSync(codexAgentsPath, "utf8");
  const contextBlock = extractContextBlock(content);

  if (!contextBlock) {
    fail(`No <claude-mem-context> block found in ${codexAgentsPath}`);
  }

  return contextBlock;
}

const args = parseArgs(process.argv.slice(2));
const url = new URL("/api/context/inject", args.url);
url.searchParams.set("project", args.project);
url.searchParams.set("platformSource", args.platformSource);

let contextBlock = null;
try {
  const response = await fetch(url);

  if (!response.ok) {
    fail(`claude-mem worker returned HTTP ${response.status}`);
  }

  const body = (await response.text()).trim();
  contextBlock = [
    "<claude-mem-context>",
    body || "No previous sessions found.",
    "</claude-mem-context>",
  ].join("\n");
} catch (error) {
  contextBlock = readCodexContextFile();

  if (!contextBlock) {
    fail(
      `Failed to reach claude-mem worker at ${args.url}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(
  outputPath,
  `${contextBlock}\n`,
  "utf8",
);

console.log(`Synced claude-mem context to ${path.relative(repoRoot, outputPath)}`);
