#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { findProjectRoot } from "workspace-tools";

import { fixFrontmatter } from "./rag-governance.mjs";

const repoRoot = findProjectRoot(path.dirname(fileURLToPath(import.meta.url)), "pnpm");
const defaultVaultRoot = path.join(repoRoot, "vault");

/**
 * Parse command-line flags for the frontmatter remediation CLI.
 */
function parseArgs(argv) {
  const options = {
    apply: false,
    acceptSuggestedStatus: false,
    includeContentPreview: false,
    limit: null,
    pathPrefix: "",
    repoSlug: "playground",
    statusReviewOnly: false,
    vaultRoot: defaultVaultRoot,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--apply") {
      options.apply = true;
      continue;
    }

    if (arg === "--accept-suggested-status") {
      options.acceptSuggestedStatus = true;
      continue;
    }

    if (arg === "--path-prefix") {
      options.pathPrefix = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--vault") {
      options.vaultRoot = path.resolve(process.cwd(), argv[index + 1] ?? "");
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

    if (arg === "--status-review-only") {
      options.statusReviewOnly = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }
  }

  return options;
}

/**
 * Print usage for `pnpm rag:fix-frontmatter`.
 */
function printUsage() {
  console.log(
    [
      "Usage:",
      "  pnpm rag:fix-frontmatter",
      "  pnpm rag:fix-frontmatter --vault /tmp/vault",
      "  pnpm rag:fix-frontmatter --path-prefix '03 Sessions' --limit 10",
      "  pnpm rag:fix-frontmatter --apply",
      "  pnpm rag:fix-frontmatter --status-review-only",
      "  pnpm rag:fix-frontmatter --apply --status-review-only --accept-suggested-status",
      "",
      "Normalize existing repo memory frontmatter into the typed schema.",
      "Dry-run is the default; pass --apply to rewrite note metadata in place.",
      "Use --path-prefix and --limit to batch the migration.",
      "Use --include-content when you want the rewritten frontmatter preview.",
      "Use --status-review-only to target only notes blocked on status review.",
      "Use --accept-suggested-status with --apply to explicitly accept those suggested statuses.",
    ].join("\n"),
  );
}

/**
 * Run the frontmatter remediation CLI and print the migration report as JSON.
 */
async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.acceptSuggestedStatus && !options.apply) {
    throw new Error("--accept-suggested-status requires --apply");
  }
  const result = await fixFrontmatter({
    vaultRoot: options.vaultRoot,
    repoSlug: options.repoSlug,
    apply: options.apply,
    pathPrefix: options.pathPrefix,
    limit: options.limit,
    includeContentPreview: options.includeContentPreview,
    statusReviewOnly: options.statusReviewOnly,
    acceptSuggestedStatus: options.acceptSuggestedStatus,
  });

  console.log(JSON.stringify(result, null, 2));
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
