import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { findProjectRoot } from "workspace-tools";

import {
  assembleMemoryContext,
  loadMemoryCorpus,
  retrieveMemoryCandidates,
} from "./obsidian-rag.mjs";
import { verifyTypedMemory } from "./rag-governance.mjs";

const execFile = promisify(execFileCallback);
const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = findProjectRoot(path.dirname(scriptPath), "pnpm");
const defaultVaultRoot = path.join(repoRoot, "vault");
const defaultIndexRoot = path.join(repoRoot, ".rag");
const DEFAULT_FIXTURE_CHECKS = [
  {
    query: "Which remote is the sole live injected remote?",
    expectedPath:
      "00 Repositories/playground/02 Decisions/2026-04-08 Narrow MFE Scope.md",
  },
  {
    query: "Who owns routing and page composition?",
    expectedPath:
      "00 Repositories/playground/01 Architecture/Host Ownership.md",
  },
  {
    query: "What context exists about rendering strategy?",
    expectedPath:
      "00 Repositories/playground/01 Architecture/Rendering Strategy.md",
  },
  {
    query: "Where did route metadata work land?",
    expectedPath:
      "00 Repositories/playground/03 Sessions/2026-04-10 Route Metadata Pass.md",
  },
  {
    query: "active focus playground",
    expectedPath: "00 Repositories/playground/00 Repo Home.md",
    expectedHeading: "Active Focus",
  },
];

/**
 * Parse command-line flags for `pnpm rag:verify`.
 */
export function parseArgs(argv, overrides = {}) {
  const resolvedRepoRoot = overrides.repoRoot ?? repoRoot;
  const options = {
    mode: "fast",
    repoRoot: resolvedRepoRoot,
    vaultRoot: path.join(resolvedRepoRoot, "vault"),
    indexRoot: path.join(resolvedRepoRoot, ".rag"),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--full") {
      options.mode = "full";
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
      "  pnpm rag:verify [--full] [--vault <path>] [--index-root <path>]",
      "",
      "Default mode runs fast typed-memory integrity checks against an existing index.",
      "Use --full to add the golden retrieval fixture suite.",
    ].join("\n"),
  );
}

async function buildIndexedCorpus(vaultPath) {
  const outputDir = path.join(vaultPath, ".rag");

  await execFile(
      "node",
      [
      "tools/obsidian-memory/src/rag-index.ts",
      "--force",
      "--json",
      "--vault",
      vaultPath,
      "--output-dir",
      outputDir,
    ],
    {
      cwd: repoRoot,
    },
  );

  return loadMemoryCorpus(outputDir);
}

async function seedVerificationNotes(vaultPath) {
  const notes = [
    {
      relativePath: "00 Repositories/playground/00 Repo Home.md",
      content: `---
id: mem-20260410-playground-home
type: repo-home
repo_slug: playground
title: playground
status: active
created: 2026-04-10
updated: 2026-04-10
owner: morten
summary: Test repo home for typed verification fixtures.
tags:
  - repo/playground
keywords:
  - active focus
  - playground
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: 2026-07-10
  expires_after: null
  keep: true
---

# playground

## Active Focus

Keep the fixture vault small while proving typed verification and retrieval behavior.`,
    },
    {
      relativePath:
        "00 Repositories/playground/01 Architecture/Host Ownership.md",
      content: `---
id: mem-20260410-host-ownership
type: architecture-record
repo_slug: playground
title: Host Ownership
status: accepted
created: 2026-04-10
updated: 2026-04-10
owner: agent
summary: The host app owns routing, page composition, and page metadata for public and playground routes.
keywords:
  - host routing
  - page composition
  - metadata
tags:
  - repo/playground
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: 2026-10-10
  expires_after: null
  keep: true
---

# Host Ownership

The host app owns routing and page composition. Remotes mount into host-owned surfaces rather than
defining the site shell or top-level navigation.`,
    },
    {
      relativePath:
        "00 Repositories/playground/02 Decisions/2026-04-08 Narrow MFE Scope.md",
      content: `---
id: mem-20260408-narrow-mfe-scope
type: architecture-record
repo_slug: playground
title: Narrow MFE Scope
status: accepted
created: 2026-04-08
updated: 2026-04-08
owner: agent
summary: Narrow the microfrontend seam so todo-app remains the sole live injected remote.
keywords:
  - todo-app
  - sole live injected remote
  - microfrontend
tags:
  - type/decision
  - repo/playground
links:
  parents: []
  children: []
  related:
    - mem-20260410-host-ownership
  supersedes: []
  superseded_by: []
retention:
  review_after: 2026-10-08
  expires_after: null
  keep: true
---

# Narrow MFE Scope

We kept todo-app as the sole live injected remote. Uplink-game was inlined as a host-local
playground surface because the extra mount indirection was not paying for itself.`,
    },
    {
      relativePath:
        "00 Repositories/playground/01 Architecture/Rendering Strategy.md",
      content: `---
id: mem-20260410-rendering-strategy
type: investigation
repo_slug: playground
title: Rendering Strategy
status: active
created: 2026-04-10
updated: 2026-04-10
owner: agent
summary: Evaluate SSR or pre-rendering for the public host to improve first load and crawler behavior.
keywords:
  - SSR
  - pre-rendering
  - rendering strategy
tags:
  - type/architecture
  - repo/playground
links:
  parents: []
  children: []
  related:
    - mem-20260410-host-ownership
  supersedes: []
  superseded_by: []
retention:
  review_after: 2026-06-10
  expires_after: 2026-10-10
  keep: false
---

# Rendering Strategy

Track whether the public host should stay CSR, move to selective pre-rendering, or adopt fuller SSR
for metadata and first load quality. Capture a decision note once the direction changes.`,
    },
    {
      relativePath:
        "00 Repositories/playground/03 Sessions/2026-04-10 Route Metadata Pass.md",
      content: `---
id: mem-20260410-route-metadata-pass
type: session
repo_slug: playground
title: Route Metadata Pass
status: active
created: 2026-04-10
updated: 2026-04-10
owner: agent
summary: Added route-aware metadata coverage across playground routes and kept host route ownership explicit.
keywords:
  - route metadata
  - SEO
  - host route ownership
tags:
  - type/session
  - repo/playground
links:
  parents: []
  children: []
  related:
    - mem-20260410-host-ownership
  supersedes: []
  superseded_by: []
retention:
  review_after: 2026-04-24
  expires_after: 2026-10-10
  keep: false
---

# Route Metadata Pass

Verified that playground pages have route-aware metadata and that the host remains the routing
switchboard for public and playground composition.`,
    },
  ];

  await Promise.all(
    notes.map(async (note) => {
      const targetPath = path.join(vaultPath, note.relativePath);
      await mkdir(path.dirname(targetPath), { recursive: true });
      await writeFile(targetPath, note.content, "utf8");
    }),
  );
}

