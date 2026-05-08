# Obsidian Memory Retrieval Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add retrieval observability to `tools/obsidian-memory`, replace heuristic lexical ranking with a BM25-style field-aware lexical ranker, and introduce safer default-vs-quality retrieval modes without discarding the existing typed memory architecture.

**Architecture:** Keep `rag-index.ts` as the artifact producer and `obsidian-rag.mjs` as the retrieval orchestrator, but add a dedicated retrieval-observability module plus explicit retrieval-mode handling. Implement the work in phases: telemetry first, then lexical-index/ranker changes, then weighted fusion and quality mode, then judged-query verification grounded in observed usage.

**Tech Stack:** Node.js, `pnpm`, existing typed memory artifacts under `.rag/`, Node test runner, repo-local JSON artifacts/logs, `tools/obsidian-memory` retrieval modules.

---

## File Structure

- Modify: [tools/obsidian-memory/src/mcp-memory-service.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/src/mcp-memory-service.mjs)
  - Thread retrieval-mode and telemetry emission through `memory_search`, `memory_context`, and `memory_unfold`.
- Modify: [tools/obsidian-memory/src/mcp-server-core.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/src/mcp-server-core.mjs)
  - Expose any new retrieval-mode/tool arguments needed on the MCP surface.
- Modify: [tools/obsidian-memory/src/rag-query.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/src/rag-query.mjs)
  - Keep the CLI aligned with new retrieval modes and telemetry-friendly output.
- Modify: [tools/obsidian-memory/src/obsidian-rag.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/src/obsidian-rag.mjs)
  - Replace heuristic lexical scoring, add weighted fusion, and add quality-mode routing.
- Modify: [tools/obsidian-memory/src/rag-index.ts](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/src/rag-index.ts)
  - Expand `lexical-index.json` so it supports BM25/BM25F-style ranking.
- Create: [tools/obsidian-memory/src/retrieval-observability.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/src/retrieval-observability.mjs)
  - Own append-only event logging, weak/strong usage tracking, and reporting helpers.
- Create: [tools/obsidian-memory/src/rag-report.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/src/rag-report.mjs)
  - Provide a small CLI/report surface over telemetry events.
- Modify: [tools/obsidian-memory/package.json](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/package.json)
  - Add scripts for the report surface if needed.
- Modify: [tools/obsidian-memory/tests/obsidian-rag.test.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/tests/obsidian-rag.test.mjs)
  - Add ranking and mode tests.
- Modify: [tools/obsidian-memory/tests/query-surface.test.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/tests/query-surface.test.mjs)
  - Add telemetry and retrieval-mode surface tests.
- Create if needed: [tools/obsidian-memory/tests/retrieval-observability.test.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/tests/retrieval-observability.test.mjs)
  - Verify event logging and weak/strong use aggregation.
- Create later in the implementation: [tools/obsidian-memory/tests/retrieval-evals.test.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/tests/retrieval-evals.test.mjs)
  - Lock down representative judged queries once the first observed-query set exists.

## Task 1: Add Retrieval Observability Plumbing

**Files:**
- Create: [tools/obsidian-memory/src/retrieval-observability.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/src/retrieval-observability.mjs)
- Modify: [tools/obsidian-memory/src/mcp-memory-service.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/src/mcp-memory-service.mjs)
- Modify: [tools/obsidian-memory/tests/query-surface.test.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/tests/query-surface.test.mjs)
- Test: [tools/obsidian-memory/tests/retrieval-observability.test.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/tests/retrieval-observability.test.mjs)

- [ ] **Step 1: Write the failing observability test**

Add a test that performs `memory_search`, then `memory_unfold`, and asserts that:

```js
assert.equal(events.length, 2);
assert.equal(events[0].tool, "memory_search");
assert.equal(events[0].results[0].weakUse, true);
assert.equal(events[0].results[0].strongUse, false);
assert.equal(events[1].tool, "memory_unfold");
assert.equal(events[1].target.sourcePath, sourcePath);
```

- [ ] **Step 2: Run the new test to verify it fails**

Run:

```bash
pnpm --filter @playground/obsidian-memory rag:test -- --test-name-pattern "logs weak and strong retrieval use signals"
```

Expected: FAIL because no retrieval observability module exists yet.

- [ ] **Step 3: Implement append-only retrieval event logging**

Create a small helper shaped roughly like:

