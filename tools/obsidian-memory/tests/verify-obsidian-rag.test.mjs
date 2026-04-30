import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  parseArgs,
  runVerification,
} from "../src/verify-obsidian-rag.mjs";

const packageRoot = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(packageRoot, "..", "..");

async function createPassingTypedMemoryFixture() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "verify-obsidian-rag-"));
  const vaultRoot = path.join(tempRoot, "vault");
  const indexRoot = path.join(tempRoot, ".rag");

  await Promise.all([
    mkdir(path.join(vaultRoot, "00 Repositories"), { recursive: true }),
    mkdir(path.join(vaultRoot, "90 Templates"), { recursive: true }),
    mkdir(path.join(vaultRoot, "91 Scripts"), { recursive: true }),
    mkdir(indexRoot, { recursive: true }),
  ]);

  await Promise.all([
    writeFile(path.join(tempRoot, ".gitignore"), ".rag/\n", "utf8"),
    writeFile(
      path.join(indexRoot, "manifest.json"),
      `${JSON.stringify({
        schema_version: 2,
        source_root: "vault",
      })}\n`,
      "utf8",
    ),
    writeFile(
      path.join(indexRoot, "note-registry.json"),
      `${JSON.stringify([
        {
          id: "spec-1",
          type: "spec",
          path: "vault/specs/spec-1.md",
          title: "Spec 1",
          status: "active",
          summary: "Healthy typed memory note.",
          outbound_links: [],
          inbound_links: [],
          validation_issues: [],
        },
      ])}\n`,
      "utf8",
    ),
    writeFile(
      path.join(indexRoot, "chunk-index.json"),
      `${JSON.stringify([
        {
          chunk_id: "chunk:spec-1:0000:aaaaaaaa",
          note_id: "spec-1",
          source_path: "vault/specs/spec-1.md § Plan",
          heading: "Plan",
          heading_level: 2,
          text: "Healthy typed memory retrieval plan.",
          summary: "Healthy retrieval plan.",
          tokens_estimated: 8,
          content_hash: "chunk-hash",
          type: "spec",
          status: "active",
        },
      ])}\n`,
      "utf8",
    ),
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

async function createBrokenTypedMemoryFixture() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "verify-obsidian-rag-broken-"));
  const vaultRoot = path.join(tempRoot, "vault");
  const indexRoot = path.join(tempRoot, ".rag");

  await Promise.all([
    mkdir(path.join(vaultRoot, "00 Repositories"), { recursive: true }),
    mkdir(path.join(vaultRoot, "90 Templates"), { recursive: true }),
    mkdir(path.join(vaultRoot, "91 Scripts"), { recursive: true }),
    mkdir(indexRoot, { recursive: true }),
  ]);

  await Promise.all([
    writeFile(path.join(tempRoot, ".gitignore"), ".rag/\n", "utf8"),
    writeFile(
      path.join(indexRoot, "manifest.json"),
      `${JSON.stringify({
        schema_version: 2,
        source_root: "vault",
      })}\n`,
      "utf8",
    ),
    writeFile(
      path.join(indexRoot, "note-registry.json"),
      `${JSON.stringify([
        {
          id: "spec-1",
          type: "spec",
          path: "vault/specs/spec-1.md",
          title: "Broken Spec",
          status: "active",
          summary: "Broken typed memory note.",
          outbound_links: ["missing-note"],
          inbound_links: [],
          validation_status: "warning",
          validation_issues: ["missing_frontmatter_id", "unresolved_links"],
        },
      ])}\n`,
      "utf8",
    ),
    writeFile(
      path.join(indexRoot, "chunk-index.json"),
      `${JSON.stringify([
        {
          chunk_id: "chunk:spec-1:0000:aaaaaaaa",
          note_id: "spec-1",
          source_path: "vault/specs/spec-1.md § Plan",
          heading: "Plan",
          heading_level: 2,
          text: "Broken typed memory retrieval plan.",
          summary: "Broken retrieval plan.",
          tokens_estimated: 8,
          content_hash: "chunk-hash",
          type: "spec",
          status: "active",
        },
      ])}\n`,
      "utf8",
    ),
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

test("parseArgs defaults to fast mode with repo-root derived paths", () => {
  const options = parseArgs([], { repoRoot: "/tmp/playground-fixture" });

  assert.equal(options.mode, "fast");
  assert.equal(options.repoRoot, "/tmp/playground-fixture");
  assert.equal(options.vaultRoot, "/tmp/playground-fixture/vault");
  assert.equal(options.indexRoot, "/tmp/playground-fixture/.rag");
});

test("parseArgs switches to full mode and honors explicit roots", () => {
  const options = parseArgs(
    [
      "--full",
      "--vault",
      "/tmp/custom-vault",
      "--index-root",
      "/tmp/custom-index",
    ],
    { repoRoot: "/tmp/playground-fixture" },
  );

  assert.equal(options.mode, "full");
  assert.equal(options.vaultRoot, "/tmp/custom-vault");
  assert.equal(options.indexRoot, "/tmp/custom-index");
});

test("runVerification returns fast-mode output without retrieval fixtures by default", async (t) => {
  const fixture = await createPassingTypedMemoryFixture();
  t.after(() => rm(fixture.tempRoot, { recursive: true, force: true }));

  const result = await runVerification({
    vaultRoot: fixture.vaultRoot,
    indexRoot: fixture.indexRoot,
    repoRoot: fixture.tempRoot,
  });

  assert.equal(result.mode, "fast");
  assert.equal(result.passed, true);
  assert.equal("retrieval_fixtures" in result, false);
  assert.deepEqual(result.verification.errors, []);
  assert.deepEqual(result.verification.warnings, []);
  assert.deepEqual(result.verification.summary, {
    notes: 1,
    chunks: 1,
    unresolved_links: 0,
    synthetic_ids: 0,
  });
});

test("runVerification adds retrieval fixture results in full mode", async (t) => {
  const fixture = await createPassingTypedMemoryFixture();
  t.after(() => rm(fixture.tempRoot, { recursive: true, force: true }));

  const result = await runVerification({
    mode: "full",
    vaultRoot: fixture.vaultRoot,
    indexRoot: fixture.indexRoot,
    repoRoot: fixture.tempRoot,
  });

  assert.equal(result.mode, "full");
  assert.equal(result.passed, true);
  assert.equal(result.verification.passed, true);
  assert.equal(result.retrieval_fixtures.passed, true);
  assert.equal(result.retrieval_fixtures.failedCount, 0);
  assert.equal(result.retrieval_fixtures.results.length, 5);

  const firstFixture = result.retrieval_fixtures.results[0];
  assert.equal(typeof firstFixture.query, "string");
  assert.equal(firstFixture.passed, true);
  assert.ok(firstFixture.hits.length >= 1);
  assert.equal(typeof firstFixture.hits[0].path, "string");
  assert.ok(Array.isArray(firstFixture.hits[0].matchReasons));
  assert.equal(typeof firstFixture.context.selectedCount, "number");
  assert.ok(Array.isArray(firstFixture.context.references));
});

test("runVerification reports failed fast verification for a broken typed index", async (t) => {
  const fixture = await createBrokenTypedMemoryFixture();
  t.after(() => rm(fixture.tempRoot, { recursive: true, force: true }));

  const result = await runVerification({
    vaultRoot: fixture.vaultRoot,
    indexRoot: fixture.indexRoot,
    repoRoot: fixture.tempRoot,
  });

  assert.equal(result.mode, "fast");
  assert.equal(result.passed, false);
  assert.equal(result.verification.passed, false);
  assert.ok(result.verification.errors.some((error) => error.startsWith("Unresolved links present")));
  assert.equal(result.verification.summary.unresolved_links, 1);
  assert.equal(result.verification.summary.synthetic_ids, 1);
});

test("CLI emits fast-mode JSON shape without requiring full retrieval fixtures", async (t) => {
  const fixture = await createPassingTypedMemoryFixture();
  t.after(() => rm(fixture.tempRoot, { recursive: true, force: true }));

  const result = spawnSync(
    "node",
    [
      path.join(packageRoot, "src", "verify-obsidian-rag.mjs"),
      "--vault",
      fixture.vaultRoot,
      "--index-root",
      fixture.indexRoot,
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);

  const output = JSON.parse(result.stdout);
  assert.equal(output.mode, "fast");
  assert.equal(output.passed, true);
  assert.equal(typeof output.verification.passed, "boolean");
  assert.equal(typeof output.verification.summary.notes, "number");
  assert.equal("retrieval_fixtures" in output, false);
});

test("CLI emits fast-mode failure JSON and exits nonzero for a broken typed index", async (t) => {
  const fixture = await createBrokenTypedMemoryFixture();
  t.after(() => rm(fixture.tempRoot, { recursive: true, force: true }));

  const result = spawnSync(
    "node",
    [
      path.join(packageRoot, "src", "verify-obsidian-rag.mjs"),
      "--vault",
      fixture.vaultRoot,
      "--index-root",
      fixture.indexRoot,
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 1, result.stderr || result.stdout);

  const output = JSON.parse(result.stdout);
  assert.equal(output.mode, "fast");
  assert.equal(output.passed, false);
  assert.equal(output.verification.passed, false);
  assert.ok(output.verification.errors.some((error) => error.startsWith("Unresolved links present")));
  assert.equal(output.verification.summary.unresolved_links, 1);
  assert.equal("retrieval_fixtures" in output, false);
});
