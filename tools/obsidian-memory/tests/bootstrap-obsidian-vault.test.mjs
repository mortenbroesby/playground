import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const packageRoot = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(packageRoot, "..", "..");

test("bootstrap vault seeds a typed repo-home note without synthetic ids", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "obsidian-bootstrap-"));
  const vaultRoot = path.join(tempRoot, "vault");
  const outputRoot = path.join(tempRoot, ".rag");

  await mkdir(vaultRoot, { recursive: true });

  const bootstrapResult = spawnSync(
    "node",
    [
      path.join(packageRoot, "src", "bootstrap-obsidian-vault.mjs"),
      "--vault",
      vaultRoot,
      "--repo-slug",
      "playground",
      "--force",
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );

  assert.equal(bootstrapResult.status, 0, bootstrapResult.stderr || bootstrapResult.stdout);

  const indexResult = spawnSync(
    "node",
    [
      "--experimental-strip-types",
      path.join(packageRoot, "src", "rag-index.ts"),
      "--vault",
      vaultRoot,
      "--output-dir",
      outputRoot,
      "--force",
      "--json",
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );

  assert.equal(indexResult.status, 0, indexResult.stderr || indexResult.stdout);

  const repoHomePath = path.join(
    vaultRoot,
    "00 Repositories",
    "playground",
    "00 Repo Home.md",
  );
  const repoHome = await readFile(repoHomePath, "utf8");
  const diagnostics = JSON.parse(
    await readFile(path.join(outputRoot, "diagnostics.json"), "utf8"),
  );

  assert.match(repoHome, /^id: mem-\d{8}-playground-home$/m);
  assert.match(repoHome, /^type: repo-home$/m);
  assert.match(repoHome, /^title: playground$/m);
  assert.deepEqual(diagnostics.synthetic_ids, []);
});