```js
export function createRetrievalObservability(options = {}) {
  return {
    async logSearch(event) {},
    async logContext(event) {},
    async logUnfold(event) {},
    async readEvents() {},
  };
}
```

Store repo-local JSONL events under a deterministic path such as `.rag/retrieval-events.jsonl`.

- [ ] **Step 4: Thread weak and strong use signals through the memory service**

In `searchMemory` and `contextMemory`, emit weak-use candidates from the returned bundle. In `unfoldMemory`, emit a strong-use event that references the prior candidate target by `sourcePath`, `sourceFile`, `heading`, `noteId`, and `chunkId` when available.

- [ ] **Step 5: Re-run the targeted observability tests**

Run:

```bash
pnpm --filter @playground/obsidian-memory rag:test -- --test-name-pattern "weak and strong retrieval use|integrity warnings in full-detail MCP output|memory_unfold resolves by source_path"
```

Expected: PASS.

- [ ] **Step 6: Commit the observability slice**

```bash
git add tools/obsidian-memory/src/retrieval-observability.mjs tools/obsidian-memory/src/mcp-memory-service.mjs tools/obsidian-memory/tests/query-surface.test.mjs tools/obsidian-memory/tests/retrieval-observability.test.mjs
git commit -m "feat: add obsidian retrieval observability"
```

## Task 2: Upgrade the Lexical Index for BM25-Style Ranking

**Files:**
- Modify: [tools/obsidian-memory/src/rag-index.ts](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/src/rag-index.ts)
- Modify: [tools/obsidian-memory/tests/rag-index.test.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/tests/rag-index.test.mjs)

- [ ] **Step 1: Write a failing lexical-index schema test**

Add assertions that `lexical-index.json` contains enough information for BM25/BM25F-style ranking:

```js
assert.equal(lexicalIndex.schema_version, 3);
assert.ok(lexicalIndex.fields.text);
assert.ok(lexicalIndex.fields.title);
assert.ok(lexicalIndex.fields.path);
assert.ok(Number.isFinite(lexicalIndex.avgFieldLengths.text));
assert.ok(lexicalIndex.terms["routing"]?.docs?.length > 0);
```

- [ ] **Step 2: Run the lexical-index test to verify it fails**

Run:

```bash
pnpm --filter @playground/obsidian-memory rag:test -- --test-name-pattern "writes BM25-ready lexical index artifacts"
```

Expected: FAIL because the current lexical index is not BM25-ready.

- [ ] **Step 3: Extend `buildLexicalIndex` and emitted artifacts**

Emit per-term postings and document statistics needed for BM25/BM25F-style ranking, including:

- per-field term frequencies
- per-document field lengths
- average field lengths
- corpus document count

- [ ] **Step 4: Rebuild and re-run the lexical-index tests**

Run:

```bash
pnpm --filter @playground/obsidian-memory rag:test -- --test-name-pattern "rag-index|lexical index"
```

Expected: PASS.

- [ ] **Step 5: Commit the index slice**

```bash
git add tools/obsidian-memory/src/rag-index.ts tools/obsidian-memory/tests/rag-index.test.mjs
git commit -m "feat: add BM25-ready lexical index artifacts"
```

## Task 3: Replace Heuristic Lexical Search With BM25/BM25F Ranking

**Files:**
- Modify: [tools/obsidian-memory/src/obsidian-rag.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/src/obsidian-rag.mjs)
- Modify: [tools/obsidian-memory/tests/obsidian-rag.test.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/tests/obsidian-rag.test.mjs)

- [ ] **Step 1: Write failing lexical-ranking behavior tests**

Add cases proving:

```js
assert.equal(candidates[0].chunkId, "decision-routing");
assert.ok(candidates[0].scoreBreakdown.lexicalScore > candidates[1].scoreBreakdown.lexicalScore);
assert.ok(candidates[0].matchReasons.includes("exact:path"));
assert.ok(candidates[0].matchReasons.includes("source:lexical"));
```

Also add a regression for paraphrase-like wording so lexical ranking still behaves sensibly before vector fusion.

- [ ] **Step 2: Run the targeted lexical-ranking tests and confirm failure**

Run:

```bash
pnpm --filter @playground/obsidian-memory rag:test -- --test-name-pattern "BM25|lexical ranking|exact path"
```

Expected: FAIL while `lexicalSearch` still uses fixed token boosts.

- [ ] **Step 3: Implement a field-aware lexical ranker**

