import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const REQUIRED_SOURCE_PATHS = [
  "00 Repositories",
  "90 Templates",
  "91 Scripts",
];

const WRITE_TYPE_CONFIG = {
  "architecture-record": {
    folder: "architecture",
    defaultStatus: "proposed",
    owner: "morten",
    keep: true,
    reviewAfterDays: 180,
    expiresAfterDays: null,
    sections: [
      "## Context",
      "## Decision",
      "## Alternatives considered",
      "## Consequences",
      "## Follow-up actions",
    ],
  },
  spec: {
    folder: "specs",
    defaultStatus: "active",
    owner: "morten",
    keep: true,
    reviewAfterDays: 30,
    expiresAfterDays: null,
    sections: [
      "## Goal",
      "## Non-goals",
      "## Current state",
      "## Proposed design",
      "## Implementation plan",
      "## Acceptance criteria",
      "## Verification",
      "## Open questions",
    ],
  },
  session: {
    folder: "sessions",
    defaultStatus: "active",
    owner: "agent",
    keep: false,
    reviewAfterDays: 14,
    expiresAfterDays: 180,
    sections: [
      "## Goal",
      "## Actions taken",
      "## Files touched",
      "## Findings",
      "## Decisions that need ADRs",
      "## Todos created",
      "## Next handoff",
    ],
  },
  todo: {
    folder: "todos",
    defaultStatus: "active",
    owner: "morten",
    keep: false,
    reviewAfterDays: 30,
    expiresAfterDays: null,
    sections: [
      "## Task",
      "## Why",
      "## Done when",
      "## Links",
    ],
  },
  investigation: {
    folder: "investigations",
    defaultStatus: "active",
    owner: "agent",
    keep: false,
    reviewAfterDays: 60,
    expiresAfterDays: 180,
    sections: [
      "## Question",
      "## Findings",
      "## Options",
      "## Recommendation",
      "## Uncertainty",
      "## Sources",
      "## Follow-up",
    ],
  },
  reference: {
    folder: "references",
    defaultStatus: "accepted",
    owner: "morten",
    keep: true,
    reviewAfterDays: 180,
    expiresAfterDays: null,
    sections: [
      "## Purpose",
      "## Commands",
      "## Notes",
      "## Related links",
    ],
  },
  glossary: {
    folder: "glossary",
    defaultStatus: "accepted",
    owner: "morten",
    keep: true,
    reviewAfterDays: 365,
    expiresAfterDays: null,
    sections: [
      "## Definition",
      "## Why it matters here",
      "## Related terms",
    ],
  },
};

const REQUIRED_INDEX_FILES = [
  "manifest.json",
  "note-registry.json",
  "chunk-index.json",
  "lexical-index.json",
  "vector-index.json",
  "graph-index.json",
  "diagnostics.json",
  "cleanup-report.json",
];

const ALLOWED_GENERATED_FILES = new Set([
  ...REQUIRED_INDEX_FILES,
  "obsidian-vault.corpus.json",
  "obsidian-vault.manifest.json",
]);

const ALLOWED_STATUSES_BY_TYPE = {
  "repo-home": new Set(["active", "archived"]),
  "architecture-record": new Set([
    "proposed",
    "accepted",
    "superseded",
    "archived",
  ]),
  spec: new Set(["proposed", "active", "done", "archived", "superseded"]),
  session: new Set(["active", "done", "archived"]),
  todo: new Set(["active", "done", "archived"]),
  investigation: new Set(["active", "done", "archived"]),
  reference: new Set(["active", "accepted", "archived", "superseded"]),
  glossary: new Set(["active", "accepted", "archived"]),
};

function normalize(value) {
  return value.toLowerCase();
}

function daysBetween(fromDate, toDate) {
  return Math.floor((toDate - fromDate) / (1000 * 60 * 60 * 24));
}

function tryParseDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function slugify(value) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function estimateTokens(value) {
  if (!value) {
    return 0;
  }

  return Math.max(1, Math.ceil(value.length / 4));
}

export async function loadTypedMemoryArtifacts(indexRoot) {
  const normalizedRoot = indexRoot.endsWith(".json")
    ? path.dirname(indexRoot)
    : indexRoot;

  const fileNames = [
    "manifest.json",
    "note-registry.json",
    "chunk-index.json",
    "graph-index.json",
    "diagnostics.json",
    "cleanup-report.json",
  ];

  const files = await Promise.all(
    fileNames.map(async (fileName) => [
      fileName,
      JSON.parse(await readFile(path.join(normalizedRoot, fileName), "utf8")),
    ]),
  );

  return {
    indexRoot: normalizedRoot,
    manifest: files.find(([fileName]) => fileName === "manifest.json")[1],
    noteRegistry: files.find(([fileName]) => fileName === "note-registry.json")[1],
    chunkIndex: files.find(([fileName]) => fileName === "chunk-index.json")[1],
    graphIndex: files.find(([fileName]) => fileName === "graph-index.json")[1],
    diagnostics: files.find(([fileName]) => fileName === "diagnostics.json")[1],
    cleanupReport: files.find(([fileName]) => fileName === "cleanup-report.json")[1],
  };
}

