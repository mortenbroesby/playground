import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  buildCleanupReport,
  buildDoctorReport,
  buildWriteTargetPath,
  classifyMemoryInput,
  fixFrontmatter,
  findWriteDuplicates,
  planFrontmatterFix,
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

test("buildCleanupReport prefers registry validation issues over diagnostics-only derivation", () => {
  const report = buildCleanupReport({
    noteRegistry: [
      {
        id: "session-1",
        type: "session",
        path: "vault/sessions/session-1.md",
        title: "Session 1",
        status: "active",
        created: "2026-04-01",
        updated: "2026-04-01",
        summary: "",
        outbound_links: [],
        inbound_links: [],
        validation_issues: [
          "missing_frontmatter_id",
          "missing_summary",
          "unresolved_links",
        ],
      },
    ],
    chunkIndex: [
      {
        note_id: "session-1",
        text: "session body",
      },
    ],
    diagnostics: {
      synthetic_ids: [],
      validation_warnings: [],
    },
    now: new Date("2026-04-29T00:00:00.000Z"),
    staleGeneratedFiles: [],
  });

  assert.deepEqual(report.invalid_frontmatter, [
    {
      path: "vault/sessions/session-1.md",
      reason: "missing_frontmatter_id",
    },
    {
      path: "vault/sessions/session-1.md",
      reason: "missing_summary",
    },
  ]);
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

test("verifyTypedMemory uses registry validation issues when diagnostics are minimal", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "rag-governance-registry-issues-"));
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
          validation_status: "warning",
          validation_issues: [
            "missing_frontmatter_id",
            "unresolved_links",
          ],
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
        synthetic_ids: [],
        unresolved_links: [],
        validation_warnings: [],
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
  assert.equal(result.summary.synthetic_ids, 1);
  assert.equal(result.summary.unresolved_links, 1);
  assert.ok(result.errors.some((error) => error.startsWith("Unresolved links present")));
  assert.ok(result.warnings.some((warning) => warning.includes("Synthetic note ids")));
});

test("buildDoctorReport treats mechanical frontmatter backlog as advisory", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "rag-doctor-"));
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
          type: "session",
          path: "vault/03 Sessions/2026-04-29 Typed RAG.md",
          status: "active",
          title: "Typed RAG",
          summary: "",
          outbound_links: [],
          inbound_links: [],
          created: "2026-04-29",
          updated: "2026-04-29",
        },
      ]),
      "utf8",
    ),
    writeFile(
      path.join(indexRoot, "chunk-index.json"),
      JSON.stringify([
        {
          note_id: "mem-1",
          text: "Session body",
        },
      ]),
      "utf8",
    ),
    writeFile(path.join(indexRoot, "lexical-index.json"), "{}", "utf8"),
    writeFile(path.join(indexRoot, "vector-index.json"), "{}", "utf8"),
    writeFile(path.join(indexRoot, "graph-index.json"), JSON.stringify({ nodes: [], edges: [] }), "utf8"),
    writeFile(
      path.join(indexRoot, "diagnostics.json"),
      JSON.stringify({
        synthetic_ids: ["vault/03 Sessions/2026-04-29 Typed RAG.md"],
        unresolved_links: [],
        validation_warnings: [
          "vault/03 Sessions/2026-04-29 Typed RAG.md: missing frontmatter id; generated mem-1",
          "vault/03 Sessions/2026-04-29 Typed RAG.md: missing summary",
        ],
      }),
      "utf8",
    ),
    writeFile(path.join(indexRoot, "cleanup-report.json"), "{}", "utf8"),
  ]);

  const result = await buildDoctorReport({
    vaultRoot,
    indexRoot,
    repoRoot: tempRoot,
    now: new Date("2026-04-29T00:00:00.000Z"),
  });

  assert.equal(result.passed, true);
  assert.equal(result.checks.cleanup_frontmatter_check.blocking.length, 0);
  assert.equal(result.checks.cleanup_frontmatter_check.advisory.length, 3);
  assert.equal(result.verification_summary.frontmatter_advisories, 3);
  assert.equal(result.verification_summary.frontmatter_blockers, 0);
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
  assert.ok(!rendered.content.includes("# Add cleanup dry-run"));
});