async function bootstrapVault(vaultPath) {
  await execFile(
    "node",
    [
      "tools/obsidian-memory/src/bootstrap-obsidian-vault.mjs",
      "--vault",
      vaultPath,
      "--force",
    ],
    {
      cwd: repoRoot,
    },
  );
}

export async function runFastVerification({
  vaultRoot = defaultVaultRoot,
  indexRoot = defaultIndexRoot,
  repoRoot: targetRepoRoot = repoRoot,
} = {}) {
  const verification = await verifyTypedMemory({
    vaultRoot,
    indexRoot,
    repoRoot: targetRepoRoot,
  });

  return {
    mode: "fast",
    passed: verification.passed,
    verification,
  };
}

export async function runFixtureVerification({
  checks = DEFAULT_FIXTURE_CHECKS,
  repoRoot: targetRepoRoot = repoRoot,
} = {}) {
  const vaultPath = await mkdtemp(
    path.join(os.tmpdir(), "playground-obsidian-rag-"),
  );

  try {
    await bootstrapVault(vaultPath);
    await seedVerificationNotes(vaultPath);

    const corpus = await buildIndexedCorpus(vaultPath);
    const verification = await verifyTypedMemory({
      vaultRoot: vaultPath,
      indexRoot: path.join(vaultPath, ".rag"),
      repoRoot: targetRepoRoot,
    });
    const results = checks.map((check) => {
      const candidates = retrieveMemoryCandidates({
        corpus,
        query: check.query,
        limit: 3,
      });
      const context = assembleMemoryContext({
        query: check.query,
        candidates,
        maxItems: 2,
        tokenBudget: 400,
      });
      const passed = candidates.some(
        (hit) =>
          hit.sourceFile.replace(/^vault\//, "") === check.expectedPath &&
          (!check.expectedHeading || hit.heading === check.expectedHeading),
      );

      return {
        ...check,
        passed,
        hits: candidates.map((candidate) => ({
          path: candidate.sourceFile.replace(/^vault\//, ""),
          heading: candidate.heading,
          sourcePath: candidate.sourcePath,
          score: candidate.score,
          matchReasons: candidate.matchReasons,
        })),
        context: {
          selectedCount: context.selectedCount,
          estimatedTokens: context.estimatedTokens,
          references: context.references,
        },
      };
    });

    const failed = results.filter((result) => !result.passed);

    return {
      passed: failed.length === 0 && verification.passed,
      vaultPath,
      verification,
      results,
      failedCount: failed.length,
    };
  } finally {
    await rm(vaultPath, { recursive: true, force: true });
  }
}

export async function runVerification(options = {}) {
  const fastVerification = await runFastVerification(options);

  if (options.mode !== "full") {
    return fastVerification;
  }

  const fixtureVerification = await runFixtureVerification({
    repoRoot: options.repoRoot,
  });

  return {
    mode: "full",
    passed: fastVerification.passed && fixtureVerification.passed,
    verification: fastVerification.verification,
    retrieval_fixtures: fixtureVerification,
  };
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  const result = await runVerification(options);

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
