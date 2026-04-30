import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const packageRoot = path.resolve(import.meta.dirname, "..");

async function writeMarkdownFile(filePath, content) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
}

async function buildFixtureVault() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "rag-index-test-"));
  const vaultRoot = path.join(tempRoot, "vault");
  const outputRoot = path.join(tempRoot, "out");

  await writeMarkdownFile(
    path.join(vaultRoot, "00 Repo Home.md"),
    `---
type: repo
repo_slug: playground
status: active
summary: Compact repo home summary.
tags:
  - repo/playground
---

# Playground Home

## What This Repo Is

Repo overview text.
`,
  );

  await writeMarkdownFile(
    path.join(vaultRoot, "04 Tasks/tasks/rebuild-memory.md"),
    `---
type: repo-task
repo: playground
id: rebuild-memory
status: In Progress
summary: Rebuild the memory index.
keywords:
  - memory
  - index
---

# Rebuild Memory

## Outcome

Ship the first typed index slice.
`,
  );

  await writeMarkdownFile(
    path.join(vaultRoot, "specs/rag-rebuild.md"),
    `---
id: mem-20260429-rag-rebuild
type: spec
repo_slug: playground
title: Rebuild RAG memory
status: active
created: 2026-04-29
updated: 2026-04-29
owner: agent
summary: Spec for rebuilding repo memory.
tags:
  - rag
  - memory
keywords:
  - hybrid retrieval
links:
  related:
    - rebuild-memory
  supersedes:
    - legacy-rag-spec
retention:
  review_after: 2026-05-29
  expires_after: null
  keep: true
---

# Rebuild RAG memory

## Plan

Move to a typed multi-index layout.

See [Rebuild Memory](../04 Tasks/tasks/rebuild-memory.md) for the task path.

[[Playground Home]]
`,
  );

  const result = spawnSync(
    "node",
    [
      "--experimental-strip-types",
      "./src/rag-index.ts",
      "--vault",
      vaultRoot,
      "--output-dir",
      outputRoot,
      "--allow-unresolved-links",
      "--json",
    ],
    {
      cwd: packageRoot,
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);

  return {
    outputRoot,
    summary: JSON.parse(result.stdout),
  };
}

