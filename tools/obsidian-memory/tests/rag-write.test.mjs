import test from "node:test";
import assert from "node:assert/strict";
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  parseArgs,
  runWrite,
} from "../src/rag-write.mjs";

const packageRoot = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(packageRoot, "..", "..");

async function createWriteFixture({ duplicate = false } = {}) {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "rag-write-"));
  const vaultRoot = path.join(tempRoot, "vault");
  const indexRoot = path.join(tempRoot, ".rag");

  await Promise.all([
    mkdir(path.join(vaultRoot, "00 Repositories"), { recursive: true }),
    mkdir(indexRoot, { recursive: true }),
  ]);

  await Promise.all([
    writeFile(
      path.join(indexRoot, "manifest.json"),
      `${JSON.stringify({ schema_version: 2, source_root: "vault" })}\n`,
      "utf8",
    ),
    writeFile(
      path.join(indexRoot, "note-registry.json"),
      `${JSON.stringify(
        duplicate
          ? [
              {
                id: "mem-existing",
                type: "spec",
                path: "vault/00 Repositories/playground/specs/2026-04-30 Rebuild RAG memory.md",
                title: "Rebuild RAG memory",
                status: "active",
                summary: "Spec for rebuilding repo memory.",
                outbound_links: [],
                inbound_links: [],
              },
            ]
          : [],
      )}\n`,
      "utf8",
    ),
    writeFile(path.join(indexRoot, "chunk-index.json"), "[]\n", "utf8"),
    writeFile(path.join(indexRoot, "lexical-index.json"), "{}\n", "utf8"),
    writeFile(path.join(indexRoot, "vector-index.json"), "{}\n", "utf8"),
    writeFile(
      path.join(indexRoot, "graph-index.json"),
      `${JSON.stringify({ nodes: [], edges: [] })}\n`,
      "utf8",
    ),
    writeFile(
      path.join(indexRoot, "diagnostics.json"),
      `${JSON.stringify({
        synthetic_ids: [],
        unresolved_links: [],
        validation_warnings: [],
      })}\n`,
      "utf8",
    ),
    writeFile(path.join(indexRoot, "cleanup-report.json"), "{}\n", "utf8"),
  ]);

  return { tempRoot, vaultRoot, indexRoot };
}

test("parseArgs defaults rag:write to dry-run", () => {
  const options = parseArgs([], { repoRoot: "/tmp/playground-fixture" });

  assert.equal(options.dryRun, true);
  assert.equal(options.vaultRoot, "/tmp/playground-fixture/vault");
  assert.equal(options.indexRoot, "/tmp/playground-fixture/.rag");
});

test("parseArgs honors --apply and explicit roots", () => {
  const options = parseArgs(
    [
      "--apply",
      "--vault",
      "/tmp/custom-vault",
      "--index-root",
      "/tmp/custom-index",
    ],
    { repoRoot: "/tmp/playground-fixture" },
  );

  assert.equal(options.dryRun, false);
  assert.equal(options.vaultRoot, "/tmp/custom-vault");
  assert.equal(options.indexRoot, "/tmp/custom-index");
});

test("runWrite defaults to preview output without writing files", async (t) => {
  const fixture = await createWriteFixture();
  t.after(() => rm(fixture.tempRoot, { recursive: true, force: true }));

  const originalLog = console.log;
  const messages = [];
  console.log = (value) => messages.push(String(value));

  try {
    await runWrite({
      noteType: "spec",
      title: "Rebuild RAG memory",
      summary: "Spec for rebuilding repo memory.",
      owner: "agent",
      repoSlug: "playground",
      dryRun: true,
      repoRoot: fixture.tempRoot,
      vaultRoot: fixture.vaultRoot,
      indexRoot: fixture.indexRoot,
    });
  } finally {
    console.log = originalLog;
  }

  const output = JSON.parse(messages[0]);
  assert.equal(output.dry_run, true);
  assert.match(output.next_step, /rerun with --apply/);
  assert.match(output.content_preview, /summary: "Spec for rebuilding repo memory\."/);

  const targetPath = path.join(
    fixture.vaultRoot,
    "00 Repositories/playground/specs/2026-04-30 Rebuild RAG memory.md",
  );
  await assert.rejects(access(targetPath));
});

test("CLI writes note only when --apply is passed", async (t) => {
  const fixture = await createWriteFixture();
  t.after(() => rm(fixture.tempRoot, { recursive: true, force: true }));

  const result = spawnSync(
    "node",
    [
      path.join(packageRoot, "src", "rag-write.mjs"),
      "--apply",
      "--vault",
      fixture.vaultRoot,
      "--index-root",
      fixture.indexRoot,
      "--type",
      "spec",
      "--title",
      "Rebuild RAG memory",
      "--summary",
      "Spec for rebuilding repo memory.",
      "--owner",
      "agent",
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.dry_run, false);
  assert.match(output.next_step, /Run pnpm rag:index/);

  const targetPath = path.join(
    fixture.vaultRoot,
    "00 Repositories/playground/specs/2026-04-30 Rebuild RAG memory.md",
  );
  const fileContents = await readFile(targetPath, "utf8");
  assert.match(fileContents, /summary: "Spec for rebuilding repo memory\."/);
  assert.match(fileContents, /## Goal/);
});

test("CLI rejects duplicate write candidates before writing", async (t) => {
  const fixture = await createWriteFixture({ duplicate: true });
  t.after(() => rm(fixture.tempRoot, { recursive: true, force: true }));

  const result = spawnSync(
    "node",
    [
      path.join(packageRoot, "src", "rag-write.mjs"),
      "--vault",
      fixture.vaultRoot,
      "--index-root",
      fixture.indexRoot,
      "--type",
      "spec",
      "--title",
      "Rebuild RAG memory",
      "--summary",
      "Spec for rebuilding repo memory.",
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Duplicate note candidate exists/);
});
