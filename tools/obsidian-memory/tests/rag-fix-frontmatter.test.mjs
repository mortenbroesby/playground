import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const packageRoot = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(packageRoot, "..", "..");

async function createStatusReviewFixture() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "rag-fix-frontmatter-cli-"));
  const vaultRoot = path.join(tempRoot, "vault");
  const repoVaultRoot = path.join(vaultRoot, "00 Repositories", "playground");
  const specNotePath = path.join(repoVaultRoot, "specs", "2026-04-29 Rebuild RAG Memory.md");

  await mkdir(path.dirname(specNotePath), { recursive: true });
  await writeFile(
    specNotePath,
    [
      "---",
      "type: spec",
      "repo: playground",
      "date: 2026-04-29",
      "summary: Rebuild the RAG memory system.",
      "---",
      "",
      "# Rebuild RAG Memory",
    ].join("\n"),
    "utf8",
  );

  return { tempRoot, vaultRoot, specNotePath };
}

test("rag:fix-frontmatter rejects --accept-suggested-status without --apply", () => {
  const result = spawnSync(
    "node",
    [
      path.join(packageRoot, "src", "rag-fix-frontmatter.mjs"),
      "--accept-suggested-status",
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /--accept-suggested-status requires --apply/);
});

test("rag:fix-frontmatter can apply suggested statuses for status-review backlog", async (t) => {
  const fixture = await createStatusReviewFixture();
  t.after(() => rm(fixture.tempRoot, { recursive: true, force: true }));

  const result = spawnSync(
    "node",
    [
      path.join(packageRoot, "src", "rag-fix-frontmatter.mjs"),
      "--vault",
      fixture.vaultRoot,
      "--apply",
      "--status-review-only",
      "--accept-suggested-status",
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status_review_only, true);
  assert.equal(output.accept_suggested_status, true);
  assert.equal(output.applied, 1);
  assert.equal(output.blocked, 1);

  const rewritten = await readFile(fixture.specNotePath, "utf8");
  assert.match(rewritten, /status: "active"/);
  assert.match(rewritten, /repo_slug: "playground"/);
});