export function getWriteTypeConfig(noteType) {
  const config = WRITE_TYPE_CONFIG[noteType];

  if (!config) {
    throw new Error(`Unsupported note type: ${noteType}`);
  }

  return config;
}

export function buildWriteTargetPath({ vaultRoot, repoSlug, noteType, title, createdAt = new Date() }) {
  const config = getWriteTypeConfig(noteType);
  const datePrefix = formatDate(createdAt);
  const slug = slugify(title);
  const fileName = `${datePrefix} ${title}.md`;

  return {
    noteId: `mem-${datePrefix.replaceAll("-", "")}-${slug}`,
    relativePath: path.join(
      "00 Repositories",
      repoSlug,
      config.folder,
      fileName,
    ),
    absolutePath: path.join(
      vaultRoot,
      "00 Repositories",
      repoSlug,
      config.folder,
      fileName,
    ),
    slug,
  };
}

export function findWriteDuplicates({ noteRegistry, noteType, title, summary }) {
  const normalizedTitle = normalize(title);
  const normalizedSummary = normalize(summary ?? "");

  return noteRegistry.filter((note) => {
    if (note.type !== noteType) {
      return false;
    }

    const titleMatches = normalize(note.title) === normalizedTitle;
    const summaryMatches =
      normalizedSummary.length > 0 && normalize(note.summary ?? "") === normalizedSummary;
    const activeEnough = note.status !== "archived" && note.status !== "superseded";

    return activeEnough && (titleMatches || summaryMatches);
  });
}

export function renderTypedNoteTemplate({
  noteType,
  repoSlug,
  title,
  summary,
  owner,
  createdAt = new Date(),
}) {
  const config = getWriteTypeConfig(noteType);
  const created = formatDate(createdAt);
  const reviewAfter = config.reviewAfterDays === null
    ? "null"
    : `"${formatDate(addDays(createdAt, config.reviewAfterDays))}"`;
  const expiresAfter = config.expiresAfterDays === null
    ? "null"
    : `"${formatDate(addDays(createdAt, config.expiresAfterDays))}"`;
  const keep = config.keep ? "true" : "false";
  const slug = slugify(title);
  const noteId = `mem-${created.replaceAll("-", "")}-${slug}`;

  return {
    noteId,
    content: [
      "---",
      `id: "${noteId}"`,
      `type: "${noteType}"`,
      `repo_slug: "${repoSlug}"`,
      `title: "${title}"`,
      `status: "${config.defaultStatus}"`,
      `created: "${created}"`,
      `updated: "${created}"`,
      `owner: "${owner || config.owner}"`,
      `summary: "${summary}"`,
      "tags: []",
      "keywords: []",
      "links:",
      "  parents: []",
      "  children: []",
      "  related: []",
      "  supersedes: []",
      "  superseded_by: []",
      "retention:",
      `  review_after: ${reviewAfter}`,
      `  expires_after: ${expiresAfter}`,
      `  keep: ${keep}`,
      "---",
      "",
      `# ${title}`,
      "",
      ...config.sections.flatMap((section) => [section, ""]),
    ].join("\n"),
  };
}

export function validateWriteInput({ noteType, title, summary }) {
  if (!noteType) {
    throw new Error("--type is required");
  }

  getWriteTypeConfig(noteType);

  if (!title?.trim()) {
    throw new Error("--title is required");
  }

  if (!summary?.trim()) {
    throw new Error("--summary is required");
  }
}

