import { readdir, readFile, stat, writeFile } from "node:fs/promises";
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

const TYPE_ALIASES = new Map([
  ["repo", "repo-home"],
  ["repo-home", "repo-home"],
  ["repo-architecture", "architecture-record"],
  ["repo-decision", "architecture-record"],
  ["architecture-record", "architecture-record"],
  ["spec", "spec"],
  ["repo-spec", "spec"],
  ["repo-session", "session"],
  ["session", "session"],
  ["session-note", "session"],
  ["todo", "todo"],
  ["repo-task", "todo"],
  ["repo-tasks", "todo"],
  ["task", "todo"],
  ["investigation", "investigation"],
  ["reference", "reference"],
  ["glossary", "glossary"],
]);

const LEGACY_FRONTMATTER_DROP_KEYS = new Set([
  "date",
  "note_type",
  "repo",
]);

const DEFAULT_OWNER_BY_TYPE = {
  "repo-home": "morten",
  "architecture-record": "morten",
  spec: "morten",
  session: "agent",
  todo: "morten",
  investigation: "agent",
  reference: "morten",
  glossary: "morten",
};

const SKIPPED_DIRECTORY_NAMES = new Set([".obsidian", ".trash"]);
const SKIPPED_RELATIVE_DIRECTORIES = new Set(["90 Templates", "91 Scripts"]);

function normalize(value) {
  return value.toLowerCase();
}

function createShortHash(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(16).padStart(8, "0");
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

function parseFrontmatter(content) {
  if (!content.startsWith("---\n")) {
    return { frontmatter: {}, body: content };
  }

  const closeIndex = content.indexOf("\n---", 4);

  if (closeIndex === -1) {
    return { frontmatter: {}, body: content };
  }

  const rawFrontmatter = content.slice(4, closeIndex).trimEnd();
  const body = content.slice(closeIndex + 5).replace(/^\r?\n/, "");

  return {
    frontmatter: parseYamlSubset(rawFrontmatter),
    body,
  };
}

function parseYamlSubset(rawYaml) {
  const lines = rawYaml.split(/\r?\n/).map((line) => line.replace(/\t/g, "  "));
  return parseYamlMap(lines, 0, 0).value;
}

function parseYamlMap(lines, startIndex, indentLevel) {
  const result = {};
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      index += 1;
      continue;
    }

    const currentIndent = getIndentLevel(line);

    if (currentIndent < indentLevel) {
      break;
    }

    if (currentIndent > indentLevel) {
      index += 1;
      continue;
    }

    const match = trimmed.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);

    if (!match) {
      index += 1;
      continue;
    }

    const [, key, rawValue = ""] = match;

    if (rawValue !== "") {
      result[key] = parseScalar(rawValue);
      index += 1;
      continue;
    }

    const nextIndex = findNextContentIndex(lines, index + 1);

    if (nextIndex === -1 || getIndentLevel(lines[nextIndex]) <= currentIndent) {
      result[key] = null;
      index += 1;
      continue;
    }

    const nestedIndent = getIndentLevel(lines[nextIndex]);
    const nestedTrimmed = lines[nextIndex].trim();

    if (nestedTrimmed.startsWith("- ")) {
      const parsedList = parseYamlList(lines, nextIndex, nestedIndent);
      result[key] = parsedList.value;
      index = parsedList.nextIndex;
      continue;
    }

    const nestedMap = parseYamlMap(lines, nextIndex, nestedIndent);
    result[key] = nestedMap.value;
    index = nestedMap.nextIndex;
  }

  return { value: result, nextIndex: index };
}

function parseYamlList(lines, startIndex, indentLevel) {
  const items = [];
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      index += 1;
      continue;
    }

    const currentIndent = getIndentLevel(line);

    if (currentIndent < indentLevel) {
      break;
    }

    if (currentIndent !== indentLevel || !trimmed.startsWith("- ")) {
      break;
    }

    items.push(parseScalar(trimmed.slice(2).trim()));
    index += 1;
  }

  return { value: items, nextIndex: index };
}

