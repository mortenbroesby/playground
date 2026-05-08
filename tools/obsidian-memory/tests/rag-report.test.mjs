import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { parseArgs, runReport } from "../src/rag-report.mjs";

const packageRoot = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(packageRoot, "..", "..");

async function createReportFixture() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "rag-report-cli-"));
  const indexRoot = path.join(tempRoot, ".rag");

  await mkdir(indexRoot, { recursive: true });
  await writeFile(
    path.join(indexRoot, "retrieval-events.jsonl"),
    [
      JSON.stringify({
        timestamp: "2026-05-07T08:00:00.000Z",
        tool: "memory_search",
        query: "routing guidance",
        results: [
          {
            rank: 1,
            chunkId: "semantic-shell",
            noteId: "note-semantic",
            sourcePath: "vault/arch/semantic.md § Overview",
            sourceFile: "vault/arch/semantic.md",
            heading: "Overview",
            score: 0.82,
            weakUse: true,
            strongUse: false,
            retrievalSources: ["vector"],
          },
          {
            rank: 2,
            chunkId: "routing-reference",
            noteId: "note-routing",
            sourcePath: "vault/specs/routing.md § Plan",
            sourceFile: "vault/specs/routing.md",
            heading: "Plan",
            score: 0.79,
            weakUse: true,
            strongUse: false,
            retrievalSources: ["lexical", "vector"],
          },
        ],
      }),
      JSON.stringify({
        timestamp: "2026-05-07T08:00:03.000Z",
        tool: "memory_unfold",
        target: {
          chunkId: "routing-reference",
          noteId: "note-routing",
          sourcePath: "vault/specs/routing.md § Plan",
          sourceFile: "vault/specs/routing.md",
          heading: "Plan",
          strongUse: true,
        },
      }),
      JSON.stringify({
        timestamp: "2026-05-07T08:01:00.000Z",
        tool: "memory_search",
        query: "stale task cleanup",
        results: [
          {
            rank: 1,
            chunkId: "semantic-cleanup",
            noteId: "note-cleanup",
            sourcePath: "vault/tasks/cleanup.md § Summary",
            sourceFile: "vault/tasks/cleanup.md",
            heading: "Summary",
            score: 0.63,
            weakUse: true,
            strongUse: false,
            retrievalSources: ["vector"],
          },
          {
            rank: 2,
            chunkId: "cleanup-checklist",
            noteId: "note-checklist",
            sourcePath: "vault/tasks/checklist.md § Checklist",
            sourceFile: "vault/tasks/checklist.md",
            heading: "Checklist",
            score: 0.58,
            weakUse: true,
            strongUse: false,
            retrievalSources: ["lexical"],
          },
        ],
      }),
      JSON.stringify({
        timestamp: "2026-05-07T08:02:00.000Z",
        tool: "memory_context",
        repoSlug: "playground",
        results: [
          {
            rank: 1,
            chunkId: "repo-home",
            noteId: "repo-home",
            sourcePath: "vault/00 Repositories/playground/00 Repo Home.md § Active Focus",
            sourceFile: "vault/00 Repositories/playground/00 Repo Home.md",
            heading: "Active Focus",
            score: 0.51,
            weakUse: true,
            strongUse: false,
            retrievalSources: ["lexical"],
          },
        ],
      }),
    ].join("\n") + "\n",
    "utf8",
  );

  return { tempRoot, indexRoot };
}

test("parseArgs defaults to repo-root derived report paths", () => {
  const options = parseArgs([], { repoRoot: "/tmp/playground-fixture" });

  assert.equal(options.repoRoot, "/tmp/playground-fixture");
  assert.equal(options.indexRoot, "/tmp/playground-fixture/.rag");
  assert.equal(options.eventLogPath, "/tmp/playground-fixture/.rag/retrieval-events.jsonl");
});

test("runReport groups weak-only queries, lower-rank strong use, and semantic-only false positives", async (t) => {
  const fixture = await createReportFixture();
  t.after(() => rm(fixture.tempRoot, { recursive: true, force: true }));

  const report = await runReport({
    repoRoot: fixture.tempRoot,
    indexRoot: fixture.indexRoot,
  });

  assert.equal(report.summary.totalEvents, 4);
  assert.equal(report.summary.searchEvents, 2);
  assert.equal(report.summary.contextEvents, 1);
  assert.equal(report.summary.unfoldEvents, 1);
  assert.equal(report.summary.queries, 2);
  assert.equal(report.summary.onlyWeakUseQueries, 1);
  assert.equal(report.summary.strongUseFromLowerRank, 1);
  assert.equal(report.summary.semanticOnlyFalsePositives, 2);

  assert.deepEqual(report.buckets.onlyWeakUseQueries, [
    {
      query: "stale task cleanup",
      weakResultCount: 2,
      topRank: 1,
      topChunkId: "semantic-cleanup",
      topSourcePath: "vault/tasks/cleanup.md § Summary",
      vectorOnlyRanks: [1],
    },
  ]);
  assert.deepEqual(report.buckets.strongUseFromLowerRank, [
    {
      query: "routing guidance",
      selectedRank: 2,
      selectedChunkId: "routing-reference",
      selectedSourcePath: "vault/specs/routing.md § Plan",
      topRankedChunkId: "semantic-shell",
      topRankedSourcePath: "vault/arch/semantic.md § Overview",
    },
  ]);
  assert.deepEqual(report.buckets.semanticOnlyFalsePositives, [
    {
      query: "routing guidance",
      rank: 1,
      chunkId: "semantic-shell",
      sourcePath: "vault/arch/semantic.md § Overview",
      retrievalSources: ["vector"],
      reason: "top_rank_but_lower_rank_won",
    },
    {
      query: "stale task cleanup",
      rank: 1,
      chunkId: "semantic-cleanup",
      sourcePath: "vault/tasks/cleanup.md § Summary",
      retrievalSources: ["vector"],
      reason: "only_weak_use_query",
    },
  ]);
});

test("CLI emits report JSON for retrieval-events fixtures", async (t) => {
  const fixture = await createReportFixture();
  t.after(() => rm(fixture.tempRoot, { recursive: true, force: true }));

  const result = spawnSync(
    "node",
    [
      path.join(packageRoot, "src", "rag-report.mjs"),
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
  assert.equal(output.summary.onlyWeakUseQueries, 1);
  assert.equal(output.summary.strongUseFromLowerRank, 1);
  assert.equal(output.summary.semanticOnlyFalsePositives, 2);
});