export function classifyMemoryInput(input) {
  const trimmed = input.trim();
  const normalized = normalize(trimmed);

  const makeResponse = (
    requestIntent,
    expectedNoteType,
    reason,
    retrievalTypes,
  ) => ({
    request_intent: requestIntent,
    expected_note_type: expectedNoteType,
    reason,
    retrieval_filters: {
      type: retrievalTypes,
    },
  });

  if (
    /\b(we decided|decided to|decision|architecture decision|tradeoff)\b/.test(
      normalized,
    )
  ) {
    return makeResponse(
      "make_decision",
      "architecture-record",
      "This reads like a durable architecture or tooling decision.",
      ["architecture-record", "investigation", "spec"],
    );
  }

  if (/\b(what did we do|today|recent|recently|happened|session)\b/.test(normalized)) {
    return makeResponse(
      "summarise_session",
      "session",
      "This is asking for time-bounded work history and handoff context.",
      ["session", "todo", "spec"],
    );
  }

  if (/\b(what remains|open task|open todo|todo|remaining)\b/.test(normalized)) {
    return makeResponse(
      "create_todo",
      "todo",
      "This is centered on remaining actionable work rather than durable decisions.",
      ["todo", "spec", "session"],
    );
  }

  if (/\b(compare|investigate|research|options)\b/.test(normalized)) {
    return makeResponse(
      "investigate",
      "investigation",
      "This is exploratory and compares options without declaring a final decision.",
      ["investigation", "architecture-record", "spec"],
    );
  }

  if (/\b(what does|define|meaning|glossary)\b/.test(normalized)) {
    return makeResponse(
      "answer_question",
      "glossary",
      "This is asking for a stable repo-specific definition.",
      ["glossary", "reference", "repo-home"],
    );
  }

  if (/\b(clean|cleanup|doctor|health check)\b/.test(normalized)) {
    return makeResponse(
      "cleanup_memory",
      "todo",
      "This is asking for memory hygiene or a health-oriented workflow pass.",
      ["todo", "session", "spec", "architecture-record"],
    );
  }

  if (/\b(plan|spec|rebuild|implement|build)\b/.test(normalized)) {
    return makeResponse(
      "write_spec",
      "spec",
      "This describes future implementation work with multiple steps.",
      ["spec", "todo", "architecture-record"],
    );
  }

  return makeResponse(
    "answer_question",
    "reference",
    "This looks like a general question rather than a memory write request.",
    ["reference", "repo-home", "architecture-record"],
  );
}

export function buildCleanupReport({ noteRegistry, chunkIndex, diagnostics, now = new Date(), staleGeneratedFiles = [] }) {
  const inboundLinks = new Map(
    noteRegistry.map((note) => [note.id, new Set(note.inbound_links ?? [])]),
  );
  const chunkTextByNoteId = chunkIndex.reduce((acc, chunk) => {
    acc[chunk.note_id] ??= [];
    acc[chunk.note_id].push(chunk.text);
    return acc;
  }, {});
  const duplicateBuckets = new Map();

  for (const note of noteRegistry) {
    const key = `${normalize(note.title)}|${normalize(note.summary)}`;
    const bucket = duplicateBuckets.get(key) ?? [];
    bucket.push(note);
    duplicateBuckets.set(key, bucket);
  }

  const duplicateNotes = [...duplicateBuckets.values()]
    .filter((bucket) => bucket.length > 1)
    .map((bucket) => ({
      title: bucket[0].title,
      paths: bucket.map((note) => note.path).sort((left, right) =>
        left.localeCompare(right),
      ),
    }));

  const staleTodos = noteRegistry
    .filter((note) => note.type === "todo" && note.status === "active")
    .map((note) => ({
      note,
      updatedAt: tryParseDate(note.updated) ?? tryParseDate(note.created),
    }))
    .filter(({ updatedAt }) => updatedAt && daysBetween(updatedAt, now) > 30)
    .map(({ note, updatedAt }) => ({
      note_id: note.id,
      path: note.path,
      days_stale: daysBetween(updatedAt, now),
    }));

  const sessionsToSummarize = noteRegistry
    .filter((note) => note.type === "session")
    .map((note) => ({
      note,
      updatedAt: tryParseDate(note.updated) ?? tryParseDate(note.created),
    }))
    .filter(({ updatedAt }) => updatedAt && daysBetween(updatedAt, now) > 14)
    .map(({ note, updatedAt }) => ({
      note_id: note.id,
      path: note.path,
      days_old: daysBetween(updatedAt, now),
    }));

  const orphanNotes = noteRegistry
    .filter(
      (note) =>
        (note.outbound_links?.length ?? 0) === 0 &&
        (inboundLinks.get(note.id)?.size ?? 0) === 0 &&
        note.type !== "repo-home",
    )
    .map((note) => ({
      note_id: note.id,
      path: note.path,
      type: note.type,
    }));

  const oversizedNotes = noteRegistry
    .map((note) => {
      const text = (chunkTextByNoteId[note.id] ?? []).join("\n\n");
      return {
        note_id: note.id,
        path: note.path,
        estimated_tokens: estimateTokens(text),
      };
    })
    .filter((note) => note.estimated_tokens > 1200);

  const invalidFrontmatter = [
    ...diagnostics.synthetic_ids.map((path) => ({
      path,
      reason: "missing_frontmatter_id",
    })),
    ...diagnostics.validation_warnings.map((warning) => ({
      path: warning.split(":")[0],
      reason: warning,
    })),
  ];

  const archivableSpecs = noteRegistry
    .filter((note) => note.type === "spec" && note.status === "done")
    .map((note) => ({
      note,
      updatedAt: tryParseDate(note.updated) ?? tryParseDate(note.created),
    }))
    .filter(({ updatedAt }) => updatedAt && daysBetween(updatedAt, now) > 30)
    .map(({ note, updatedAt }) => ({
      note_id: note.id,
      path: note.path,
      days_done: daysBetween(updatedAt, now),
    }));

  const supersededDecisions = noteRegistry
    .filter(
      (note) => note.type === "architecture-record" && note.status === "superseded",
    )
    .map((note) => ({
      note_id: note.id,
      path: note.path,
    }));

  return {
    duplicate_notes: duplicateNotes,
    stale_todos: staleTodos,
    sessions_to_summarise: sessionsToSummarize,
    orphan_notes: orphanNotes,
    oversized_notes: oversizedNotes,
    invalid_frontmatter: invalidFrontmatter,
    archivable_specs: archivableSpecs,
    superseded_decisions: supersededDecisions,
    generated_files_to_delete: staleGeneratedFiles.map((fileName) => ({
      path: fileName,
    })),
  };
}

