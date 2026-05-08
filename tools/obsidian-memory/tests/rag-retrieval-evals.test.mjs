import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  parseArgs,
  runRetrievalEvals,
} from "../src/rag-retrieval-evals.mjs";

const packageRoot = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(packageRoot, "..", "..");

test("parseArgs defaults to the full judged retrieval suite", () => {
  const options = parseArgs([]);

  assert.equal(options.format, "json");
  assert.equal(options.caseId, null);
});

test("runRetrievalEvals reports representative judged query coverage across retrieval modes", async () => {
  const result = await runRetrievalEvals();

  assert.equal(result.passed, true);
  assert.deepEqual(result.summary, {
    total: 4,
    passed: 4,
    failed: 0,
    retrievalModes: {
      default: 3,
      quality: 1,
    },
  });

  const implementationCase = result.results.find((entry) => entry.id === "implementation-spec");
  assert.equal(implementationCase.topChunkId, "spec-plan");
  assert.equal(implementationCase.topSourcePath.includes("rag-rebuild.md"), true);

  const lexicalCase = result.results.find((entry) => entry.id === "lexical-shell-navigation");
  assert.equal(lexicalCase.topChunkId, "decision-routing");
  assert.ok(lexicalCase.topMatchReasons.includes("source:lexical"));

  const defaultRoutingCase = result.results.find((entry) => entry.id === "routing-guidance-default");
  const qualityRoutingCase = result.results.find((entry) => entry.id === "routing-guidance-quality");

  assert.equal(defaultRoutingCase.topChunkId, "routing-reference");
  assert.equal(qualityRoutingCase.topChunkId, "routing-reference");
  assert.ok(
    qualityRoutingCase.retrieval.candidatePool > defaultRoutingCase.retrieval.candidatePool,
  );
  assert.ok(defaultRoutingCase.hitChunkIds.includes("semantic-shell"));
  assert.ok(
    defaultRoutingCase.hitChunkIds.indexOf("semantic-shell") >
      defaultRoutingCase.hitChunkIds.indexOf("routing-reference"),
  );
});

test("CLI emits judged retrieval eval JSON", () => {
  const result = spawnSync(
    "node",
    [path.join(packageRoot, "src", "rag-retrieval-evals.mjs")],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);

  assert.equal(output.passed, true);
  assert.equal(output.summary.total, 4);
});