test("rag:index emits spec-aligned generated indexes and legacy corpus compatibility", async () => {
  const fixture = await buildFixtureVault();
  const manifest = JSON.parse(
    await readFile(path.join(fixture.outputRoot, "manifest.json"), "utf8"),
  );
  const noteRegistry = JSON.parse(
    await readFile(path.join(fixture.outputRoot, "note-registry.json"), "utf8"),
  );
  const chunkIndex = JSON.parse(
    await readFile(path.join(fixture.outputRoot, "chunk-index.json"), "utf8"),
  );
  const graphIndex = JSON.parse(
    await readFile(path.join(fixture.outputRoot, "graph-index.json"), "utf8"),
  );
  const vectorIndex = JSON.parse(
    await readFile(path.join(fixture.outputRoot, "vector-index.json"), "utf8"),
  );
  const diagnostics = JSON.parse(
    await readFile(path.join(fixture.outputRoot, "diagnostics.json"), "utf8"),
  );
  const corpus = JSON.parse(
    await readFile(
      path.join(fixture.outputRoot, "obsidian-vault.corpus.json"),
      "utf8",
    ),
  );

  assert.equal(manifest.schema_version, 2);
  assert.equal(manifest.notes, 3);
  assert.equal(noteRegistry.length, 3);
  assert.equal(corpus.schema_version, 1);
  assert.ok(chunkIndex.length >= 3);
  assert.ok(chunkIndex.every((chunk) => chunk.tokens_estimated > 0));

  const repoHome = noteRegistry.find((note) => note.path.endsWith("00 Repo Home.md"));
  const todo = noteRegistry.find((note) => note.id === "rebuild-memory");
  const spec = noteRegistry.find(
    (note) => note.id === "mem-20260429-rag-rebuild",
  );

  assert.equal(repoHome.type, "repo-home");
  assert.equal(repoHome.repo_slug, "playground");
  assert.equal(repoHome.validation_status, "warning");
  assert.ok(repoHome.validation_issues.includes("missing_frontmatter_id"));
  assert.equal(todo.type, "todo");
  assert.equal(todo.repo_slug, "playground");
  assert.equal(todo.status, "active");
  assert.equal(todo.validation_status, "warning");
  assert.ok(todo.validation_issues.includes("legacy_type_normalized"));
  assert.ok(todo.validation_issues.includes("legacy_status_normalized"));
  assert.equal(spec.type, "spec");
  assert.equal(spec.repo_slug, "playground");
  assert.equal(spec.validation_status, "warning");
  assert.ok(spec.validation_issues.includes("unresolved_links"));
  assert.deepEqual(
    [...spec.outbound_links].sort(),
    ["legacy-rag-spec", "rebuild-memory"],
  );
  assert.deepEqual(
    spec.chunk_ids,
    chunkIndex
      .filter((chunk) => chunk.note_id === "mem-20260429-rag-rebuild")
      .map((chunk) => chunk.chunk_id),
  );
  assert.ok(
    spec.chunk_ids.every((chunkId) =>
      /^chunk:mem-20260429-rag-rebuild:\d{4}:[0-9a-f]{8}$/.test(chunkId),
    ),
  );
  assert.deepEqual(
    repoHome.chunk_ids,
    chunkIndex
      .filter((chunk) => chunk.note_id === repoHome.id)
      .map((chunk) => chunk.chunk_id),
  );
  assert.ok(
    repoHome.chunk_ids.every((chunkId) =>
      new RegExp(`^chunk:${repoHome.id}:\\d{4}:[0-9a-f]{8}$`).test(chunkId),
    ),
  );

  assert.equal(graphIndex.schema_version, 2);
  assert.equal(vectorIndex.schema_version, 2);
  assert.equal(vectorIndex.status, "ready");
  assert.equal(vectorIndex.engine.name, "deterministic-hash-v1");
  assert.equal(vectorIndex.engine.metric, "cosine");
  assert.equal(vectorIndex.embeddings.length, chunkIndex.length);
  assert.ok(
    vectorIndex.embeddings.every(
      (entry) =>
        typeof entry.chunk_id === "string" &&
        typeof entry.note_id === "string" &&
        entry.values.length === vectorIndex.engine.dimensions,
    ),
  );
  assert.ok(
    graphIndex.edges.some(
      (edge) =>
        edge.from === "mem-20260429-rag-rebuild" &&
        edge.to === "rebuild-memory" &&
        edge.type === "relates_to",
    ),
  );
  assert.ok(
    graphIndex.edges.some(
      (edge) =>
        edge.from === "mem-20260429-rag-rebuild" &&
        edge.to === "rebuild-memory" &&
        edge.type === "references",
    ),
  );
  assert.ok(
    graphIndex.edges.some(
      (edge) =>
        edge.from === "mem-20260429-rag-rebuild" &&
        edge.to === repoHome.id &&
        edge.type === "references",
    ),
  );

  assert.ok(
    diagnostics.synthetic_ids.some((entry) => entry.endsWith("00 Repo Home.md")),
  );
  assert.ok(
    diagnostics.legacy_type_normalizations.some(
      (entry) => entry.from === "repo-task" && entry.to === "todo",
    ),
  );
  assert.ok(
    diagnostics.unresolved_links.some(
      (entry) =>
        entry.from === "mem-20260429-rag-rebuild" &&
        entry.targets.includes("legacy-rag-spec"),
    ),
  );
});

test("rag:index infers canonical nested vault note types when frontmatter type is missing", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "rag-index-nested-type-"));
  const vaultRoot = path.join(tempRoot, "vault");
  const outputRoot = path.join(tempRoot, "out");

  await writeMarkdownFile(
    path.join(
      vaultRoot,
      "00 Repositories/playground/03 Sessions/2026-04-30 Missing Type.md",
    ),
    `---
repo_slug: playground
summary: Missing type frontmatter.
---

# Missing Type

## Summary

Session body.
`,
  );

  const result = spawnSync(
    "node",
    [
      "--experimental-strip-types",
      "./src/rag-index.ts",
      "--vault",
      vaultRoot,
      "--output-dir",
      outputRoot,
      "--json",
    ],
    {
      cwd: packageRoot,
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);

  const noteRegistry = JSON.parse(
    await readFile(path.join(outputRoot, "note-registry.json"), "utf8"),
  );
  const note = noteRegistry[0];

  assert.equal(note.type, "session");
  assert.equal(note.status, "active");
});

test("rag:index keeps sibling H1 sections in separate chunks", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "rag-index-h1-split-"));
  const vaultRoot = path.join(tempRoot, "vault");
  const outputRoot = path.join(tempRoot, "out");

  await writeMarkdownFile(
    path.join(vaultRoot, "specs/multi-h1.md"),
    `---
type: spec
repo_slug: playground
summary: Multi H1.
---

# First

Intro first.

## A

Alpha.

# Second

Second intro.

## B

Beta.
`,
  );

  const result = spawnSync(
    "node",
    [
      "--experimental-strip-types",
      "./src/rag-index.ts",
      "--vault",
      vaultRoot,
      "--output-dir",
      outputRoot,
      "--json",
    ],
    {
      cwd: packageRoot,
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);

  const chunkIndex = JSON.parse(
    await readFile(path.join(outputRoot, "chunk-index.json"), "utf8"),
  );
  const secondChunk = chunkIndex.find((chunk) => chunk.heading === "Second");

  assert.ok(secondChunk);
  assert.match(secondChunk.text, /Second intro\./);
  assert.doesNotMatch(secondChunk.text, /## A/);
  assert.doesNotMatch(secondChunk.text, /Alpha\./);
});