export async function findStaleGeneratedFiles(indexRoot) {
  const entries = await readdir(indexRoot, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => !ALLOWED_GENERATED_FILES.has(fileName))
    .sort((left, right) => left.localeCompare(right));
}

export async function verifyTypedMemory({ vaultRoot, indexRoot, repoRoot }) {
  const errors = [];
  const warnings = [];

  for (const relativePath of REQUIRED_SOURCE_PATHS) {
    try {
      const targetPath = path.join(vaultRoot, relativePath);
      const targetStat = await stat(targetPath);

      if (!targetStat.isDirectory()) {
        errors.push(`Required source path is not a directory: ${relativePath}`);
      }
    } catch {
      errors.push(`Missing required source path: ${relativePath}`);
    }
  }

  for (const fileName of REQUIRED_INDEX_FILES) {
    try {
      const fileStat = await stat(path.join(indexRoot, fileName));

      if (!fileStat.isFile()) {
        errors.push(`Required index file is not a file: ${fileName}`);
      }
    } catch {
      errors.push(`Missing required index file: ${fileName}`);
    }
  }

  const artifacts = await loadTypedMemoryArtifacts(indexRoot);
  const noteIds = new Map();

  for (const note of artifacts.noteRegistry) {
    if (noteIds.has(note.id)) {
      errors.push(`Duplicate note id: ${note.id}`);
    } else {
      noteIds.set(note.id, note.path);
    }

    if (!ALLOWED_STATUSES_BY_TYPE[note.type]?.has(note.status)) {
      errors.push(`Invalid status/type combination: ${note.type} -> ${note.status} (${note.path})`);
    }

    if (!note.path.startsWith("vault/")) {
      errors.push(`Generated registry entry points outside vault/: ${note.path}`);
    }

    if (
      note.path.includes("/90 Templates/") ||
      note.path.includes("/91 Scripts/") ||
      note.path.startsWith("vault/90 Templates/") ||
      note.path.startsWith("vault/91 Scripts/")
    ) {
      errors.push(`Template or script note was indexed as source memory: ${note.path}`);
    }
  }

  if (artifacts.diagnostics.synthetic_ids.length > 0) {
    warnings.push(
      `Synthetic note ids present for ${artifacts.diagnostics.synthetic_ids.length} notes.`,
    );
  }

  if (artifacts.diagnostics.unresolved_links.length > 0) {
    errors.push(
      `Unresolved links present for ${artifacts.diagnostics.unresolved_links.length} notes.`,
    );
  }

  if (typeof artifacts.manifest.source_root !== "string" || artifacts.manifest.source_root.length === 0) {
    errors.push("Manifest source_root is missing or invalid.");
  }

  const gitignoreContents = await readFile(path.join(repoRoot, ".gitignore"), "utf8");
  if (!gitignoreContents.includes(".rag/")) {
    errors.push("Missing .rag/ ignore rule in .gitignore");
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    summary: {
      notes: artifacts.noteRegistry.length,
      chunks: artifacts.chunkIndex.length,
      unresolved_links: artifacts.diagnostics.unresolved_links.length,
      synthetic_ids: artifacts.diagnostics.synthetic_ids.length,
    },
  };
}
