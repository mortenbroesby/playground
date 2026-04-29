#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { findProjectRoot } from "workspace-tools";

import {
  buildWriteTargetPath,
  findWriteDuplicates,
  loadTypedMemoryArtifacts,
  renderTypedNoteTemplate,
  validateWriteInput,
} from "./rag-governance.mjs";

const repoRoot = findProjectRoot(path.dirname(fileURLToPath(import.meta.url)), "pnpm");
const vaultRoot = path.join(repoRoot, "vault");
const indexRoot = path.join(repoRoot, ".rag");

function parseArgs(argv) {
  const options = {
    noteType: "",
    title: "",
    summary: "",
    owner: "",
    repoSlug: "playground",
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--type") {
      options.noteType = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--title") {
      options.title = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--summary") {
      options.summary = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--owner") {
      options.owner = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--repo-slug") {
      options.repoSlug = argv[index + 1] ?? options.repoSlug;
      index += 1;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
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
      '  pnpm rag:write --type spec --title "Rebuild RAG memory" --summary "Spec for rebuilding repo memory."',
      "",
      "Create a new typed memory note in the spec-defined folder layout.",
    ].join("\n"),
  );
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  validateWriteInput({
    noteType: options.noteType,
    title: options.title,
    summary: options.summary,
  });

  const artifacts = await loadTypedMemoryArtifacts(indexRoot);
  const duplicates = findWriteDuplicates({
    noteRegistry: artifacts.noteRegistry,
    noteType: options.noteType,
    title: options.title,
    summary: options.summary,
  });

  if (duplicates.length > 0) {
    throw new Error(
      `Duplicate note candidate exists:\n${duplicates.map((note) => `- ${note.path}`).join("\n")}`,
    );
  }

  const target = buildWriteTargetPath({
    vaultRoot,
    repoSlug: options.repoSlug,
    noteType: options.noteType,
    title: options.title,
  });
  const rendered = renderTypedNoteTemplate({
    noteType: options.noteType,
    repoSlug: options.repoSlug,
    title: options.title,
    summary: options.summary,
    owner: options.owner,
  });

  const output = {
    note_id: rendered.noteId,
    type: options.noteType,
    path: path.relative(repoRoot, target.absolutePath),
    repo_slug: options.repoSlug,
    dry_run: options.dryRun,
    next_step: "Run pnpm rag:index after writing the note.",
  };

  if (options.dryRun) {
    console.log(
      JSON.stringify(
        {
          ...output,
          content_preview: rendered.content,
        },
        null,
        2,
      ),
    );
    return;
  }

  await mkdir(path.dirname(target.absolutePath), { recursive: true });
  await writeFile(target.absolutePath, `${rendered.content}\n`, "utf8");

  console.log(JSON.stringify(output, null, 2));
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