test("findWriteDuplicates hard-fails only exact duplicate candidates and soft-flags heuristic matches", () => {
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

  assert.equal(duplicates.exact.length, 0);
  assert.equal(duplicates.heuristic.length, 1);
  assert.deepEqual(duplicates.heuristic[0].matchReasons, ["title"]);
});

test("findWriteDuplicates reports exact matches when title and summary both collide", () => {
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
    summary: "Spec for rebuilding repo memory.",
  });

  assert.equal(duplicates.exact.length, 1);
  assert.equal(duplicates.heuristic.length, 0);
  assert.deepEqual(duplicates.exact[0].matchReasons, ["title", "summary"]);
});

test("planFrontmatterFix normalizes legacy session metadata without changing the body", () => {
  const legacyContent = [
    "---",
    "type: repo-session",
    "repo: playground",
    "date: 2026-04-11",
    "started_at: 2026-04-11 21:00",
    "summary: Backfilled missing architecture memory notes.",
    "tags:",
    "  - type/session",
    "---",
    "",
    "# Architecture Memory Backfill",
    "",
    "## Goal",
    "",
    "Backfill the architecture notes.",
  ].join("\n");

  const plan = planFrontmatterFix({
    absolutePath: "/tmp/2026-04-11 Architecture Memory Backfill.md",
    repoSlug: "playground",
    relativeRepoPath: "03 Sessions/2026-04-11 Architecture Memory Backfill.md",
    content: legacyContent,
    fallbackDate: "2026-04-11",
  });

  assert.equal(plan.changed, true);
  assert.equal(plan.noteType, "session");
  assert.equal(plan.status, "active");
  assert.equal(plan.noteId, "mem-20260411-architecture-memory-backfill");
  assert.ok(plan.changes.includes("add_id"));
  assert.ok(plan.changes.includes("normalize_type"));
  assert.ok(plan.changes.includes("set_updated"));
  assert.ok(plan.changes.includes("set_owner"));
  assert.ok(plan.changes.includes("set_retention"));
  assert.ok(plan.changes.includes("drop_repo"));
  assert.ok(plan.changes.includes("drop_date"));
  assert.ok(plan.changes.includes("normalize_body"));
  assert.ok(plan.content.includes('type: "session"'));
  assert.ok(plan.content.includes('repo_slug: "playground"'));
  assert.ok(plan.content.includes('created: "2026-04-11"'));
  assert.ok(plan.content.includes('updated: "2026-04-11"'));
  assert.ok(plan.content.includes('owner: "agent"'));
  assert.ok(!plan.content.includes("# Architecture Memory Backfill"));
  assert.ok(plan.content.endsWith("Backfill the architecture notes.\n"));
});

test("planFrontmatterFix preserves session metadata fields used by the 2026-04-29 RAG note", () => {
  const legacyContent = [
    "---",
    "type: repo-session",
    "repo: playground",
    "date: 2026-04-29",
    "started_at: 2026-04-29 21:05",
    "branch: feat/rag-refactor",
    "summary: Started the typed index migration.",
    "keywords:",
    "  - rag",
    "touched_paths:",
    "  - tools/obsidian-memory/src/rag-index.ts",
    "---",
    "",
    "# RAG Typed Index Foundation",
    "",
    "## Summary",
    "",
    "Started the lowest-risk migration slice.",
  ].join("\n");

  const plan = planFrontmatterFix({
    absolutePath: "/tmp/2026-04-29 RAG Typed Index Foundation.md",
    repoSlug: "playground",
    relativeRepoPath: "03 Sessions/2026-04-29 RAG Typed Index Foundation.md",
    content: legacyContent,
    fallbackDate: "2026-04-29",
  });

  assert.equal(plan.noteType, "session");
  assert.ok(plan.content.includes('branch: "feat/rag-refactor"'));
  assert.ok(plan.content.includes('started_at: "2026-04-29 21:05"'));
  assert.ok(
    plan.content.includes('  - "tools/obsidian-memory/src/rag-index.ts"'),
  );
  assert.ok(plan.changes.includes("drop_repo"));
  assert.ok(plan.changes.includes("drop_date"));
});