function findNextContentIndex(lines, startIndex) {
  for (let index = startIndex; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();

    if (trimmed && !trimmed.startsWith("#")) {
      return index;
    }
  }

  return -1;
}

function getIndentLevel(line) {
  return line.match(/^ */)?.[0].length ?? 0;
}

function parseScalar(rawValue) {
  const value = rawValue.trim();

  if (value === "" || value === "null" || value === "~") {
    return null;
  }

  if (value === "[]") {
    return [];
  }

  if (value.startsWith("[") && value.endsWith("]")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((item) => stripQuotes(item.trim()))
      .filter(Boolean);
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  if (/^-?\d+(?:\.\d+)?$/.test(value)) {
    return Number(value);
  }

  return stripQuotes(value);
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function toStringValue(value) {
  return typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
    ? String(value)
    : null;
}

function toStringArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "string" ||
        typeof item === "number" ||
        typeof item === "boolean"
          ? String(item)
          : "",
      )
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function toObjectValue(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : null;
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function extractDocumentTitle(body, relativeFile) {
  const headingMatch = body.match(/^#\s+(.+)$/m);

  if (headingMatch) {
    return headingMatch[1].trim();
  }

  return path
    .basename(relativeFile, ".md")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSummary(body) {
  const paragraphs = body
    .split(/\r?\n\r?\n/)
    .map((block) =>
      block
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#") && !line.startsWith("- "))
        .join(" "),
    )
    .map(normalizeWhitespace)
    .filter(Boolean);

  return paragraphs[0] ?? "";
}

function normalizeComparableTitle(value) {
  return normalizeWhitespace(value)
    .replace(/[—–-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeBodyForStrictFrontmatter(body, title) {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  let startIndex = 0;

  while (startIndex < lines.length && lines[startIndex].trim() === "") {
    startIndex += 1;
  }

  const firstContentLine = lines[startIndex] ?? "";
  const headingMatch = firstContentLine.match(/^#\s+(.+)$/);

  if (
    headingMatch &&
    normalizeComparableTitle(headingMatch[1]) === normalizeComparableTitle(title)
  ) {
    startIndex += 1;

    while (startIndex < lines.length && lines[startIndex].trim() === "") {
      startIndex += 1;
    }
  }

  return lines
    .slice(startIndex)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function inferTypeFromRepoPath(relativeFile) {
  if (relativeFile === "00 Repo Home.md") {
    return "repo-home";
  }

  if (relativeFile.startsWith("01 Architecture/")) {
    return "architecture-record";
  }

  if (relativeFile.startsWith("02 Decisions/")) {
    return "architecture-record";
  }

  if (relativeFile.startsWith("03 Sessions/")) {
    return "session";
  }

  if (relativeFile.startsWith("04 Tasks/")) {
    return "todo";
  }

  if (relativeFile.startsWith("specs/")) {
    return "spec";
  }

  if (relativeFile.startsWith("investigations/")) {
    return "investigation";
  }

  if (relativeFile.startsWith("references/")) {
    return "reference";
  }

  if (relativeFile.startsWith("glossary/")) {
    return "glossary";
  }

  return "reference";
}

function resolveNoteType(rawType, relativeFile) {
  const normalizedRaw = rawType?.trim().toLowerCase() ?? null;
  const aliasMatch = normalizedRaw ? TYPE_ALIASES.get(normalizedRaw) : null;

  if (aliasMatch) {
    return {
      value: aliasMatch,
      normalized: aliasMatch !== normalizedRaw,
    };
  }

  const inferred = inferTypeFromRepoPath(relativeFile);
  return {
    value: inferred,
    normalized: normalizedRaw !== inferred,
  };
}

function normalizeStatusAlias(value, noteType) {
  if (!value) {
    return null;
  }

  const statusAliases = {
    proposed: "proposed",
    backlog: "proposed",
    draft: "proposed",
    active: "active",
    ready: "active",
    "in progress": "active",
    accepted: "accepted",
    current: "accepted",
    superseded: "superseded",
    done: "done",
    complete: "done",
    completed: "done",
    archived: "archived",
  };
  const alias = statusAliases[value] ?? null;

  if (alias === "active" && noteType === "architecture-record") {
    return "accepted";
  }

  return alias;
}

function defaultStatusForType(noteType) {
  switch (noteType) {
    case "repo-home":
      return "active";
    case "architecture-record":
      return "accepted";
    case "reference":
    case "glossary":
      return "accepted";
    case "spec":
    case "session":
    case "todo":
    case "investigation":
      return "active";
  }
}

function resolveNoteStatus(rawStatus, noteType) {
  const normalizedRaw = rawStatus?.trim().toLowerCase() ?? null;
  const alias = normalizeStatusAlias(normalizedRaw, noteType);

  if (alias && ALLOWED_STATUSES_BY_TYPE[noteType].has(alias)) {
    return {
      value: alias,
      normalized: normalizedRaw !== alias,
    };
  }

  const fallback = defaultStatusForType(noteType);
  return {
    value: fallback,
    normalized: normalizedRaw !== fallback,
  };
}

function resolveDateString(frontmatter, relativeFile, fallbackDate, keys) {
  for (const key of keys) {
    const value = toStringValue(frontmatter[key]);

    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    if (value) {
      const timestampMatch = value.match(/^(\d{4}-\d{2}-\d{2})\b/);

      if (timestampMatch) {
        return timestampMatch[1];
      }
    }
  }

  const fileDateMatch = path.basename(relativeFile).match(/^(\d{4}-\d{2}-\d{2})\b/);

  if (fileDateMatch) {
    return fileDateMatch[1];
  }

  return fallbackDate;
}

function extractLinkGroups(frontmatter) {
  const links = toObjectValue(frontmatter.links);

  return {
    parents: toStringArray(links?.parents),
    children: toStringArray(links?.children),
    related: toStringArray(links?.related),
    supersedes: toStringArray(links?.supersedes),
    superseded_by: toStringArray(links?.superseded_by),
  };
}

function buildRetention(noteType, existingRetention, createdAt) {
  const baseConfig = noteType === "repo-home"
    ? { reviewAfterDays: 180, expiresAfterDays: null, keep: true }
    : getWriteTypeConfig(noteType);
  const retention = toObjectValue(existingRetention);

  return {
    review_after:
      toStringValue(retention?.review_after) ??
      (baseConfig.reviewAfterDays === null
        ? null
        : formatDate(addDays(createdAt, baseConfig.reviewAfterDays))),
    expires_after:
      toStringValue(retention?.expires_after) ??
      (baseConfig.expiresAfterDays === null
        ? null
        : formatDate(addDays(createdAt, baseConfig.expiresAfterDays))),
    keep:
      typeof retention?.keep === "boolean"
        ? retention.keep
        : Boolean(baseConfig.keep),
  };
}

function renderYamlValue(value, indentLevel = 0) {
  const indent = " ".repeat(indentLevel);

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${indent}[]`;
    }

    return value
      .map((item) => `${indent}- ${renderYamlScalar(item)}`)
      .join("\n");
  }

  if (value && typeof value === "object") {
    const lines = [];

    for (const [key, nestedValue] of Object.entries(value)) {
      if (Array.isArray(nestedValue)) {
        if (nestedValue.length === 0) {
          lines.push(`${indent}${key}: []`);
        } else {
          lines.push(`${indent}${key}:`);
          lines.push(renderYamlValue(nestedValue, indentLevel + 2));
        }
        continue;
      }

      if (nestedValue && typeof nestedValue === "object") {
        lines.push(`${indent}${key}:`);
        lines.push(renderYamlValue(nestedValue, indentLevel + 2));
        continue;
      }

      lines.push(`${indent}${key}: ${renderYamlScalar(nestedValue)}`);
    }

    return lines.join("\n");
  }

  return `${indent}${renderYamlScalar(value)}`;
}

function renderYamlScalar(value) {
  if (value === null) {
    return "null";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "number") {
    return String(value);
  }

  return JSON.stringify(String(value));
}

function renderFrontmatter(frontmatter) {
  const preferredOrder = [
    "id",
    "type",
    "repo_slug",
    "title",
    "status",
    "created",
    "updated",
    "owner",
    "summary",
    "tags",
    "keywords",
    "links",
    "retention",
  ];

  const orderedEntries = [];

  for (const key of preferredOrder) {
    if (Object.hasOwn(frontmatter, key)) {
      orderedEntries.push([key, frontmatter[key]]);
    }
  }

  for (const key of Object.keys(frontmatter).sort((left, right) => left.localeCompare(right))) {
    if (!preferredOrder.includes(key)) {
      orderedEntries.push([key, frontmatter[key]]);
    }
  }

  return [
    "---",
    ...orderedEntries.flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return [`${key}: []`];
        }

        return [`${key}:`, renderYamlValue(value, 2)];
      }

      if (value && typeof value === "object") {
        return [`${key}:`, renderYamlValue(value, 2)];
      }

      return [`${key}: ${renderYamlScalar(value)}`];
    }),
    "---",
  ].join("\n");
}

async function walkMarkdownFiles(rootDir, currentDir = rootDir) {
  const entries = await readdir(currentDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, "/");

    if (entry.isDirectory()) {
      if (
        SKIPPED_DIRECTORY_NAMES.has(entry.name) ||
        SKIPPED_RELATIVE_DIRECTORIES.has(relativePath) ||
        [...SKIPPED_RELATIVE_DIRECTORIES].some((directory) =>
          relativePath.startsWith(`${directory}/`)
        )
      ) {
        continue;
      }

      files.push(...(await walkMarkdownFiles(rootDir, fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function estimateTokens(value) {
  if (!value) {
    return 0;
  }

  return Math.max(1, Math.ceil(value.length / 4));
}

function classifyFrontmatterIssue(issue) {
  const normalizedReason = normalizeWhitespace(issue.reason ?? "");

  if (
    issue.reason === "missing_frontmatter_id" ||
    normalizedReason.includes("missing frontmatter id")
  ) {
    return {
      ...issue,
      category: "missing_frontmatter_id",
      blocking: false,
    };
  }

  if (normalizedReason.includes("missing summary")) {
    return {
      ...issue,
      category: "missing_summary",
      blocking: false,
    };
  }

  return {
    ...issue,
    category: "unknown",
    blocking: true,
  };
}

function summarizeCleanupIssues(cleanup) {
  const frontmatterIssues = cleanup.invalid_frontmatter.map(classifyFrontmatterIssue);

  return {
    frontmatter: {
      blocking: frontmatterIssues.filter((issue) => issue.blocking),
      advisory: frontmatterIssues.filter((issue) => !issue.blocking),
    },
  };
}

/**
 * Load the generated typed-memory artifacts for governance and doctor checks.
 */
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

/**
 * Return the write-time defaults for a typed memory note category.
 */
export function getWriteTypeConfig(noteType) {
  const config = WRITE_TYPE_CONFIG[noteType];

  if (!config) {
    throw new Error(`Unsupported note type: ${noteType}`);
  }

  return config;
}

/**
 * Build the canonical target path and stable note id for a new typed note.
 */
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

/**
 * Find still-active notes that would conflict with a pending typed write.
 */
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

/**
 * Render the strict typed-note template used by the write flow.
 */
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
      ...config.sections.flatMap((section) => [section, ""]),
      ].join("\n"),
  };
}

/**
 * Validate the minimum CLI inputs required to create a typed note.
 */
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

/**
 * Compute the metadata-only rewrite plan that normalizes one legacy note.
 */
export function planFrontmatterFix({
  absolutePath,
  repoSlug = "playground",
  relativeRepoPath,
  content,
  fallbackDate = formatDate(new Date()),
}) {
  const { frontmatter, body } = parseFrontmatter(content);
  const rawType = toStringValue(frontmatter.type) ?? toStringValue(frontmatter.note_type);
  const rawStatus = toStringValue(frontmatter.status);
  const noteType = resolveNoteType(rawType, relativeRepoPath);
  const noteStatus = resolveNoteStatus(rawStatus, noteType.value);
  const title =
    toStringValue(frontmatter.title) ?? extractDocumentTitle(body, relativeRepoPath);
  const normalizedBody = normalizeBodyForStrictFrontmatter(body, title);
  const summary =
    toStringValue(frontmatter.summary) ?? extractSummary(normalizedBody) ?? "";
  const created = resolveDateString(
    frontmatter,
    relativeRepoPath,
    fallbackDate,
    ["created", "date", "decided_on", "last_reviewed", "started_at"],
  );
  const updated = resolveDateString(
    frontmatter,
    relativeRepoPath,
    created,
    ["updated", "date", "last_reviewed", "started_at"],
  );
  const baseId = toStringValue(frontmatter.id) ??
    `mem-${created.replaceAll("-", "")}-${slugify(title) || createShortHash(relativeRepoPath)}`;
  const links = extractLinkGroups(frontmatter);
  const retention = buildRetention(
    noteType.value,
    frontmatter.retention,
    tryParseDate(`${created}T00:00:00.000Z`) ?? new Date(`${created}T00:00:00.000Z`),
  );
  const canonicalFrontmatter = {
    id: baseId,
    type: noteType.value,
    repo_slug:
      toStringValue(frontmatter.repo_slug) ??
      toStringValue(frontmatter.repo) ??
      repoSlug,
    title,
    status: noteStatus.value,
    created,
    updated,
    owner: toStringValue(frontmatter.owner) ?? DEFAULT_OWNER_BY_TYPE[noteType.value],
    summary,
    tags: toStringArray(frontmatter.tags),
    keywords: toStringArray(frontmatter.keywords),
    links,
    retention,
  };
  const extraFrontmatter = Object.fromEntries(
    Object.entries(frontmatter).filter(([key]) =>
      !Object.hasOwn(canonicalFrontmatter, key) &&
      !LEGACY_FRONTMATTER_DROP_KEYS.has(key)
    ),
  );
  const renderedContent = `${renderFrontmatter({
    ...canonicalFrontmatter,
    ...extraFrontmatter,
  })}\n\n${normalizedBody}\n`;
  const changes = [];

  if (!toStringValue(frontmatter.id)) {
    changes.push("add_id");
  }

  if (rawType !== noteType.value) {
    changes.push("normalize_type");
  }

  if (
    (toStringValue(frontmatter.repo_slug) ?? toStringValue(frontmatter.repo)) !==
    canonicalFrontmatter.repo_slug
  ) {
    changes.push("set_repo_slug");
  }

  if (!toStringValue(frontmatter.title)) {
    changes.push("add_title");
  }

  if (rawStatus !== noteStatus.value) {
    changes.push("normalize_status");
  }

  if (!toStringValue(frontmatter.created) && !toStringValue(frontmatter.date)) {
    changes.push("set_created");
  }

  if (!toStringValue(frontmatter.updated)) {
    changes.push("set_updated");
  }

  if (!toStringValue(frontmatter.owner)) {
    changes.push("set_owner");
  }

  if (!toStringValue(frontmatter.summary)) {
    changes.push("add_summary");
  }

  if (normalizedBody !== body.trim()) {
    changes.push("normalize_body");
  }

  const existingLinks = extractLinkGroups(frontmatter);
  if (JSON.stringify(existingLinks) !== JSON.stringify(links)) {
    changes.push("normalize_links");
  } else if (!toObjectValue(frontmatter.links)) {
    changes.push("add_links");
  }

  if (JSON.stringify(toObjectValue(frontmatter.retention) ?? {}) !== JSON.stringify(retention)) {
    changes.push("set_retention");
  }

  for (const legacyKey of LEGACY_FRONTMATTER_DROP_KEYS) {
    if (Object.hasOwn(frontmatter, legacyKey)) {
      changes.push(`drop_${legacyKey}`);
    }
  }

  return {
    absolutePath,
    relativeRepoPath,
    noteId: canonicalFrontmatter.id,
    noteType: canonicalFrontmatter.type,
    status: canonicalFrontmatter.status,
    title: canonicalFrontmatter.title,
    created: canonicalFrontmatter.created,
    updated: canonicalFrontmatter.updated,
    changes: Array.from(new Set(changes)),
      changed: changes.length > 0,
      content: renderedContent,
    };
}

/**
 * Dry-run or apply frontmatter normalization for notes within one repo vault.
 */
export async function fixFrontmatter({
  vaultRoot,
  repoSlug = "playground",
  apply = false,
  pathPrefix = "",
  limit = null,
  includeContentPreview = true,
}) {
  const repoRootPath = path.join(vaultRoot, "00 Repositories", repoSlug);
  const markdownFiles = await walkMarkdownFiles(repoRootPath);
  const normalizedPrefix = pathPrefix.replace(/^\/+|\/+$/g, "");
  const filteredFiles = normalizedPrefix.length === 0
    ? markdownFiles
    : markdownFiles.filter((absolutePath) => {
      const relativeRepoPath = path.relative(repoRootPath, absolutePath).replace(/\\/g, "/");
      return relativeRepoPath === normalizedPrefix ||
        relativeRepoPath.startsWith(`${normalizedPrefix}/`);
    });
  const plans = await Promise.all(
    filteredFiles.map(async (absolutePath) => {
      const rawContent = await readFile(absolutePath, "utf8");
      const relativeRepoPath = path.relative(repoRootPath, absolutePath).replace(/\\/g, "/");
      const fileStat = await stat(absolutePath);
      const fallbackDate = formatDate(new Date(fileStat.mtimeMs));

      return planFrontmatterFix({
        absolutePath,
        repoSlug,
        relativeRepoPath,
        content: rawContent,
        fallbackDate,
      });
    }),
  );

  const seenIds = new Map();
  for (const plan of plans) {
    const bucket = seenIds.get(plan.noteId) ?? [];
    bucket.push(plan);
    seenIds.set(plan.noteId, bucket);
  }

  for (const [noteId, bucket] of seenIds.entries()) {
    if (bucket.length < 2) {
      continue;
    }

    for (const plan of bucket) {
      const dedupedId = `${noteId}-${createShortHash(plan.relativeRepoPath)}`;
      plan.content = plan.content.replace(`id: ${JSON.stringify(noteId)}`, `id: ${JSON.stringify(dedupedId)}`);
      plan.noteId = dedupedId;
      plan.changed = true;
      plan.changes = Array.from(new Set([...plan.changes, "dedupe_id"]));
    }
  }

  const allChangedPlans = plans.filter((plan) => plan.changed);
  const changedPlans = allChangedPlans.slice(0, limit === null ? undefined : limit);

  const changeCounts = changedPlans.reduce((acc, plan) => {
    for (const change of plan.changes) {
      acc[change] = (acc[change] ?? 0) + 1;
    }

    return acc;
  }, {});

  if (apply) {
    await Promise.all(
      changedPlans.map((plan) => writeFile(plan.absolutePath, plan.content, "utf8")),
    );
  }

  return {
    dry_run: !apply,
    repo_slug: repoSlug,
    path_prefix: normalizedPrefix || null,
    scanned: filteredFiles.length,
    changed: changedPlans.length,
    unchanged: filteredFiles.length - allChangedPlans.length,
    total_candidates: allChangedPlans.length,
    limited: limit !== null && changedPlans.length < allChangedPlans.length,
    change_counts: Object.fromEntries(
      Object.entries(changeCounts).sort((left, right) => left[0].localeCompare(right[0])),
    ),
    notes: changedPlans.map((plan) => ({
      path: path.relative(vaultRoot, plan.absolutePath).replace(/\\/g, "/"),
      note_id: plan.noteId,
      type: plan.noteType,
      status: plan.status,
      created: plan.created,
      updated: plan.updated,
      title: plan.title,
      changes: plan.changes,
      content_preview: !apply && includeContentPreview ? plan.content : undefined,
    })),
  };
}

/**
 * Infer the most likely memory workflow and retrieval filters from free text.
 */
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

/**
 * Build the cleanup and governance backlog that `rag:doctor` should surface.
 */
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
    .filter((note) => note.type === "session" && note.status === "active")
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
    .map((note) => ({
      note,
      updatedAt: tryParseDate(note.updated) ?? tryParseDate(note.created),
    }))
    .filter(
      ({ note, updatedAt }) =>
        note.type !== "repo-home" &&
        note.status === "active" &&
        updatedAt &&
        daysBetween(updatedAt, now) > 7 &&
        (note.outbound_links?.length ?? 0) === 0 &&
        (inboundLinks.get(note.id)?.size ?? 0) === 0,
    )
    .map(({ note }) => ({
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

/**
 * List generated files that should not be present in the typed index root.
 */
export async function findStaleGeneratedFiles(indexRoot) {
  const entries = await readdir(indexRoot, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => !ALLOWED_GENERATED_FILES.has(fileName))
    .sort((left, right) => left.localeCompare(right));
}

/**
 * Verify that the typed memory indexes and registry satisfy hard invariants.
 */
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

/**
 * Assemble the full `rag:doctor` result and separate migration backlog from
 * hard failures so the CLI does not need to duplicate governance policy.
 */
export async function buildDoctorReport({
  vaultRoot,
  indexRoot,
  repoRoot,
  now = new Date(),
}) {
  const verification = await verifyTypedMemory({
    vaultRoot,
    indexRoot,
    repoRoot,
  });
  const artifacts = await loadTypedMemoryArtifacts(indexRoot);
  const staleGeneratedFiles = await findStaleGeneratedFiles(indexRoot);
  const cleanup = buildCleanupReport({
    noteRegistry: artifacts.noteRegistry,
    chunkIndex: artifacts.chunkIndex,
    diagnostics: artifacts.diagnostics,
    staleGeneratedFiles,
    now,
  });
  const cleanupIssues = summarizeCleanupIssues(cleanup);

  return {
    passed:
      verification.passed &&
      cleanupIssues.frontmatter.blocking.length === 0 &&
      cleanup.generated_files_to_delete.length === 0,
    checks: {
      init_check: verification.errors.filter((error) =>
        error.startsWith("Missing required source path"),
      ),
      schema_check: verification.errors.filter(
        (error) =>
          error.startsWith("Duplicate note id") ||
          error.startsWith("Invalid status/type combination") ||
          error.startsWith("Generated registry entry points outside"),
      ),
      link_check: verification.errors.filter((error) =>
        error.startsWith("Unresolved links present"),
      ),
      index_check: verification.errors.filter((error) =>
        error.startsWith("Missing required index file"),
      ),
      retrieval_fixture_check: {
        note_count: verification.summary.notes,
        chunk_count: verification.summary.chunks,
      },
      cleanup_dry_run: cleanup,
      cleanup_frontmatter_check: {
        advisory: cleanupIssues.frontmatter.advisory,
        blocking: cleanupIssues.frontmatter.blocking,
      },
      git_ignore_check: verification.errors.filter((error) =>
        error.includes(".gitignore"),
      ),
    },
    warnings: verification.warnings,
    verification_summary: {
      ...verification.summary,
      frontmatter_advisories: cleanupIssues.frontmatter.advisory.length,
      frontmatter_blockers: cleanupIssues.frontmatter.blocking.length,
    },
  };
}
