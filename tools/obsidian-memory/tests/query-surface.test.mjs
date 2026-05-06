import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const packageRoot = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(packageRoot, "..", "..");

async function buildTypedIndexFixture(options = {}) {
  const includeRepoHome = options.includeRepoHome ?? true;
  const staleGeneratedFiles = options.staleGeneratedFiles ?? [];
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "rag-query-surface-"));
  const indexRoot = path.join(tempRoot, ".rag");
  await mkdir(indexRoot, { recursive: true });

  const noteRegistry = [
    ...(includeRepoHome
      ? [
          {
            id: "repo-home",
            type: "repo-home",
            path: "vault/00 Repositories/playground/00 Repo Home.md",
            title: "playground",
            status: "active",
            created: "2026-04-29",
            updated: "2026-04-29",
            summary: "Canonical repo-home note for playground context.",
            tags: ["repo/playground"],
            keywords: ["playground", "architecture", "active focus"],
            chunk_ids: [
              "chunk:repo-home:0000:11111111",
              "chunk:repo-home:0001:22222222",
            ],
            validation_status: "warning",
            validation_issues: ["missing_summary"],
            outbound_links: [],
            inbound_links: [],
            content_hash: "repo-home-hash",
            mtime_ms: 1,
            owner: "agent",
            repo_slug: "playground",
            legacy_type: null,
            legacy_status: null,
          },
        ]
      : []),
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
    ...(includeRepoHome
      ? [
          {
            chunk_id: "chunk:repo-home:0000:11111111",
            note_id: "repo-home",
            source_path:
              "vault/00 Repositories/playground/00 Repo Home.md § Current Architecture",
            heading: "Current Architecture",
            heading_level: 2,
            text: "Current architecture keeps the host app owning routing and page composition while remotes mount into host-owned surfaces.",
            summary: "Host owns routing and page composition.",
            tokens_estimated: 18,
            content_hash: "repo-home-current-architecture",
            type: "repo-home",
            status: "active",
          },
          {
            chunk_id: "chunk:repo-home:0001:22222222",
            note_id: "repo-home",
            source_path:
              "vault/00 Repositories/playground/00 Repo Home.md § Active Focus",
            heading: "Active Focus",
            heading_level: 2,
            text: "Active focus is rebuilding the agent-facing RAG stack with typed notes, registry integrity, and stronger MCP query surfaces.",
            summary: "Typed RAG rebuild remains the active focus.",
            tokens_estimated: 18,
            content_hash: "repo-home-active-focus",
            type: "repo-home",
            status: "active",
          },
        ]
      : []),
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
    writeFile(
      path.join(indexRoot, "diagnostics.json"),
      `${JSON.stringify(
        {
          synthetic_ids: [],
          unresolved_links: [],
          validation_warnings: [],
        },
        null,
        2,
      )}\n`,
      "utf8",
    ),
    writeFile(
      path.join(indexRoot, "cleanup-report.json"),
      `${JSON.stringify({}, null, 2)}\n`,
      "utf8",
    ),
    ...staleGeneratedFiles.map((fileName) =>
      writeFile(path.join(indexRoot, fileName), "stale\n", "utf8"),
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

function spawnMcpServer(options = {}) {
  return spawn("node", [path.join(packageRoot, "src", "rag-mcp-server.mjs")], {
    cwd: repoRoot,
    env: {
      ...process.env,
      ...options.env,
    },
    stdio: ["pipe", "pipe", "pipe"],
  });
}

function spawnPackageScriptMcpServer(options = {}) {
  return spawn("pnpm", ["--silent", "--filter", "@playground/obsidian-memory", "mcp"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      ...options.env,
    },
    stdio: ["pipe", "pipe", "pipe"],
  });
}

async function initializeServer(child, id = 1) {
  return sendRpc(child, {
    jsonrpc: "2.0",
    id,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "obsidian-memory-test",
        version: "0.0.0",
      },
    },
  });
}

test("rag:query surfaces integrity mode and candidate integrity metadata", async (t) => {
  const fixture = await buildTypedIndexFixture();
  t.after(async () => {
    await rm(fixture.tempRoot, { recursive: true, force: true });
  });
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
  assert.equal(output.queryPlan.classification.intent, "implementation");
  assert.equal(output.queryPlan.routing.allowArchived, false);
  assert.ok(Array.isArray(output.queryPlan.variants.expanded));
  assert.equal(output.candidates.length, 1);
  assert.equal(output.candidates[0].noteId, "healthy-spec");
  assert.equal(output.candidates[0].validationStatus, "ok");
  assert.deepEqual(output.candidates[0].validationIssues, []);
});

