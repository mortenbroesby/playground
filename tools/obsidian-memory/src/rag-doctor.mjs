#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { findProjectRoot } from "workspace-tools";

import {
  buildDoctorReport,
} from "./rag-governance.mjs";

const repoRoot = findProjectRoot(path.dirname(fileURLToPath(import.meta.url)), "pnpm");
const vaultRoot = path.join(repoRoot, "vault");
const indexRoot = path.join(repoRoot, ".rag");

/**
 * Run the typed memory doctor CLI and print the governance report as JSON.
 */
async function run() {
  const result = await buildDoctorReport({
    vaultRoot,
    indexRoot,
    repoRoot,
  });

  console.log(JSON.stringify(result, null, 2));

  if (!result.passed) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
