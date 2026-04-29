#!/usr/bin/env node

import { rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { findProjectRoot } from "workspace-tools";

import {
  buildCleanupReport,
  findStaleGeneratedFiles,
  loadTypedMemoryArtifacts,
} from "./rag-governance.mjs";

const repoRoot = findProjectRoot(path.dirname(fileURLToPath(import.meta.url)), "pnpm");
const defaultIndexRoot = path.join(repoRoot, ".rag");

function parseArgs(argv) {
  const options = {
    mode: "dry-run",
    indexRoot: defaultIndexRoot,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      options.mode = "dry-run";
      continue;
    }

    if (arg === "--apply-generated") {
      options.mode = "apply-generated";
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
      "  pnpm rag:clean --dry-run",
      "  pnpm rag:clean --apply-generated",
      "",
      "Generate a cleanup report or delete only stale generated index files.",
    ].join("\n"),
  );
}

async function ensureIndexRoot(indexRoot) {
  const indexStat = await stat(indexRoot);

  if (!indexStat.isDirectory()) {
    throw new Error(`Index root is not a directory: ${indexRoot}`);
  }
}

async function writeCleanupReport(indexRoot, report) {
  const cleanupReportPath = path.join(indexRoot, "cleanup-report.json");
  await writeFile(cleanupReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  await ensureIndexRoot(options.indexRoot);

  const artifacts = await loadTypedMemoryArtifacts(options.indexRoot);
  const staleGeneratedFiles = await findStaleGeneratedFiles(options.indexRoot);
  const report = buildCleanupReport({
    noteRegistry: artifacts.noteRegistry,
    chunkIndex: artifacts.chunkIndex,
    diagnostics: artifacts.diagnostics,
    staleGeneratedFiles,
  });

  if (options.mode === "apply-generated") {
    await Promise.all(
      staleGeneratedFiles.map((fileName) =>
        rm(path.join(options.indexRoot, fileName), { force: true }),
      ),
    );

    const appliedReport = {
      ...report,
      generated_files_deleted: staleGeneratedFiles,
    };

    await writeCleanupReport(options.indexRoot, appliedReport);
    console.log(JSON.stringify(appliedReport, null, 2));
    return;
  }

  console.log(JSON.stringify(report, null, 2));
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