Refactor `lexicalSearch` so it scores documents from the BM25-ready lexical index instead of direct token-set boosts. Keep explicit boosts for exact note-id, exact path, and exact title matches layered on top.

- [ ] **Step 4: Re-run ranking tests and the broader retrieval suite**

Run:

```bash
pnpm --filter @playground/obsidian-memory rag:test -- --test-name-pattern "retrieveMemoryCandidates|assembleMemoryContext|rag:query"
```

Expected: PASS.

- [ ] **Step 5: Commit the lexical-ranking slice**

```bash
git add tools/obsidian-memory/src/obsidian-rag.mjs tools/obsidian-memory/tests/obsidian-rag.test.mjs
git commit -m "feat: upgrade obsidian lexical ranking"
```

## Task 4: Add Default and Quality Retrieval Modes

**Files:**
- Modify: [tools/obsidian-memory/src/obsidian-rag.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/src/obsidian-rag.mjs)
- Modify: [tools/obsidian-memory/src/rag-query.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/src/rag-query.mjs)
- Modify: [tools/obsidian-memory/src/mcp-memory-service.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/src/mcp-memory-service.mjs)
- Modify: [tools/obsidian-memory/src/mcp-server-core.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/src/mcp-server-core.mjs)
- Modify: [tools/obsidian-memory/tests/obsidian-rag.test.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/tests/obsidian-rag.test.mjs)
- Modify: [tools/obsidian-memory/tests/query-surface.test.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/tests/query-surface.test.mjs)

- [ ] **Step 1: Write failing mode-surface tests**

Add tests that assert a new retrieval-mode argument and behavior split:

```js
assert.equal(output.filters.retrievalMode, "default");
assert.equal(qualityOutput.filters.retrievalMode, "quality");
assert.ok(qualityOutput.retrieval.candidatePool > output.retrieval.candidatePool);
```

- [ ] **Step 2: Run the mode tests to verify they fail**

Run:

```bash
pnpm --filter @playground/obsidian-memory rag:test -- --test-name-pattern "retrieval mode|quality mode"
```

Expected: FAIL because no retrieval mode exists yet.

- [ ] **Step 3: Implement retrieval-mode parsing and plumbing**

Add a `retrieval_mode` / `--retrieval-mode` surface with values like:

```js
["default", "quality"]
```

Default mode should stay safer and smaller. Quality mode should widen candidate generation and enable the heavier rerank path.

- [ ] **Step 4: Re-run CLI and MCP surface tests**

Run:

```bash
pnpm --filter @playground/obsidian-memory rag:test -- --test-name-pattern "rag:query|memory_search|tools/list|retrieval mode|quality mode"
```

Expected: PASS.

- [ ] **Step 5: Commit the mode slice**

```bash
git add tools/obsidian-memory/src/obsidian-rag.mjs tools/obsidian-memory/src/rag-query.mjs tools/obsidian-memory/src/mcp-memory-service.mjs tools/obsidian-memory/src/mcp-server-core.mjs tools/obsidian-memory/tests/obsidian-rag.test.mjs tools/obsidian-memory/tests/query-surface.test.mjs
git commit -m "feat: add obsidian retrieval modes"
```

## Task 5: Replace Plain RRF With Safer Weighted Fusion

**Files:**
- Modify: [tools/obsidian-memory/src/obsidian-rag.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/src/obsidian-rag.mjs)
- Modify: [tools/obsidian-memory/tests/obsidian-rag.test.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/tests/obsidian-rag.test.mjs)

- [ ] **Step 1: Write a failing false-positive regression**

Add a case where a semantically plausible note with weak lexical support currently ranks too high, then assert the safer expected outcome:

```js
assert.equal(candidates[0].chunkId, "routing-decision");
assert.ok((candidates[0].scoreBreakdown.lexicalScore ?? 0) > 0);
assert.ok((semanticOnly.scoreBreakdown.lexicalScore ?? 0) === 0);
assert.ok(candidates.indexOf(semanticOnly) > 0);
```

- [ ] **Step 2: Run the regression test and confirm failure**

Run:

```bash
pnpm --filter @playground/obsidian-memory rag:test -- --test-name-pattern "semantic-only false positive|weighted fusion"
```

Expected: FAIL with current reciprocal-rank fusion behavior.

- [ ] **Step 3: Implement weighted fusion and support-aware promotion**

Refactor the candidate merge step so:

- lexical rank gets the highest weight
- vector and graph remain additive but secondary
- semantic-only promotion requires another support signal in quality mode
- graph seeds must come from strong lexical candidates

- [ ] **Step 4: Re-run the hybrid retrieval tests**

Run:

```bash
pnpm --filter @playground/obsidian-memory rag:test -- --test-name-pattern "graph boosts|vector hits|history|warning-scoped|weighted fusion"
```

Expected: PASS.

- [ ] **Step 5: Commit the fusion slice**

```bash
git add tools/obsidian-memory/src/obsidian-rag.mjs tools/obsidian-memory/tests/obsidian-rag.test.mjs
git commit -m "feat: tighten obsidian hybrid fusion"
```

## Task 6: Add Retrieval Reporting and the First Judged Query Harness

**Files:**
- Create: [tools/obsidian-memory/src/rag-report.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/src/rag-report.mjs)
- Modify: [tools/obsidian-memory/package.json](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/package.json)
- Create later: [tools/obsidian-memory/tests/retrieval-evals.test.mjs](/Users/macbook/personal/playground/.worktrees/feat-obsidian-rag-retrieval-spec/tools/obsidian-memory/tests/retrieval-evals.test.mjs)

- [ ] **Step 1: Write a failing report test**

Add a report-level test that feeds synthetic telemetry and asserts grouped outcomes:

```js
assert.equal(report.onlyWeakUseQueries.length, 1);
assert.equal(report.strongUseFromLowerRank.length, 1);
assert.equal(report.semanticOnlyFalsePositives.length, 1);
```

- [ ] **Step 2: Run the report test to verify it fails**

Run:

```bash
pnpm --filter @playground/obsidian-memory rag:test -- --test-name-pattern "retrieval report groups weak and strong use outcomes"
```

Expected: FAIL because no report surface exists yet.

- [ ] **Step 3: Implement the report CLI and package script**

Expose a script such as:

```json
{
  "scripts": {
    "rag:report": "node ./src/rag-report.mjs"
  }
}
```

Have it summarize recent retrieval events into human-usable buckets.

- [ ] **Step 4: Seed the first judged query harness from observed queries**

Create a small test fixture of observed query/result expectations and verify it through `retrieveMemoryCandidates` in a dedicated test file.

- [ ] **Step 5: Run the report and eval tests**

Run:

```bash
pnpm --filter @playground/obsidian-memory rag:test -- --test-name-pattern "retrieval report|judged query"
```

Expected: PASS.

- [ ] **Step 6: Commit the reporting slice**

```bash
git add tools/obsidian-memory/src/rag-report.mjs tools/obsidian-memory/package.json tools/obsidian-memory/tests/retrieval-evals.test.mjs
git commit -m "feat: add obsidian retrieval reporting"
```

## Task 7: Final Verification and Branch Closeout

**Files:**
- Modify only if a small follow-up fix is needed in files already listed above.

- [ ] **Step 1: Run the full Obsidian memory suite**

Run:

```bash
pnpm --filter @playground/obsidian-memory rag:test
```

Expected: PASS.

- [ ] **Step 2: Rebuild the typed memory artifacts and smoke the CLI**

Run:

```bash
pnpm --filter @playground/obsidian-memory rag:index
pnpm --filter @playground/obsidian-memory rag:query --query "routing decision retrieval quality" --retrieval-mode default
pnpm --filter @playground/obsidian-memory rag:query --query "routing decision retrieval quality" --retrieval-mode quality
pnpm --filter @playground/obsidian-memory rag:report
```

Expected: successful index build, valid query output in both modes, and a readable retrieval report.

- [ ] **Step 3: Run the MCP surface smoke checks**

Run:

```bash
pnpm --filter @playground/obsidian-memory mcp
```

Then verify:

- `initialize`
- `tools/list`
- `memory_search` with `retrieval_mode: "default"`
- `memory_search` with `retrieval_mode: "quality"`
- `memory_unfold` against a returned source

- [ ] **Step 4: Record baseline-vs-final evidence in the branch summary**

Capture:

- which baseline tests were already failing before the work
- which retrieval-quality regressions were added and fixed
- which judged-query examples improved

- [ ] **Step 5: Commit the final verification pass**

```bash
git add tools/obsidian-memory package.json pnpm-lock.yaml
git commit -m "test: verify obsidian retrieval quality rollout"
```