test("planFrontmatterFix only suggests status for ambiguous spec migration cases", () => {
  const legacyContent = [
    "---",
    "type: spec",
    "repo: playground",
    "date: 2026-04-29",
    "summary: Rebuild the RAG memory system.",
    "---",
    "",
    "# Rebuild RAG Memory",
    "",
    "## Goal",
    "",
    "Rebuild the memory system safely.",
  ].join("\n");

  const plan = planFrontmatterFix({
    absolutePath: "/tmp/2026-04-29 Rebuild RAG Memory.md",
    repoSlug: "playground",
    relativeRepoPath: "specs/2026-04-29 Rebuild RAG Memory.md",
    content: legacyContent,
    fallbackDate: "2026-04-29",
  });

  assert.equal(plan.noteType, "spec");
  assert.equal(plan.status, "active");
  assert.equal(plan.suggestedStatus, "active");
  assert.equal(plan.suggestedStatusReason, "ambiguous_type_default_requires_review");
  assert.ok(plan.suggestedStatusAlternatives.includes("proposed"));
  assert.ok(plan.suggestedStatusAlternatives.includes("done"));
  assert.deepEqual(plan.blockingIssues, ["status_review_required"]);
  assert.ok(plan.changes.includes("suggest_status"));
  assert.ok(!plan.changes.includes("normalize_status"));
  assert.ok(plan.content.includes('status: "active"'));
});

test("planFrontmatterFix rejects malformed YAML frontmatter", () => {
  assert.throws(
    () =>
      planFrontmatterFix({
        absolutePath: "/tmp/rag.md",
        repoSlug: "playground",
        relativeRepoPath: "specs/rag.md",
        content: [
          "---",
          'id: "mem-20260430-rag"',
          "links:",
          "  related: [oops",
          "---",
          "",
          "# Broken",
        ].join("\n"),
      }),
    /frontmatter\.invalid_yaml/,
  );
});

test("fixFrontmatter dry-run reports changed notes and apply rewrites metadata in place", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "rag-fix-frontmatter-"));
  const vaultRoot = path.join(tempRoot, "vault");
  const repoVaultRoot = path.join(vaultRoot, "00 Repositories", "playground");
  const notePath = path.join(repoVaultRoot, "03 Sessions", "2026-04-25 Auto Query Mode.md");

  await mkdir(path.dirname(notePath), { recursive: true });
  await writeFile(
    notePath,
    [
      "---",
      "type: session-note",
      "repo: playground",
      "date: 2026-04-25",
      "summary: Added auto intent resolution.",
      "---",
      "",
      "# Auto Query Mode",
      "",
      "The body should survive unchanged.",
    ].join("\n"),
    "utf8",
  );

  const dryRun = await fixFrontmatter({
    vaultRoot,
    repoSlug: "playground",
    apply: false,
  });

  assert.equal(dryRun.dry_run, true);
  assert.equal(dryRun.scanned, 1);
  assert.equal(dryRun.changed, 1);
  assert.equal(dryRun.notes[0].path, "00 Repositories/playground/03 Sessions/2026-04-25 Auto Query Mode.md");
  assert.ok(dryRun.notes[0].changes.includes("normalize_type"));
  assert.ok(dryRun.notes[0].content_preview.includes('type: "session"'));

  const beforeApply = await readFile(notePath, "utf8");
  assert.ok(beforeApply.includes("type: session-note"));

  const applied = await fixFrontmatter({
    vaultRoot,
    repoSlug: "playground",
    apply: true,
  });

  assert.equal(applied.dry_run, false);
  assert.equal(applied.changed, 1);

  const rewritten = await readFile(notePath, "utf8");
  assert.ok(rewritten.includes('id: "mem-20260425-auto-query-mode"'));
  assert.ok(rewritten.includes('type: "session"'));
  assert.ok(rewritten.includes('repo_slug: "playground"'));
  assert.ok(rewritten.includes("The body should survive unchanged."));
  assert.ok(!rewritten.includes("type: session-note"));
  assert.ok(!rewritten.includes("repo: playground"));
});

