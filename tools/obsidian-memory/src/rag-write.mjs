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
const defaultVaultRoot = path.join(repoRoot, "vault");
const defaultIndexRoot = path.join(repoRoot, ".rag");

export function parseArgs(argv, overrides = {}) {
  const resolvedRepoRoot = overrides.repoRoot ?? repoRoot;
  const options = {
    noteType: "",
    title: "",
    summary: "",
    owner: "",
    repoSlug: "playground",
    dryRun: true,
    repoRoot: resolvedRepoRoot,
    vaultRoot: path.join(resolvedRepoRoot, "vault"),
    indexRoot: path.join(resolvedRepoRoot, ".rag"),
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

    if (arg === "--apply") {
      options.dryRun = false;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

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
      '  pnpm rag:write --type spec --title "Rebuild RAG memory" --summary "Spec for rebuilding repo memory."',
      '  pnpm rag:write --apply --type spec --title "Rebuild RAG memory" --summary "Spec for rebuilding repo memory."',
      "",
      "Dry-run is the default; pass --apply to create a typed memory note in the spec-defined folder layout.",
    ].join("\n"),
  );
}

export async function runWrite(options) {
  validateWriteInput({
    noteType: options.noteType,
    title: options.title,
    summary: options.summary,
  });

  const artifacts = await loadTypedMemoryArtifacts(options.indexRoot ?? defaultIndexRoot);
  const duplicates = findWriteDuplicates({
    noteRegistry: artifacts.noteRegistry,
    noteType: options.noteType,
    title: options.title,
    summary: options.summary,
  });

  if (duplicates.exact.length > 0) {
    throw new Error(
      `Exact duplicate note candidate exists:\n${duplicates.exact.map((note) => `- ${note.path}`).join("\n")}`,
    );
  }

  const target = buildWriteTargetPath({
    vaultRoot: options.vaultRoot ?? defaultVaultRoot,
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
    path: path.relative(options.repoRoot ?? repoRoot, target.absolutePath),
    repo_slug: options.repoSlug,
    dry_run: options.dryRun,
    duplicate_proposals: duplicates.heuristic,
    next_step: options.dryRun
      ? "Review the preview, then rerun with --apply to create the note."
      : "Run pnpm rag:index after writing the note.",
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

async function run() {
  const options = parseArgs(process.argv.slice(2));
  await runWrite(options);
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
