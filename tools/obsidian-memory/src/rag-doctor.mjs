#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { findProjectRoot } from "workspace-tools";

import {
  buildDoctorReport,
} from "./rag-governance.mjs";

const repoRoot = findProjectRoot(path.dirname(fileURLToPath(import.meta.url)), "pnpm");
const defaultVaultRoot = path.join(repoRoot, "vault");
const defaultIndexRoot = path.join(repoRoot, ".rag");

/**
 * Parse command-line flags for `pnpm rag:doctor`.
 */
export function parseArgs(argv, overrides = {}) {
  const resolvedRepoRoot = overrides.repoRoot ?? repoRoot;
  const options = {
    repoRoot: resolvedRepoRoot,
    vaultRoot: path.join(resolvedRepoRoot, "vault"),
    indexRoot: path.join(resolvedRepoRoot, ".rag"),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--vault") {
      options.vaultRoot = path.resolve(process.cwd(), argv[index + 1] ?? "");
      index += 1;
      continue;
    }

    if (arg === "--index-root") {
      options.indexRoot = path.resolve(process.cwd(), argv[index + 1] ?? "");
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }
  }

  return options;
}

function printUsage() {
  console.log(
    [
      "Usage:",
      "  pnpm rag:doctor [--vault <path>] [--index-root <path>]",
      "",
      "Run typed-memory governance checks and print the doctor report as JSON.",
    ].join("\n"),
  );
}

export async function runDoctor({
  vaultRoot = defaultVaultRoot,
  indexRoot = defaultIndexRoot,
  repoRoot: targetRepoRoot = repoRoot,
} = {}) {
  return buildDoctorReport({
    vaultRoot,
    indexRoot,
    repoRoot: targetRepoRoot,
  });
}

/**
 * Run the typed memory doctor CLI and print the governance report as JSON.
 */
async function run() {
  const options = parseArgs(process.argv.slice(2));
  const result = await runDoctor(options);

  console.log(JSON.stringify(result, null, 2));

  if (!result.passed) {
    process.exitCode = 1;
  }
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.stack || error.message : error);
    process.exit(1);
  });
}
