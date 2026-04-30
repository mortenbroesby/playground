import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDiagnosticsReport,
  buildNoteRegistryArtifacts,
} from "../src/note-registry.mjs";

const edgeTypeByLinkGroup = {
  parents: "relates_to",
  children: "relates_to",
  related: "relates_to",
  supersedes: "supersedes",
  superseded_by: "superseded_by",
};

test("buildNoteRegistryArtifacts assembles registry, graph, and note validation state", () => {
  const notes = [
    {
      id: "mem-1",
      type: "spec",
      repoSlug: "playground",
      path: "vault/specs/spec.md",
      title: "Spec",
      status: "active",
      created: "2026-04-30",
      updated: "2026-04-30",
      summary: "Spec summary.",
      tags: ["rag"],
      keywords: ["memory"],
      mtimeMs: 1,
      contentHash: "hash-1",
      owner: "agent",
      legacyType: null,
      legacyStatus: null,
      linkGroups: {
        parents: [],
        children: [],
        related: ["mem-2", "missing-note"],
        supersedes: [],
        superseded_by: [],
      },
      syntheticId: false,
      typeNormalized: false,
      statusNormalized: false,
    },
    {
      id: "mem-2",
      type: "todo",
      repoSlug: "playground",
      path: "vault/tasks/todo.md",
      title: "Todo",
      status: "active",
      created: "2026-04-30",
      updated: "2026-04-30",
      summary: "",
      tags: [],
      keywords: [],
      mtimeMs: 1,
      contentHash: "hash-2",
      owner: "agent",
      legacyType: "repo-task",
      legacyStatus: "In Progress",
      linkGroups: {
        parents: [],
        children: [],
        related: [],
        supersedes: [],
        superseded_by: [],
      },
      syntheticId: true,
      typeNormalized: true,
      statusNormalized: true,
    },
  ];

  const chunkIndex = [
    {
      chunk_id: "chunk-1",
      note_id: "mem-1",
    },
    {
      chunk_id: "chunk-2",
      note_id: "mem-2",
    },
  ];

  const result = buildNoteRegistryArtifacts({
    notes,
    chunkIndex,
    edgeTypeByLinkGroup,
  });

  assert.equal(result.noteRegistry.length, 2);
  assert.equal(result.graph.edges.length, 1);
  assert.deepEqual(result.unresolvedLinks, [
    {
      from: "mem-1",
      targets: ["missing-note"],
    },
  ]);

  const spec = result.noteRegistry.find((note) => note.id === "mem-1");
  const todo = result.noteRegistry.find((note) => note.id === "mem-2");

  assert.deepEqual(spec.chunk_ids, ["chunk-1"]);
  assert.deepEqual(spec.inbound_links, []);
  assert.deepEqual(spec.outbound_links, ["mem-2", "missing-note"]);
  assert.equal(spec.validation_status, "warning");
  assert.deepEqual(spec.validation_issues, ["unresolved_links"]);
  assert.match(spec.chunk_ids[0], /^chunk-/);

  assert.deepEqual(todo.chunk_ids, ["chunk-2"]);
  assert.deepEqual(todo.inbound_links, ["mem-1"]);
  assert.equal(todo.validation_status, "warning");
  assert.deepEqual(todo.validation_issues, [
    "missing_frontmatter_id",
    "missing_summary",
    "legacy_type_normalized",
    "legacy_status_normalized",
  ]);
});

test("buildNoteRegistryArtifacts fails duplicate note ids", () => {
  assert.throws(
    () =>
      buildNoteRegistryArtifacts({
        notes: [
          {
            id: "mem-duplicate",
            type: "spec",
            repoSlug: "playground",
            path: "vault/specs/a.md",
            title: "A",
            status: "active",
            created: "2026-04-30",
            updated: "2026-04-30",
            summary: "A",
            tags: [],
            keywords: [],
            mtimeMs: 1,
            contentHash: "a",
            owner: "agent",
            legacyType: null,
            legacyStatus: null,
            linkGroups: {
              parents: [],
              children: [],
              related: [],
              supersedes: [],
              superseded_by: [],
            },
            syntheticId: false,
            typeNormalized: false,
            statusNormalized: false,
          },
          {
            id: "mem-duplicate",
            type: "spec",
            repoSlug: "playground",
            path: "vault/specs/b.md",
            title: "B",
            status: "active",
            created: "2026-04-30",
            updated: "2026-04-30",
            summary: "B",
            tags: [],
            keywords: [],
            mtimeMs: 1,
            contentHash: "b",
            owner: "agent",
            legacyType: null,
            legacyStatus: null,
            linkGroups: {
              parents: [],
              children: [],
              related: [],
              supersedes: [],
              superseded_by: [],
            },
            syntheticId: false,
            typeNormalized: false,
            statusNormalized: false,
          },
        ],
        chunkIndex: [],
        edgeTypeByLinkGroup,
      }),
    /registry\.duplicate_id/,
  );
});

test("buildDiagnosticsReport derives note-level diagnostics from registry integrity", () => {
  const diagnostics = buildDiagnosticsReport({
    generatedAt: "2026-04-30T00:00:00.000Z",
    repoSlug: "playground",
    unresolvedLinks: [{ from: "mem-1", targets: ["missing-note"] }],
    noteRegistry: [
      {
        id: "mem-1",
        type: "spec",
        status: "active",
        path: "vault/specs/spec.md",
        legacy_type: null,
        legacy_status: null,
        chunk_ids: ["chunk:mem-1:0000:aaaaaaaa"],
        validation_issues: ["missing_frontmatter_id", "missing_summary"],
      },
      {
        id: "mem-2",
        type: "todo",
        status: "active",
        path: "vault/tasks/todo.md",
        legacy_type: "repo-task",
        legacy_status: "In Progress",
        chunk_ids: ["chunk:mem-2:0000:bbbbbbbb", "chunk:mem-2:0001:cccccccc"],
        validation_issues: ["legacy_type_normalized", "legacy_status_normalized"],
      },
    ],
  });

  assert.equal(diagnostics.notes, 2);
  assert.equal(diagnostics.chunks, 3);
  assert.deepEqual(diagnostics.synthetic_ids, ["vault/specs/spec.md"]);
  assert.deepEqual(diagnostics.legacy_type_normalizations, [
    {
      path: "vault/tasks/todo.md",
      from: "repo-task",
      to: "todo",
    },
  ]);
  assert.deepEqual(diagnostics.status_normalizations, [
    {
      path: "vault/tasks/todo.md",
      from: "In Progress",
      to: "active",
    },
  ]);
  assert.deepEqual(diagnostics.validation_warnings, [
    "vault/specs/spec.md: missing frontmatter id; generated mem-1",
    "vault/specs/spec.md: missing summary",
  ]);
});
