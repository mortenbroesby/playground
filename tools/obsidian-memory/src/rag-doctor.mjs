#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { findProjectRoot } from "workspace-tools";

import {
  buildCleanupReport,
  findStaleGeneratedFiles,
  loadTypedMemoryArtifacts,
  verifyTypedMemory,
} from "./rag-governance.mjs";

const repoRoot = findProjectRoot(path.dirname(fileURLToPath(import.meta.url)), "pnpm");
const vaultRoot = path.join(repoRoot, "vault");
const indexRoot = path.join(repoRoot, ".rag");

async function run() {
  const verification = await verifyTypedMemory({
    vaultRoot,
    indexRoot,
    repoRoot,
  });
  const artifacts = await loadTypedMemoryArtifacts(indexRoot);
  const staleGeneratedFiles = await findStaleGeneratedFiles(indexRoot);
  const cleanup = buildCleanupReport({
    noteRegistry: artifacts.noteRegistry,
    chunkIndex: artifacts.chunkIndex,
    diagnostics: artifacts.diagnostics,
    staleGeneratedFiles,
  });

  const result = {
    passed:
      verification.passed &&
      cleanup.invalid_frontmatter.length === 0 &&
      cleanup.generated_files_to_delete.length === 0,
    checks: {
      init_check: verification.errors.filter((error) =>
        error.startsWith("Missing required source path"),
      ),
      schema_check: verification.errors.filter(
        (error) =>
          error.startsWith("Duplicate note id") ||
          error.startsWith("Invalid status/type combination") ||
          error.startsWith("Generated registry entry points outside"),
      ),
      link_check: verification.errors.filter((error) =>
        error.startsWith("Unresolved links present"),
      ),
      index_check: verification.errors.filter((error) =>
        error.startsWith("Missing required index file"),
      ),
      retrieval_fixture_check: {
        note_count: verification.summary.notes,
        chunk_count: verification.summary.chunks,
      },
      cleanup_dry_run: cleanup,
      git_ignore_check: verification.errors.filter((error) =>
        error.includes(".gitignore"),
      ),
    },
    warnings: verification.warnings,
    verification_summary: verification.summary,
  };

  console.log(JSON.stringify(result, null, 2));

  if (!result.passed) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