test("rag:query explains when vector retrieval is disabled explicitly", async (t) => {
  const fixture = await buildTypedIndexFixture();
  t.after(async () => {
    await rm(fixture.tempRoot, { recursive: true, force: true });
  });
  const result = spawnSync(
    "node",
    [
      path.join(packageRoot, "src", "rag-query.mjs"),
      "--query",
      "typed rag ranking plan",
      "--corpus",
      fixture.indexRoot,
      "--vector-mode",
      "off",
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);

  assert.equal(output.filters.vectorMode, "off");
  assert.equal(output.retrieval.vector.available, false);
  assert.equal(output.retrieval.vector.reason, "disabled_by_request");
});

test("memory_search surfaces integrity warnings in full-detail MCP output", async (t) => {
  const fixture = await buildTypedIndexFixture();
  t.after(async () => {
    await rm(fixture.tempRoot, { recursive: true, force: true });
  });
  const child = spawnMcpServer({
    env: {
      PLAYGROUND_OBSIDIAN_MEMORY_INDEX_ROOT: fixture.indexRoot,
    },
  });

  try {
    const initResult = await initializeServer(child, 1);
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

test("tools/list exposes the expected MCP discovery contract", async (t) => {
  const fixture = await buildTypedIndexFixture();
  t.after(async () => {
    await rm(fixture.tempRoot, { recursive: true, force: true });
  });
  const child = spawnMcpServer({
    env: {
      PLAYGROUND_OBSIDIAN_MEMORY_INDEX_ROOT: fixture.indexRoot,
    },
  });

  try {
    await initializeServer(child, 5);

    const result = await sendRpc(child, {
      jsonrpc: "2.0",
      id: 6,
      method: "tools/list",
    });

    assert.equal(result.tools.length, 6);
    assert.deepEqual(
      result.tools.map((tool) => tool.name),
      [
        "memory_search",
        "memory_unfold",
        "memory_context",
        "classify",
        "propose_write",
        "clean_dry_run",
      ],
    );

    const searchTool = result.tools.find((tool) => tool.name === "memory_search");
    assert.deepEqual(searchTool.inputSchema.required, ["query"]);
    assert.deepEqual(
      searchTool.inputSchema.properties.integrity_mode.enum,
      ["prefer-healthy", "neutral", "prefer-warning", "exclude-warning"],
    );
    assert.deepEqual(
      searchTool.inputSchema.properties.vector_mode.enum,
      ["auto", "off"],
    );
    assert.deepEqual(
      searchTool.inputSchema.properties.detail.enum,
      ["compact", "full"],
    );

    const unfoldTool = result.tools.find((tool) => tool.name === "memory_unfold");
    assert.equal(unfoldTool.inputSchema.additionalProperties, false);
    assert.ok("source_path" in unfoldTool.inputSchema.properties);
    assert.ok("source_file" in unfoldTool.inputSchema.properties);
    assert.ok("heading" in unfoldTool.inputSchema.properties);

    const contextTool = result.tools.find((tool) => tool.name === "memory_context");
    assert.equal(contextTool.inputSchema.additionalProperties, false);
    assert.deepEqual(
      contextTool.inputSchema.properties.detail.enum,
      ["compact", "full"],
    );
    assert.ok("repo_slug" in contextTool.inputSchema.properties);

    const classifyTool = result.tools.find((tool) => tool.name === "classify");
    assert.deepEqual(classifyTool.inputSchema.required, ["input"]);

    const proposeWriteTool = result.tools.find((tool) => tool.name === "propose_write");
    assert.deepEqual(
      proposeWriteTool.inputSchema.required,
      ["note_type", "title", "summary"],
    );
    assert.ok("owner" in proposeWriteTool.inputSchema.properties);
    assert.ok("repo_slug" in proposeWriteTool.inputSchema.properties);

    const cleanDryRunTool = result.tools.find((tool) => tool.name === "clean_dry_run");
    assert.equal(cleanDryRunTool.inputSchema.additionalProperties, false);
    assert.deepEqual(cleanDryRunTool.inputSchema.properties, {});
  } finally {
    child.kill();
  }
});

test("package-script MCP entrypoint initializes from repo root", async (t) => {
  const fixture = await buildTypedIndexFixture();
  t.after(async () => {
    await rm(fixture.tempRoot, { recursive: true, force: true });
  });
  const child = spawnPackageScriptMcpServer({
    env: {
      PLAYGROUND_OBSIDIAN_MEMORY_INDEX_ROOT: fixture.indexRoot,
    },
  });

  try {
    const initResult = await initializeServer(child, 70);

    assert.equal(initResult.serverInfo.name, "playground-obsidian-memory");

    const toolsResult = await sendRpc(child, {
      jsonrpc: "2.0",
      id: 71,
      method: "tools/list",
    });

    assert.deepEqual(
      toolsResult.tools.map((tool) => tool.name),
      [
        "memory_search",
        "memory_unfold",
        "memory_context",
        "classify",
        "propose_write",
        "clean_dry_run",
      ],
    );
  } finally {
    child.kill();
  }
});

test("classify returns structured MCP output for memory workflow routing", async (t) => {
  const fixture = await buildTypedIndexFixture();
  t.after(async () => {
    await rm(fixture.tempRoot, { recursive: true, force: true });
  });
  const child = spawnMcpServer({
    env: {
      PLAYGROUND_OBSIDIAN_MEMORY_INDEX_ROOT: fixture.indexRoot,
    },
  });

  try {
    await initializeServer(child, 40);

    const result = await sendRpc(child, {
      jsonrpc: "2.0",
      id: 41,
      method: "tools/call",
      params: {
        name: "classify",
        arguments: {
          input: "We decided to use hybrid retrieval for memory search",
        },
      },
    });

    assert.equal(result.structuredContent.request_intent, "make_decision");
    assert.equal(result.structuredContent.expected_note_type, "architecture-record");
    assert.ok(
      result.structuredContent.retrieval_filters.type.includes("architecture-record"),
    );
    assert.equal(
      JSON.parse(result.content[0].text).expected_note_type,
      "architecture-record",
    );
  } finally {
    child.kill();
  }
});

test("propose_write previews a typed note without mutating the vault", async (t) => {
  const fixture = await buildTypedIndexFixture();
  t.after(async () => {
    await rm(fixture.tempRoot, { recursive: true, force: true });
  });
  const child = spawnMcpServer({
    env: {
      PLAYGROUND_OBSIDIAN_MEMORY_INDEX_ROOT: fixture.indexRoot,
      PLAYGROUND_OBSIDIAN_MEMORY_VAULT_ROOT: path.join(fixture.tempRoot, "vault"),
    },
  });

  try {
    await initializeServer(child, 50);

    const result = await sendRpc(child, {
      jsonrpc: "2.0",
      id: 51,
      method: "tools/call",
      params: {
        name: "propose_write",
        arguments: {
          note_type: "spec",
          title: "Rebuild RAG memory",
          summary: "Spec for rebuilding repo memory.",
          owner: "agent",
        },
      },
    });

    assert.equal(result.structuredContent.dry_run, true);
    assert.equal(result.structuredContent.type, "spec");
    assert.match(result.structuredContent.path, /vault\/00 Repositories\/playground\/specs\//);
    assert.match(
      result.structuredContent.content_preview,
      /summary: "Spec for rebuilding repo memory\."/,
    );
    assert.deepEqual(result.structuredContent.duplicate_proposals, []);
  } finally {
    child.kill();
  }
});

test("clean_dry_run reports stale generated files without deleting them", async (t) => {
  const fixture = await buildTypedIndexFixture({
    staleGeneratedFiles: ["old-generated.json"],
  });
  t.after(async () => {
    await rm(fixture.tempRoot, { recursive: true, force: true });
  });
  const child = spawnMcpServer({
    env: {
      PLAYGROUND_OBSIDIAN_MEMORY_INDEX_ROOT: fixture.indexRoot,
    },
  });

  try {
    await initializeServer(child, 60);

    const result = await sendRpc(child, {
      jsonrpc: "2.0",
      id: 61,
      method: "tools/call",
      params: {
        name: "clean_dry_run",
        arguments: {},
      },
    });

    assert.equal(result.structuredContent.dry_run, true);
    assert.deepEqual(result.structuredContent.generated_files_to_delete, [
      { path: "old-generated.json" },
    ]);
    assert.deepEqual(
      JSON.parse(result.content[0].text).generated_files_to_delete,
      [{ path: "old-generated.json" }],
    );
  } finally {
    child.kill();
  }
});

test("memory_context returns canonical repo-home headings in compact and full modes", async (t) => {
  const fixture = await buildTypedIndexFixture();
  t.after(async () => {
    await rm(fixture.tempRoot, { recursive: true, force: true });
  });
  const child = spawnMcpServer({
    env: {
      PLAYGROUND_OBSIDIAN_MEMORY_INDEX_ROOT: fixture.indexRoot,
    },
  });

  try {
    await initializeServer(child, 10);

    const compactResult = await sendRpc(child, {
      jsonrpc: "2.0",
      id: 11,
      method: "tools/call",
      params: {
        name: "memory_context",
        arguments: {
          repo_slug: "playground",
        },
      },
    });
    const compactText = compactResult.content[0].text;
    assert.match(compactText, /source_file: vault\/00 Repositories\/playground\/00 Repo Home\.md/);
    assert.match(compactText, /## Current Architecture/);
    assert.match(compactText, /## Active Focus/);
    assert.match(compactText, /integrity: warning \(missing_summary\)/);

    const fullResult = await sendRpc(child, {
      jsonrpc: "2.0",
      id: 12,
      method: "tools/call",
      params: {
        name: "memory_context",
        arguments: {
          repo_slug: "playground",
          detail: "full",
        },
      },
    });
    const fullText = fullResult.content[0].text;
    assert.match(fullText, /source_path: vault\/00 Repositories\/playground\/00 Repo Home\.md § Current Architecture/);
    assert.match(fullText, /summary: Host owns routing and page composition\./);
    assert.match(fullText, /source_path: vault\/00 Repositories\/playground\/00 Repo Home\.md § Active Focus/);
  } finally {
    child.kill();
  }
});

test("memory_context falls back to search-style output when canonical repo-home headings are missing", async (t) => {
  const fixture = await buildTypedIndexFixture({ includeRepoHome: false });
  t.after(async () => {
    await rm(fixture.tempRoot, { recursive: true, force: true });
  });
  const child = spawnMcpServer({
    env: {
      PLAYGROUND_OBSIDIAN_MEMORY_INDEX_ROOT: fixture.indexRoot,
    },
  });

  try {
    await initializeServer(child, 15);

    const result = await sendRpc(child, {
      jsonrpc: "2.0",
      id: 16,
      method: "tools/call",
      params: {
        name: "memory_context",
        arguments: {
          repo_slug: "playground",
        },
      },
    });
    const text = result.content[0].text;
    assert.match(text, /Compact memory results\. Use memory_unfold with a source_path for detail\./);
    assert.match(text, /source_path: vault\/specs\/healthy\.md § Plan/);
    assert.doesNotMatch(text, /Compact repo context\./);
    assert.doesNotMatch(text, /source_file: vault\/00 Repositories\/playground\/00 Repo Home\.md/);
  } finally {
    child.kill();
  }
});

test("memory_unfold resolves by source_path and by source_file plus heading", async (t) => {
  const fixture = await buildTypedIndexFixture();
  t.after(async () => {
    await rm(fixture.tempRoot, { recursive: true, force: true });
  });
  const child = spawnMcpServer({
    env: {
      PLAYGROUND_OBSIDIAN_MEMORY_INDEX_ROOT: fixture.indexRoot,
    },
  });

  try {
    await initializeServer(child, 20);

    const byPath = await sendRpc(child, {
      jsonrpc: "2.0",
      id: 21,
      method: "tools/call",
      params: {
        name: "memory_unfold",
        arguments: {
          source_path: "vault/specs/warning.md § Plan",
        },
      },
    });
    assert.match(byPath.content[0].text, /source_path: vault\/specs\/warning\.md § Plan/);
    assert.match(byPath.content[0].text, /integrity: warning \(missing_summary\)/);

    const byFileAndHeading = await sendRpc(child, {
      jsonrpc: "2.0",
      id: 22,
      method: "tools/call",
      params: {
        name: "memory_unfold",
        arguments: {
          source_file: "vault/00 Repositories/playground/00 Repo Home.md",
          heading: "Active Focus",
        },
      },
    });
    assert.match(byFileAndHeading.content[0].text, /heading: Active Focus/);
    assert.match(byFileAndHeading.content[0].text, /Typed RAG rebuild remains the active focus\./);
  } finally {
    child.kill();
  }
});

test("memory_unfold returns a stable error for missing targets", async (t) => {
  const fixture = await buildTypedIndexFixture();
  t.after(async () => {
    await rm(fixture.tempRoot, { recursive: true, force: true });
  });
  const child = spawnMcpServer({
    env: {
      PLAYGROUND_OBSIDIAN_MEMORY_INDEX_ROOT: fixture.indexRoot,
    },
  });

  try {
    await initializeServer(child, 30);

    const result = await sendRpc(child, {
      jsonrpc: "2.0",
      id: 31,
      method: "tools/call",
      params: {
        name: "memory_unfold",
        arguments: {
          source_file: "vault/specs/missing.md",
          heading: "Nope",
        },
      },
    });
    assert.equal(result.isError, true);
    assert.match(
      result.content[0].text,
      /No memory chunk matched the provided source path or file plus heading\./,
    );
  } finally {
    child.kill();
  }
});
