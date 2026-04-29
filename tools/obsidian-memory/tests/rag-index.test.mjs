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
  assert.equal(todo.type, "todo");
  assert.equal(todo.status, "active");
  assert.equal(spec.type, "spec");
  assert.deepEqual(
    [...spec.outbound_links].sort(),
    ["legacy-rag-spec", "rebuild-memory"],
  );

  assert.equal(graphIndex.schema_version, 2);
  assert.ok(
    graphIndex.edges.some(
      (edge) =>
        edge.from === "mem-20260429-rag-rebuild" &&
        edge.to === "rebuild-memory" &&
        edge.type === "relates_to",
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
