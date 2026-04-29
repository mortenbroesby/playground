#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { findProjectRoot } from "workspace-tools";

import { fixFrontmatter } from "./rag-governance.mjs";

const repoRoot = findProjectRoot(path.dirname(fileURLToPath(import.meta.url)), "pnpm");
const vaultRoot = path.join(repoRoot, "vault");

function parseArgs(argv) {
  const options = {
    apply: false,
    includeContentPreview: false,
    limit: null,
    pathPrefix: "",
    repoSlug: "playground",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--apply") {
      options.apply = true;
      continue;
    }

    if (arg === "--path-prefix") {
      options.pathPrefix = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--limit") {
      const rawLimit = argv[index + 1] ?? "";
      const parsedLimit = Number.parseInt(rawLimit, 10);

      if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
        throw new Error("--limit must be a positive integer");
      }

      options.limit = parsedLimit;
      index += 1;
      continue;
    }

    if (arg === "--include-content") {
      options.includeContentPreview = true;
      continue;
    }

    if (arg === "--repo-slug") {
      options.repoSlug = argv[index + 1] ?? options.repoSlug;
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
      "  pnpm rag:fix-frontmatter",
      "  pnpm rag:fix-frontmatter --path-prefix '03 Sessions' --limit 10",
      "  pnpm rag:fix-frontmatter --apply",
      "",
      "Normalize existing repo memory frontmatter into the typed schema.",
      "Dry-run is the default; pass --apply to rewrite note metadata in place.",
      "Use --path-prefix and --limit to batch the migration.",
      "Use --include-content when you want the rewritten frontmatter preview.",
    ].join("\n"),
  );
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  const result = await fixFrontmatter({
    vaultRoot,
    repoSlug: options.repoSlug,
    apply: options.apply,
    pathPrefix: options.pathPrefix,
    limit: options.limit,
    includeContentPreview: options.includeContentPreview,
  });

  console.log(JSON.stringify(result, null, 2));
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
