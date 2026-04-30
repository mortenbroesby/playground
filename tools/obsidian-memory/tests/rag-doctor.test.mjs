import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  parseArgs,
  runDoctor,
} from "../src/rag-doctor.mjs";

const packageRoot = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(packageRoot, "..", "..");

async function createDoctorFixture({ advisoryOnly = false } = {}) {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "rag-doctor-cli-"));
  const vaultRoot = path.join(tempRoot, "vault");
  const indexRoot = path.join(tempRoot, ".rag");

  await Promise.all([
    mkdir(path.join(vaultRoot, "00 Repositories"), { recursive: true }),
    mkdir(path.join(vaultRoot, "90 Templates"), { recursive: true }),
    mkdir(path.join(vaultRoot, "91 Scripts"), { recursive: true }),
    mkdir(indexRoot, { recursive: true }),
  ]);

  const notePath = advisoryOnly
    ? "vault/03 Sessions/2026-04-29 Typed RAG.md"
    : "vault/specs/spec-1.md";
  const noteType = advisoryOnly ? "session" : "spec";
  const diagnostics = advisoryOnly
    ? {
        synthetic_ids: [notePath],
        unresolved_links: [],
        validation_warnings: [
          `${notePath}: missing frontmatter id; generated mem-1`,
          `${notePath}: missing summary`,
        ],
      }
    : {
        synthetic_ids: [notePath],
        unresolved_links: [{ from: "mem-1", targets: ["missing-note"] }],
        validation_warnings: [
          `${notePath}: missing frontmatter id; generated mem-1`,
        ],
      };
  const noteRegistry = advisoryOnly
    ? [
        {
          id: "mem-1",
          type: noteType,
          path: notePath,
          status: "active",
          title: "Typed RAG",
          summary: "",
          outbound_links: [],
          inbound_links: [],
          created: "2026-04-29",
          updated: "2026-04-29",
        },
      ]
    : [
        {
          id: "mem-1",
          type: noteType,
          path: notePath,
          status: "active",
          title: "Spec 1",
          summary: "Broken spec fixture.",
          outbound_links: ["missing-note"],
          inbound_links: [],
          validation_status: "warning",
          validation_issues: [
            "missing_frontmatter_id",
            "unresolved_links",
          ],
        },
      ];

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
      `${JSON.stringify(noteRegistry)}\n`,
      "utf8",
    ),
    writeFile(
      path.join(indexRoot, "chunk-index.json"),
      `${JSON.stringify([{ note_id: "mem-1", text: "Fixture body" }])}\n`,
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
      `${JSON.stringify(diagnostics)}\n`,
      "utf8",
    ),
    writeFile(path.join(indexRoot, "cleanup-report.json"), "{}\n", "utf8"),
  ]);

  return { tempRoot, vaultRoot, indexRoot };
}

test("parseArgs defaults to repo-root derived doctor paths", () => {
  const options = parseArgs([], { repoRoot: "/tmp/playground-fixture" });

  assert.equal(options.repoRoot, "/tmp/playground-fixture");
  assert.equal(options.vaultRoot, "/tmp/playground-fixture/vault");
  assert.equal(options.indexRoot, "/tmp/playground-fixture/.rag");
});

test("parseArgs honors explicit doctor roots", () => {
  const options = parseArgs(
    ["--vault", "/tmp/custom-vault", "--index-root", "/tmp/custom-index"],
    { repoRoot: "/tmp/playground-fixture" },
  );

  assert.equal(options.vaultRoot, "/tmp/custom-vault");
  assert.equal(options.indexRoot, "/tmp/custom-index");
});

test("runDoctor groups link failures separately from frontmatter advisories", async (t) => {
  const fixture = await createDoctorFixture();
  t.after(() => rm(fixture.tempRoot, { recursive: true, force: true }));

  const result = await runDoctor({
    vaultRoot: fixture.vaultRoot,
    indexRoot: fixture.indexRoot,
    repoRoot: fixture.tempRoot,
  });

  assert.equal(result.passed, false);
  assert.equal(result.checks.link_check.length, 1);
  assert.match(result.checks.link_check[0], /Unresolved links present/);
  assert.equal(result.checks.cleanup_frontmatter_check.blocking.length, 0);
  assert.ok(result.checks.cleanup_frontmatter_check.advisory.length >= 1);
  assert.equal(result.verification_summary.unresolved_links, 1);
  assert.equal(result.verification_summary.synthetic_ids, 1);
});

test("CLI emits doctor JSON and nonzero exit for a broken typed index", async (t) => {
  const fixture = await createDoctorFixture();
  t.after(() => rm(fixture.tempRoot, { recursive: true, force: true }));

  const result = spawnSync(
    "node",
    [
      path.join(packageRoot, "src", "rag-doctor.mjs"),
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
  assert.equal(output.passed, false);
  assert.equal(output.checks.link_check.length, 1);
  assert.equal(output.checks.init_check.length, 0);
  assert.equal(output.verification_summary.unresolved_links, 1);
});

test("CLI keeps advisory-only frontmatter backlog non-blocking", async (t) => {
  const fixture = await createDoctorFixture({ advisoryOnly: true });
  t.after(() => rm(fixture.tempRoot, { recursive: true, force: true }));

  const result = spawnSync(
    "node",
    [
      path.join(packageRoot, "src", "rag-doctor.mjs"),
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
  assert.equal(output.passed, true);
  assert.equal(output.checks.cleanup_frontmatter_check.blocking.length, 0);
  assert.ok(output.checks.cleanup_frontmatter_check.advisory.length >= 1);
});
