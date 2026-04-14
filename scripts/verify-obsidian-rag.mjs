import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFile = promisify(execFileCallback);
const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");

function tokenize(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9/._-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function normalize(value) {
  return value.toLowerCase();
}

function scoreDocument(query, doc) {
  const queryTokens = tokenize(query);
  const docTokens = tokenize(doc.searchText);
  const docTokenSet = new Set(docTokens);
  let score = 0;

  for (const token of queryTokens) {
    if (docTokenSet.has(token)) {
      score += 2;
    }

    if (doc.pathTokens.has(token)) {
      score += 3;
    }
  }

  const normalizedQuery = normalize(query);

  if (doc.normalizedText.includes(normalizedQuery)) {
    score += 10;
  }

  if (
    normalizedQuery.includes("decision") &&
    doc.normalizedText.includes("type: repo-decision")
  ) {
    score += 4;
  }

  if (
    normalizedQuery.includes("session") &&
    doc.normalizedText.includes("type: repo-session")
  ) {
    score += 4;
  }

  return score;
}

async function buildIndexedCorpus(vaultPath) {
  const outputDir = path.join(vaultPath, ".rag");

  await execFile(
    "node",
    [
      "tools/rag-index.ts",
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

  const corpus = JSON.parse(
    await readFile(path.join(outputDir, "obsidian-vault.corpus.json"), "utf8"),
  );

  return corpus.chunks.map((chunk) => ({
    path: chunk.source_file.replace(/^vault\//, ""),
    sourcePath: chunk.source_path,
    heading: chunk.heading,
    normalizedText: normalize(`${chunk.source_path}\n${chunk.text}`),
    searchText: `${chunk.source_path}\n${chunk.text}`,
    pathTokens: new Set(tokenize(chunk.source_path)),
  }));
}

function searchCorpus(corpus, query, limit = 5) {
  return corpus
    .map((doc) => ({
      path: doc.path,
      heading: doc.heading,
      sourcePath: doc.sourcePath,
      score: scoreDocument(query, doc),
    }))
    .filter((result) => result.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score || left.path.localeCompare(right.path),
    )
    .slice(0, limit);
}

async function seedVerificationNotes(vaultPath) {
  const notes = [
    {
      relativePath:
        "00 Repositories/playground/01 Architecture/Host Ownership.md",
      content: `---
type: repo-architecture
repo: playground
summary: The host app owns routing, page composition, and page metadata for public and playground routes.
keywords:
  - host routing
  - page composition
  - metadata
related_paths:
  - apps/host/src/application/routes
  - apps/host/src/application/pages
tags:
  - repo/playground
---

# Host Ownership

The host app owns routing and page composition. Remotes mount into host-owned surfaces rather than
defining the site shell or top-level navigation.`,
    },
    {
      relativePath:
        "00 Repositories/playground/02 Decisions/2026-04-08 Narrow MFE Scope.md",
      content: `---
type: repo-decision
repo: playground
decision_id: DEC-001
status: accepted
decided_on: 2026-04-08
summary: Narrow the microfrontend seam so todo-app remains the sole live injected remote.
keywords:
  - todo-app
  - sole live injected remote
  - microfrontend
related_paths:
  - packages/remotes/todo-app
  - packages/remotes/uplink-game
tags:
  - type/decision
  - repo/playground
---

# Narrow MFE Scope

We kept todo-app as the sole live injected remote. Uplink-game was inlined as a host-local
playground surface because the extra mount indirection was not paying for itself.`,
    },
    {
      relativePath:
        "00 Repositories/playground/01 Architecture/Rendering Strategy.md",
      content: `---
type: repo-architecture
repo: playground
summary: Evaluate SSR or pre-rendering for the public host to improve first load and crawler behavior.
keywords:
  - SSR
  - pre-rendering
  - rendering strategy
related_paths:
  - apps/host
tags:
  - type/architecture
  - repo/playground
---

# Rendering Strategy

Track whether the public host should stay CSR, move to selective pre-rendering, or adopt fuller SSR
for metadata and first load quality. Capture a decision note once the direction changes.`,
    },
    {
      relativePath:
        "00 Repositories/playground/03 Sessions/2026-04-10 Route Metadata Pass.md",
      content: `---
type: repo-session
repo: playground
date: 2026-04-10
started_at: 2026-04-10 10:30
summary: Added route-aware metadata coverage across playground routes and kept host route ownership explicit.
keywords:
  - route metadata
  - SEO
  - host route ownership
touched_paths:
  - apps/host/src/application/pages
tags:
  - type/session
  - repo/playground
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
    ["scripts/bootstrap-obsidian-vault.mjs", "--vault", vaultPath, "--force"],
    {
      cwd: repoRoot,
    },
  );
}

async function run() {
  const vaultPath = await mkdtemp(
    path.join(os.tmpdir(), "playground-obsidian-rag-"),
  );
  const checks = [
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

  try {
    await bootstrapVault(vaultPath);
    await seedVerificationNotes(vaultPath);

    const corpus = await buildIndexedCorpus(vaultPath);
    const results = checks.map((check) => {
      const hits = searchCorpus(corpus, check.query, 3);
      const passed = hits.some(
        (hit) =>
          hit.path === check.expectedPath &&
          (!check.expectedHeading || hit.heading === check.expectedHeading),
      );

      return {
        ...check,
        passed,
        hits,
      };
    });

    const failed = results.filter((result) => !result.passed);

    console.log(JSON.stringify({ vaultPath, results }, null, 2));

    if (failed.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await rm(vaultPath, { recursive: true, force: true });
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
