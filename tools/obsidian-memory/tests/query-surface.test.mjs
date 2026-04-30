import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const packageRoot = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(packageRoot, "..", "..");

async function buildTypedIndexFixture() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "rag-query-surface-"));
  const indexRoot = path.join(tempRoot, ".rag");
  await mkdir(indexRoot, { recursive: true });

  const noteRegistry = [
    {
      id: "healthy-spec",
      type: "spec",
      path: "vault/specs/healthy.md",
      title: "Healthy typed RAG plan",
      status: "active",
      created: "2026-04-29",
      updated: "2026-04-29",
      summary: "Healthy spec for typed RAG ranking.",
      tags: ["rag"],
      keywords: ["typed", "rag", "ranking"],
      chunk_ids: ["chunk:healthy-spec:0000:aaaaaaaa"],
      validation_status: "ok",
      validation_issues: [],
      outbound_links: [],
      inbound_links: [],
      content_hash: "healthy-hash",
      mtime_ms: 1,
      owner: "agent",
      repo_slug: "playground",
      legacy_type: null,
      legacy_status: null,
    },
    {
      id: "warning-spec",
      type: "spec",
      path: "vault/specs/warning.md",
      title: "Warning typed RAG plan",
      status: "active",
      created: "2026-04-29",
      updated: "2026-04-29",
      summary: "Warning spec for typed RAG ranking.",
      tags: ["rag"],
      keywords: ["typed", "rag", "ranking"],
      chunk_ids: ["chunk:warning-spec:0000:bbbbbbbb"],
      validation_status: "warning",
      validation_issues: ["missing_summary"],
      outbound_links: [],
      inbound_links: [],
      content_hash: "warning-hash",
      mtime_ms: 1,
      owner: "agent",
      repo_slug: "playground",
      legacy_type: null,
      legacy_status: null,
    },
  ];

  const chunkIndex = [
    {
      chunk_id: "chunk:healthy-spec:0000:aaaaaaaa",
      note_id: "healthy-spec",
      source_path: "vault/specs/healthy.md § Plan",
      heading: "Plan",
      heading_level: 2,
      text: "Typed RAG ranking plan for healthy retrieval behavior with enough text to remain substantive.",
      summary: "Typed RAG ranking plan.",
      tokens_estimated: 16,
      content_hash: "healthy-chunk",
      type: "spec",
      status: "active",
    },
    {
      chunk_id: "chunk:warning-spec:0000:bbbbbbbb",
      note_id: "warning-spec",
      source_path: "vault/specs/warning.md § Plan",
      heading: "Plan",
      heading_level: 2,
      text: "Typed RAG ranking plan for warning retrieval behavior with enough text to remain substantive.",
      summary: "Typed RAG ranking plan.",
      tokens_estimated: 16,
      content_hash: "warning-chunk",
      type: "spec",
      status: "active",
    },
  ];

  const graphIndex = {
    schema_version: 2,
    generated_at: "2026-04-30T00:00:00.000Z",
    nodes: [],
    edges: [],
  };

  await Promise.all([
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
      `${JSON.stringify(noteRegistry, null, 2)}\n`,
      "utf8",
    ),
    writeFile(
      path.join(indexRoot, "chunk-index.json"),
      `${JSON.stringify(chunkIndex, null, 2)}\n`,
      "utf8",
    ),
    writeFile(
      path.join(indexRoot, "graph-index.json"),
      `${JSON.stringify(graphIndex, null, 2)}\n`,
      "utf8",
    ),
  ]);

  return { tempRoot, indexRoot };
}

function sendRpc(child, payload) {
  return new Promise((resolve, reject) => {
    let stderr = "";
    const onStdErr = (chunk) => {
      stderr += chunk.toString();
    };
    const onStdOut = (chunk) => {
      const lines = chunk
        .toString()
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      for (const line of lines) {
        const message = JSON.parse(line);
        if (message.id === payload.id) {
          child.stdout.off("data", onStdOut);
          child.stderr.off("data", onStdErr);
          if (message.error) {
            reject(new Error(message.error.message));
            return;
          }
          resolve(message.result);
          return;
        }
      }
    };

    child.stdout.on("data", onStdOut);
    child.stderr.on("data", onStdErr);
    child.stdin.write(`${JSON.stringify(payload)}\n`);

    setTimeout(() => {
      child.stdout.off("data", onStdOut);
      child.stderr.off("data", onStdErr);
      reject(new Error(`Timed out waiting for RPC response. ${stderr}`));
    }, 5000);
  });
}

test("rag:query surfaces integrity mode and candidate integrity metadata", async () => {
  const fixture = await buildTypedIndexFixture();
  const result = spawnSync(
    "node",
    [
      path.join(packageRoot, "src", "rag-query.mjs"),
      "--query",
      "typed rag ranking plan",
      "--corpus",
      fixture.indexRoot,
      "--integrity-mode",
      "exclude-warning",
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);

  assert.equal(output.filters.integrityMode, "exclude-warning");
  assert.equal(output.candidates.length, 1);
  assert.equal(output.candidates[0].noteId, "healthy-spec");
  assert.equal(output.candidates[0].validationStatus, "ok");
  assert.deepEqual(output.candidates[0].validationIssues, []);
});

test("memory_search surfaces integrity warnings in full-detail MCP output", async () => {
  const fixture = await buildTypedIndexFixture();
  const child = spawn("node", [path.join(packageRoot, "src", "rag-mcp-server.mjs")], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PLAYGROUND_OBSIDIAN_MEMORY_INDEX_ROOT: fixture.indexRoot,
    },
    stdio: ["pipe", "pipe", "pipe"],
  });

  try {
    const initResult = await sendRpc(child, {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
      },
    });
    assert.equal(initResult.serverInfo.name, "playground-obsidian-memory");

    const searchResult = await sendRpc(child, {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "memory_search",
        arguments: {
          query: "typed rag ranking plan",
          detail: "full",
          integrity_mode: "prefer-warning",
          limit: 2,
        },
      },
    });

    const text = searchResult.content[0].text;
    assert.match(text, /integrity: warning \(missing_summary\)/);
    assert.match(text, /source_path: vault\/specs\/warning\.md § Plan/);
  } finally {
    child.kill();
  }
});