test("rag:index fails when strict frontmatter is invalid", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "rag-index-invalid-frontmatter-"));
  const vaultRoot = path.join(tempRoot, "vault");
  const outputRoot = path.join(tempRoot, "out");

  await writeMarkdownFile(
    path.join(vaultRoot, "specs", "invalid-spec.md"),
    `---
id: "mem-20260430-invalid-spec"
type: "spec"
repo_slug: "playground"
title: "Invalid spec"
status: "accepted"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Invalid status for a spec note."
tags: []
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: null
  expires_after: null
  keep: true
---

# Invalid spec
`,
  );

  const result = spawnSync(
    "node",
    [
      "--experimental-strip-types",
      "./src/rag-index.ts",
      "--vault",
      vaultRoot,
      "--output-dir",
      outputRoot,
      "--json",
    ],
    {
      cwd: packageRoot,
      encoding: "utf8",
    },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr || result.stdout, /frontmatter\.invalid_status_for_type/);
});

test("rag:index fails when duplicate note ids are present", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "rag-index-duplicate-id-"));
  const vaultRoot = path.join(tempRoot, "vault");
  const outputRoot = path.join(tempRoot, "out");

  const duplicateFrontmatter = `---
id: "mem-20260430-duplicate"
type: "spec"
repo_slug: "playground"
title: "Duplicate note"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "A duplicate id note."
tags: []
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: null
  expires_after: null
  keep: true
---

# Duplicate note
`;

  await writeMarkdownFile(
    path.join(vaultRoot, "specs", "duplicate-a.md"),
    duplicateFrontmatter,
  );
  await writeMarkdownFile(
    path.join(vaultRoot, "specs", "duplicate-b.md"),
    duplicateFrontmatter,
  );

  const result = spawnSync(
    "node",
    [
      "--experimental-strip-types",
      "./src/rag-index.ts",
      "--vault",
      vaultRoot,
      "--output-dir",
      outputRoot,
      "--json",
    ],
    {
      cwd: packageRoot,
      encoding: "utf8",
    },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr || result.stdout, /registry\.duplicate_id/);
});

test("rag:index fails when unresolved links are present by default", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "rag-index-unresolved-links-"));
  const vaultRoot = path.join(tempRoot, "vault");
  const outputRoot = path.join(tempRoot, "out");

  await writeMarkdownFile(
    path.join(vaultRoot, "specs", "unresolved-link.md"),
    `---
id: "mem-20260430-unresolved-link"
type: "spec"
repo_slug: "playground"
title: "Spec with unresolved link"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Spec that points to a missing note."
tags: []
keywords: []
links:
  parents: []
  children: []
  related:
    - "mem-20260430-missing"
  supersedes: []
  superseded_by: []
retention:
  review_after: null
  expires_after: null
  keep: true
---

# Unresolved link
`,
  );

  const result = spawnSync(
    "node",
    [
      "--experimental-strip-types",
      "./src/rag-index.ts",
      "--vault",
      vaultRoot,
      "--output-dir",
      outputRoot,
      "--json",
    ],
    {
      cwd: packageRoot,
      encoding: "utf8",
    },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr || result.stdout, /links\.target_missing/);
});

test("rag:index allows unresolved links when explicitly requested", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "rag-index-allow-unresolved-links-"));
  const vaultRoot = path.join(tempRoot, "vault");
  const outputRoot = path.join(tempRoot, "out");

  await writeMarkdownFile(
    path.join(vaultRoot, "specs", "unresolved-link.md"),
    `---
id: "mem-20260430-unresolved-link"
type: "spec"
repo_slug: "playground"
title: "Spec with unresolved link"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "agent"
summary: "Spec that points to a missing note."
tags: []
keywords: []
links:
  parents: []
  children: []
  related:
    - "mem-20260430-missing"
  supersedes: []
  superseded_by: []
retention:
  review_after: null
  expires_after: null
  keep: true
---

# Unresolved link
`,
  );

  const result = spawnSync(
    "node",
    [
      "--experimental-strip-types",
      "./src/rag-index.ts",
      "--vault",
      vaultRoot,
      "--output-dir",
      outputRoot,
      "--allow-unresolved-links",
      "--json",
    ],
    {
      cwd: packageRoot,
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);

  const diagnostics = JSON.parse(
    await readFile(path.join(outputRoot, "diagnostics.json"), "utf8"),
  );

  assert.equal(diagnostics.unresolved_links.length, 1);
  assert.equal(diagnostics.unresolved_links[0].from, "mem-20260430-unresolved-link");
});
