import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  buildCleanupReport,
  buildWriteTargetPath,
  classifyMemoryInput,
  findWriteDuplicates,
  renderTypedNoteTemplate,
  verifyTypedMemory,
} from "../src/rag-governance.mjs";

test("classifyMemoryInput maps durable decisions to architecture records", () => {
  const result = classifyMemoryInput("We decided to use hybrid retrieval");

  assert.equal(result.request_intent, "make_decision");
  assert.equal(result.expected_note_type, "architecture-record");
  assert.ok(result.retrieval_filters.type.includes("architecture-record"));
});

test("classifyMemoryInput maps rebuild work to specs", () => {
  const result = classifyMemoryInput("Make a plan to rebuild the RAG memory system");

  assert.equal(result.request_intent, "write_spec");
  assert.equal(result.expected_note_type, "spec");
  assert.ok(result.retrieval_filters.type.includes("spec"));
});

test("buildCleanupReport finds stale todos, old sessions, and orphan notes", () => {
  const report = buildCleanupReport({
    noteRegistry: [
      {
        id: "todo-1",
        type: "todo",
        path: "vault/todos/todo-1.md",
        title: "Todo 1",
        status: "active",
        created: "2026-03-01",
        updated: "2026-03-01",
        summary: "Old todo",
        outbound_links: [],
        inbound_links: [],
      },
      {
        id: "session-1",
        type: "session",
        path: "vault/sessions/session-1.md",
        title: "Session 1",
        status: "active",
        created: "2026-03-01",
        updated: "2026-03-15",
        summary: "Old session",
        outbound_links: [],
        inbound_links: [],
      },
      {
        id: "repo-home",
        type: "repo-home",
        path: "vault/00 Repo Home.md",
        title: "Repo Home",
        status: "active",
        created: "2026-04-01",
        updated: "2026-04-01",
        summary: "Canonical home",
        outbound_links: [],
        inbound_links: [],
      },
    ],
    chunkIndex: [
      {
        note_id: "todo-1",
        text: "todo body",
      },
      {
        note_id: "session-1",
        text: "session body",
      },
      {
        note_id: "repo-home",
        text: "repo home body",
      },
    ],
    diagnostics: {
      synthetic_ids: ["vault/todos/todo-1.md"],
      validation_warnings: [],
    },
    now: new Date("2026-04-29T00:00:00.000Z"),
    staleGeneratedFiles: ["old.json"],
  });

  assert.equal(report.stale_todos.length, 1);
  assert.equal(report.sessions_to_summarise.length, 1);
  assert.equal(report.orphan_notes.length, 2);
  assert.equal(report.invalid_frontmatter.length, 1);
  assert.equal(report.generated_files_to_delete.length, 1);
});

test("verifyTypedMemory fails when typed index has unresolved links and synthetic ids", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "rag-governance-"));
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
      JSON.stringify({
        schema_version: 2,
        source_root: "vault",
      }),
      "utf8",
    ),
    writeFile(
      path.join(indexRoot, "note-registry.json"),
      JSON.stringify([
        {
          id: "mem-1",
          type: "spec",
          path: "vault/specs/spec-1.md",
          status: "active",
          title: "Spec 1",
          summary: "Spec",
          outbound_links: ["missing-note"],
          inbound_links: [],
        },
      ]),
      "utf8",
    ),
    writeFile(path.join(indexRoot, "chunk-index.json"), "[]", "utf8"),
    writeFile(path.join(indexRoot, "lexical-index.json"), "{}", "utf8"),
    writeFile(path.join(indexRoot, "vector-index.json"), "{}", "utf8"),
    writeFile(path.join(indexRoot, "graph-index.json"), JSON.stringify({ nodes: [], edges: [] }), "utf8"),
    writeFile(
      path.join(indexRoot, "diagnostics.json"),
      JSON.stringify({
        synthetic_ids: ["vault/specs/spec-1.md"],
        unresolved_links: [{ from: "mem-1", targets: ["missing-note"] }],
      }),
      "utf8",
    ),
    writeFile(path.join(indexRoot, "cleanup-report.json"), "{}", "utf8"),
  ]);

  const result = await verifyTypedMemory({
    vaultRoot,
    indexRoot,
    repoRoot: tempRoot,
  });

  assert.equal(result.passed, false);
  assert.ok(result.errors.some((error) => error.startsWith("Unresolved links present")));
  assert.ok(result.warnings.some((warning) => warning.includes("Synthetic note ids")));
});

test("buildWriteTargetPath routes typed notes into the new spec folders", () => {
  const target = buildWriteTargetPath({
    vaultRoot: "/tmp/vault",
    repoSlug: "playground",
    noteType: "spec",
    title: "Rebuild RAG memory",
    createdAt: new Date("2026-04-29T00:00:00.000Z"),
  });

  assert.equal(target.noteId, "mem-20260429-rebuild-rag-memory");
  assert.ok(target.relativePath.endsWith("00 Repositories/playground/specs/2026-04-29 Rebuild RAG memory.md"));
});

test("renderTypedNoteTemplate creates strict frontmatter for new notes", () => {
  const rendered = renderTypedNoteTemplate({
    noteType: "todo",
    repoSlug: "playground",
    title: "Add cleanup dry-run",
    summary: "Create a cleanup dry-run command.",
    owner: "agent",
    createdAt: new Date("2026-04-29T00:00:00.000Z"),
  });

  assert.ok(rendered.content.includes('id: "mem-20260429-add-cleanup-dry-run"'));
  assert.ok(rendered.content.includes('type: "todo"'));
  assert.ok(rendered.content.includes('summary: "Create a cleanup dry-run command."'));
  assert.ok(rendered.content.includes("## Done when"));
});

test("findWriteDuplicates catches active duplicates by title or summary", () => {
  const duplicates = findWriteDuplicates({
    noteRegistry: [
      {
        id: "mem-1",
        type: "spec",
        title: "Rebuild RAG memory",
        summary: "Spec for rebuilding repo memory.",
        status: "active",
        path: "vault/specs/rebuild-rag-memory.md",
      },
    ],
    noteType: "spec",
    title: "Rebuild RAG memory",
    summary: "Different summary",
  });

  assert.equal(duplicates.length, 1);
});