test("fixFrontmatter supports pathPrefix, limit, and preview suppression for batched migration", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "rag-fix-frontmatter-batch-"));
  const vaultRoot = path.join(tempRoot, "vault");
  const repoVaultRoot = path.join(vaultRoot, "00 Repositories", "playground");
  const sessionNotePath = path.join(repoVaultRoot, "03 Sessions", "2026-04-25 Auto Query Mode.md");
  const architectureNotePath = path.join(repoVaultRoot, "01 Architecture", "Agent Hooks.md");

  await Promise.all([
    mkdir(path.dirname(sessionNotePath), { recursive: true }),
    mkdir(path.dirname(architectureNotePath), { recursive: true }),
  ]);

  await Promise.all([
    writeFile(
      sessionNotePath,
      [
        "---",
        "type: session-note",
        "repo: playground",
        "date: 2026-04-25",
        "summary: Added auto intent resolution.",
        "---",
        "",
        "# Auto Query Mode",
      ].join("\n"),
      "utf8",
    ),
    writeFile(
      architectureNotePath,
      [
        "---",
        "type: repo-architecture",
        "repo: playground",
        "status: active",
        "summary: Shared hook policy.",
        "---",
        "",
        "# Agent Hooks",
      ].join("\n"),
      "utf8",
    ),
  ]);

  const result = await fixFrontmatter({
    vaultRoot,
    repoSlug: "playground",
    apply: false,
    pathPrefix: "03 Sessions",
    limit: 1,
    includeContentPreview: false,
  });

  assert.equal(result.scanned, 1);
  assert.equal(result.total_candidates, 1);
  assert.equal(result.changed, 1);
  assert.equal(result.limited, false);
  assert.equal(result.notes.length, 1);
  assert.equal(result.notes[0].path, "00 Repositories/playground/03 Sessions/2026-04-25 Auto Query Mode.md");
  assert.equal(result.notes[0].content_preview, undefined);
  assert.equal(result.change_counts.normalize_type, 1);
});

test("fixFrontmatter does not auto-apply ambiguous status suggestions", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "rag-fix-frontmatter-status-review-"));
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

  const dryRun = await fixFrontmatter({
    vaultRoot,
    repoSlug: "playground",
    apply: false,
  });

  assert.equal(dryRun.changed, 1);
  assert.equal(dryRun.blocked, 1);
  assert.equal(dryRun.applied, 0);
  assert.equal(dryRun.status_review_only, false);
  assert.equal(dryRun.notes[0].suggested_status, "active");
  assert.equal(
    dryRun.notes[0].suggested_status_reason,
    "ambiguous_type_default_requires_review",
  );
  assert.ok(dryRun.notes[0].suggested_status_alternatives.includes("proposed"));
  assert.deepEqual(dryRun.notes[0].blocking_issues, ["status_review_required"]);
  assert.ok(dryRun.notes[0].changes.includes("suggest_status"));

  const targetedDryRun = await fixFrontmatter({
    vaultRoot,
    repoSlug: "playground",
    apply: false,
    statusReviewOnly: true,
  });

  assert.equal(targetedDryRun.status_review_only, true);
  assert.equal(targetedDryRun.changed, 1);
  assert.equal(targetedDryRun.notes.length, 1);
  assert.equal(targetedDryRun.notes[0].path, "00 Repositories/playground/specs/2026-04-29 Rebuild RAG Memory.md");

  const applied = await fixFrontmatter({
    vaultRoot,
    repoSlug: "playground",
    apply: true,
  });

  assert.equal(applied.changed, 1);
  assert.equal(applied.applied, 0);
  assert.equal(applied.blocked, 1);

  const unchanged = await readFile(specNotePath, "utf8");
  assert.ok(unchanged.includes("type: spec"));
  assert.ok(unchanged.includes("repo: playground"));
  assert.ok(!unchanged.includes('repo_slug: "playground"'));
});

test("fixFrontmatter can explicitly accept suggested statuses for blocked notes", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "rag-fix-frontmatter-accept-status-"));
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

  const applied = await fixFrontmatter({
    vaultRoot,
    repoSlug: "playground",
    apply: true,
    statusReviewOnly: true,
    acceptSuggestedStatus: true,
  });

  assert.equal(applied.status_review_only, true);
  assert.equal(applied.accept_suggested_status, true);
  assert.equal(applied.changed, 1);
  assert.equal(applied.blocked, 1);
  assert.equal(applied.applied, 1);

  const rewritten = await readFile(specNotePath, "utf8");
  assert.ok(rewritten.includes('repo_slug: "playground"'));
  assert.ok(rewritten.includes('status: "active"'));
  assert.ok(rewritten.includes('id: "mem-20260429-rebuild-rag-memory"'));
  assert.ok(!rewritten.includes("repo: playground"));
});
