const { createHash } = require("node:crypto");
const {
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} = require("node:fs/promises");
const path = require("node:path");
const process = require("node:process");
const { findProjectRoot } = require("workspace-tools");
const memorySchemaModulePromise = import("./memory-schema.mjs");

type FrontmatterScalar = string | boolean | number | null;
type FrontmatterList = FrontmatterScalar[];
type FrontmatterObject = Record<string, FrontmatterValue>;
type FrontmatterValue = FrontmatterScalar | FrontmatterList | FrontmatterObject;
type Frontmatter = Record<string, FrontmatterValue>;

type NoteType =
  | "repo-home"
  | "architecture-record"
  | "spec"
  | "session"
  | "todo"
  | "investigation"
  | "reference"
  | "glossary";

type NoteStatus =
  | "proposed"
  | "active"
  | "accepted"
  | "superseded"
  | "done"
  | "archived";

type CorpusChunk = {
  id: string;
  note_id: string;
  text: string;
  source_file: string;
  source_path: string;
  heading: string;
  heading_level: 2 | 0;
  note_type: NoteType;
  repo_slug: string | null;
  tags: string[];
  status: NoteStatus;
  summary: string | null;
  keywords: string[];
  mtime_ms: number;
};

type LegacyManifestFile = {
  mtime_ms: number;
  chunks: CorpusChunk[];
};

type LegacyManifest = {
  schema_version: 1;
  corpus: string;
  generated_at: string;
  files: Record<string, LegacyManifestFile>;
};

type LinkGroups = {
  parents: string[];
  children: string[];
  related: string[];
  supersedes: string[];
  superseded_by: string[];
};

type RegistryNote = {
  id: string;
  type: NoteType;
  repo_slug: string | null;
  path: string;
  title: string;
  status: NoteStatus;
  created: string;
  updated: string;
  summary: string;
  tags: string[];
  keywords: string[];
  chunk_ids: string[];
  outbound_links: string[];
  inbound_links: string[];
  content_hash: string;
  mtime_ms: number;
  owner: string | null;
  legacy_type: string | null;
  legacy_status: string | null;
};

type ChunkIndexEntry = {
  chunk_id: string;
  note_id: string;
  source_path: string;
  heading: string;
  heading_level: 2 | 0;
  text: string;
  summary: string;
  tokens_estimated: number;
  content_hash: string;
  type: NoteType;
  status: NoteStatus;
};

type GraphNode = {
  id: string;
  type: NoteType;
  status: NoteStatus;
};

type GraphEdge = {
  from: string;
  to: string;
  type:
    | "relates_to"
    | "implements"
    | "requires"
    | "spawned"
    | "resolved_by"
    | "summarizes"
    | "supersedes"
    | "superseded_by"
    | "explains"
    | "references";
};

type DiagnosticsReport = {
  schema_version: 2;
  generated_at: string;
  repo_slug: string | null;
  notes: number;
  chunks: number;
  notes_by_type: Record<string, number>;
  notes_by_status: Record<string, number>;
  synthetic_ids: string[];
  legacy_type_normalizations: Array<{
    path: string;
    from: string;
    to: NoteType;
  }>;
  status_normalizations: Array<{
    path: string;
    from: string;
    to: NoteStatus;
  }>;
  unresolved_links: Array<{
    from: string;
    targets: string[];
  }>;
  validation_warnings: string[];
};

type IndexedNote = {
  id: string;
  path: string;
  title: string;
  status: NoteStatus;
  type: NoteType;
  repoSlug: string | null;
  tags: string[];
  keywords: string[];
  summary: string;
  owner: string | null;
  created: string;
  updated: string;
  mtimeMs: number;
  contentHash: string;
  body: string;
  linkGroups: LinkGroups;
  legacyType: string | null;
  legacyStatus: string | null;
  syntheticId: boolean;
};

const repoRoot = findProjectRoot(__dirname, "pnpm");
const corpusName = "obsidian-vault";
const defaultVaultPath = path.join(repoRoot, "vault");
const defaultOutputDir = path.join(repoRoot, ".rag");
const skippedDirectoryNames = new Set([".obsidian", ".trash"]);
const skippedRelativeDirectories = new Set(["90 Templates", "91 Scripts"]);
const allowedStatusesByType: Record<NoteType, Set<NoteStatus>> = {
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
const typeAliases = new Map<string, NoteType>([
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
const edgeTypeByLinkGroup: Record<keyof LinkGroups, GraphEdge["type"]> = {
  parents: "relates_to",
  children: "relates_to",
  related: "relates_to",
  supersedes: "supersedes",
  superseded_by: "superseded_by",
};

function parseArgs(argv: string[]) {
  const options = {
    allowUnresolvedLinks: false,
    force: false,
    json: false,
    outputDir: defaultOutputDir,
    vaultPath: defaultVaultPath,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--force") {
      options.force = true;
      continue;
    }

    if (arg === "--json") {
      options.json = true;
      continue;
    }

    if (arg === "--allow-unresolved-links") {
      options.allowUnresolvedLinks = true;
      continue;
    }

    if (arg === "--vault") {
      options.vaultPath = path.resolve(process.cwd(), argv[index + 1] ?? "");
      index += 1;
      continue;
    }

    if (arg === "--output-dir") {
      options.outputDir = path.resolve(process.cwd(), argv[index + 1] ?? "");
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }
  }

  return options;
}

function printUsage() {
  console.log(
    [
      "Usage:",
      "  pnpm rag:index [--force] [--json] [--vault ./vault] [--output-dir ./.rag]",
      "",
      "Builds the typed Obsidian memory indexes under .rag/.",
    ].join("\n"),
  );
}

async function pathExists(targetPath: string) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile<T>(targetPath: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(targetPath, "utf8")) as T;
  } catch {
    return null;
  }
}

async function walkMarkdownFiles(
  rootDir: string,
  currentDir = rootDir,
): Promise<string[]> {
  const entries = await readdir(currentDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, "/");

    if (entry.isDirectory()) {
      if (
        skippedDirectoryNames.has(entry.name) ||
        skippedRelativeDirectories.has(relativePath) ||
        [...skippedRelativeDirectories].some((directory) =>
          relativePath.startsWith(`${directory}/`),
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

function parseFrontmatter(content: string) {
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

function parseYamlSubset(rawYaml: string): Frontmatter {
  const lines = rawYaml.split(/\r?\n/).map((line) => line.replace(/\t/g, "  "));
  return parseYamlMap(lines, 0, 0).value;
}

function parseYamlMap(
  lines: string[],
  startIndex: number,
  indentLevel: number,
): { value: Frontmatter; nextIndex: number } {
  const result: Frontmatter = {};
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

function parseYamlList(
  lines: string[],
  startIndex: number,
  indentLevel: number,
): { value: FrontmatterList; nextIndex: number } {
  const items: FrontmatterList = [];
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

function findNextContentIndex(lines: string[], startIndex: number) {
  for (let index = startIndex; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();

    if (trimmed && !trimmed.startsWith("#")) {
      return index;
    }
  }

  return -1;
}

function getIndentLevel(line: string) {
  return line.match(/^ */)?.[0].length ?? 0;
}

function parseScalar(rawValue: string): FrontmatterScalar | FrontmatterList {
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

function stripQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function toStringValue(value: FrontmatterValue | undefined) {
  return typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
    ? String(value)
    : null;
}

function toStringArray(value: FrontmatterValue | undefined) {
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

function toObjectValue(
  value: FrontmatterValue | undefined,
): FrontmatterObject | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as FrontmatterObject)
    : null;
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function estimateTokens(value: string) {
  if (!value) {
    return 0;
  }

  return Math.max(1, Math.ceil(value.length / 4));
}

function createHashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function createShortHash(value: string) {
  return createHashValue(value).slice(0, 16);
}

function extractDocumentTitle(body: string, relativeFile: string) {
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

function extractSummary(body: string) {
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

function resolveNoteType(
  rawType: string | null,
  relativeFile: string,
): { value: NoteType; normalized: boolean } {
  const normalizedRaw = rawType?.trim().toLowerCase() ?? null;
  const aliasMatch = normalizedRaw ? typeAliases.get(normalizedRaw) : null;

  if (aliasMatch) {
    return {
      value: aliasMatch,
      normalized: aliasMatch !== normalizedRaw,
    };
  }

  const inferred = inferTypeFromPath(relativeFile);
  return {
    value: inferred,
    normalized: normalizedRaw !== inferred,
  };
}

function inferTypeFromPath(relativeFile: string): NoteType {
  if (
    relativeFile === "00 Repo Home.md" ||
    /(^|\/)00 Repositories\/[^/]+\/00 Repo Home\.md$/.test(relativeFile)
  ) {
    return "repo-home";
  }

  if (
    relativeFile.startsWith("01 Architecture/") ||
    /(^|\/)01 Architecture\//.test(relativeFile)
  ) {
    return "architecture-record";
  }

  if (
    relativeFile.startsWith("02 Decisions/") ||
    /(^|\/)02 Decisions\//.test(relativeFile)
  ) {
    return "architecture-record";
  }

  if (
    relativeFile.startsWith("03 Sessions/") ||
    /(^|\/)03 Sessions\//.test(relativeFile)
  ) {
    return "session";
  }

  if (
    relativeFile.startsWith("04 Tasks/") ||
    /(^|\/)04 Tasks\//.test(relativeFile)
  ) {
    return "todo";
  }

  if (relativeFile.startsWith("specs/") || /(^|\/)specs\//.test(relativeFile)) {
    return "spec";
  }

  if (
    relativeFile.startsWith("investigations/") ||
    /(^|\/)investigations\//.test(relativeFile)
  ) {
    return "investigation";
  }

  if (
    relativeFile.startsWith("references/") ||
    /(^|\/)references\//.test(relativeFile)
  ) {
    return "reference";
  }

  if (
    relativeFile.startsWith("glossary/") ||
    /(^|\/)glossary\//.test(relativeFile)
  ) {
    return "glossary";
  }

  return "reference";
}

function resolveNoteStatus(
  rawStatus: string | null,
  noteType: NoteType,
): { value: NoteStatus; normalized: boolean } {
  const normalizedRaw = rawStatus?.trim().toLowerCase() ?? null;
  const alias = normalizeStatusAlias(normalizedRaw, noteType);

  if (alias && allowedStatusesByType[noteType].has(alias)) {
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

function normalizeStatusAlias(
  value: string | null,
  noteType: NoteType,
): NoteStatus | null {
  if (!value) {
    return null;
  }

  const statusAliases: Record<string, NoteStatus> = {
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

function defaultStatusForType(noteType: NoteType): NoteStatus {
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

function resolveDateString(
  frontmatter: Frontmatter,
  relativeFile: string,
  fallbackDate: string,
  keys: string[],
) {
  for (const key of keys) {
    const value = toStringValue(frontmatter[key]);

    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
  }

  const fileDateMatch = relativeFile.match(/^(\d{4}-\d{2}-\d{2})\b/);

  if (fileDateMatch) {
    return fileDateMatch[1];
  }

  return fallbackDate;
}

function extractLinkGroups(frontmatter: Frontmatter): LinkGroups {
  const links = toObjectValue(frontmatter.links);

  return {
    parents: toStringArray(links?.parents),
    children: toStringArray(links?.children),
    related: toStringArray(links?.related),
    supersedes: toStringArray(links?.supersedes),
    superseded_by: toStringArray(links?.superseded_by),
  };
}

function flattenLinkGroups(linkGroups: LinkGroups) {
  return Array.from(
    new Set(
      Object.values(linkGroups)
        .flat()
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function splitIntoHeadingChunks(body: string, documentTitle: string) {
  const lines = body.split(/\r?\n/);
  const chunks: { heading: string; headingLevel: 2 | 0; content: string }[] =
    [];
  let currentHeading = documentTitle || "Overview";
  let currentHeadingLevel: 2 | 0 = 0;
  let currentLines: string[] = [];

  function pushCurrent() {
    const content = currentLines.join("\n").trim();

    if (!content) {
      return;
    }

    chunks.push({
      heading: currentHeading,
      headingLevel: currentHeadingLevel,
      content,
    });
  }

  for (const line of lines) {
    const h1Match = line.match(/^#\s+(.+)$/);
    const h2Match = line.match(/^##\s+(.+)$/);

    if (h1Match) {
      pushCurrent();
      currentHeading = h1Match[1].trim();
      currentHeadingLevel = 0;
      currentLines = [];
      continue;
    }

    if (h2Match) {
      pushCurrent();
      currentHeading = h2Match[1].trim();
      currentHeadingLevel = 2;
      currentLines = [line];
      continue;
    }

    currentLines.push(line);
  }

  pushCurrent();

  return chunks.length > 0
    ? chunks
    : [{ heading: documentTitle || "Overview", headingLevel: 0, content: body }];
}

function createSyntheticNoteId(relativeFile: string) {
  return `mem-${createShortHash(relativeFile)}`;
}

function hasStrictFrontmatterShape(frontmatter: Frontmatter) {
  const requiredKeys = [
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

  return requiredKeys.every((key) => Object.hasOwn(frontmatter, key));
}

function normalizeStrictFrontmatterCandidate(frontmatter: Frontmatter): Frontmatter {
  const links = toObjectValue(frontmatter.links) ?? {};
  const retention = toObjectValue(frontmatter.retention) ?? {};

  return {
    ...frontmatter,
    links: {
      parents: toStringArray(links.parents),
      children: toStringArray(links.children),
      related: toStringArray(links.related),
      supersedes: toStringArray(links.supersedes),
      superseded_by: toStringArray(links.superseded_by),
    },
    retention: {
      review_after: toStringValue(retention.review_after),
      expires_after: toStringValue(retention.expires_after),
      keep: typeof retention.keep === "boolean" ? retention.keep : false,
    },
  };
}

function buildIndexedNote(input: {
  fallbackDate: string;
  frontmatter: Frontmatter;
  rawContent: string;
  relativeFile: string;
  body: string;
  mtimeMs: number;
}) {
  const rawType =
    toStringValue(input.frontmatter.type) ??
    toStringValue(input.frontmatter.note_type);
  const rawStatus = toStringValue(input.frontmatter.status);
  const noteType = resolveNoteType(rawType, input.relativeFile);
  const noteStatus = resolveNoteStatus(rawStatus, noteType.value);
  const title =
    toStringValue(input.frontmatter.title) ??
    extractDocumentTitle(input.body, input.relativeFile);
  const summary =
    toStringValue(input.frontmatter.summary) ?? extractSummary(input.body);
  const noteId =
    toStringValue(input.frontmatter.id) ??
    createSyntheticNoteId(input.relativeFile);
  const created = resolveDateString(
    input.frontmatter,
    input.relativeFile,
    input.fallbackDate,
    ["created", "date", "decided_on", "last_reviewed"],
  );
  const updated = resolveDateString(
    input.frontmatter,
    input.relativeFile,
    created,
    ["updated", "date", "last_reviewed"],
  );

  return {
    id: noteId,
    path: `vault/${input.relativeFile}`,
    title,
    status: noteStatus.value,
    type: noteType.value,
    repoSlug:
      toStringValue(input.frontmatter.repo_slug) ??
      toStringValue(input.frontmatter.repo) ??
      null,
    tags: toStringArray(input.frontmatter.tags),
    keywords: toStringArray(input.frontmatter.keywords),
    summary,
    owner: toStringValue(input.frontmatter.owner),
    created,
    updated,
    mtimeMs: input.mtimeMs,
    contentHash: createHashValue(input.rawContent),
    body: input.body,
    linkGroups: extractLinkGroups(input.frontmatter),
    legacyType: rawType,
    legacyStatus: rawStatus,
    syntheticId: !toStringValue(input.frontmatter.id),
    typeNormalized: noteType.normalized,
    statusNormalized: noteStatus.normalized,
  };
}

function createChunk({
  content,
  heading,
  headingLevel,
  note,
}: {
  content: string;
  heading: string;
  headingLevel: 2 | 0;
  note: IndexedNote;
}): CorpusChunk {
  const chunkPath = `${note.path} § ${heading}`;
  const metadataLines = [
    `Source: ${note.path}`,
    `Heading: ${heading}`,
    `Type: ${note.type}`,
    note.repoSlug ? `Repo: ${note.repoSlug}` : null,
    `Status: ${note.status}`,
    note.tags.length > 0 ? `Tags: ${note.tags.join(", ")}` : null,
    note.keywords.length > 0 ? `Keywords: ${note.keywords.join(", ")}` : null,
    note.summary ? `Summary: ${note.summary}` : null,
  ].filter(Boolean);

  return {
    id: createShortHash(chunkPath),
    note_id: note.id,
    text: `${metadataLines.join("\n")}\n\n${content.trim()}`.trim(),
    source_file: note.path,
    source_path: chunkPath,
    heading,
    heading_level: headingLevel,
    note_type: note.type,
    repo_slug: note.repoSlug,
    tags: note.tags,
    status: note.status,
    summary: note.summary,
    keywords: note.keywords,
    mtime_ms: note.mtimeMs,
  };
}

async function parseMarkdownFile(vaultPath: string, filePath: string) {
  const fileStat = await stat(filePath);
  const relativeFile = path.relative(vaultPath, filePath).replace(/\\/g, "/");
  const rawContent = await readFile(filePath, "utf8");
  const { parseMemoryMarkdown, validateFrontmatter } = await memorySchemaModulePromise;
  const parsed = parseMemoryMarkdown({
    path: `vault/${relativeFile}`,
    content: rawContent,
  });
  const { body, frontmatter } = parsed.ok
    ? parsed
    : parsed.error.code === "frontmatter.missing_block"
      ? { body: rawContent, frontmatter: {} }
      : (() => {
          throw new Error(`${parsed.error.code}: ${parsed.error.message}`);
        })();

  if (hasStrictFrontmatterShape(frontmatter)) {
    const validation = validateFrontmatter(
      normalizeStrictFrontmatterCandidate(frontmatter),
    );

    if (!validation.ok) {
      const [firstError] = validation.errors;
      throw new Error(`${firstError.code}: ${firstError.message}`);
    }
  }

  const fallbackDate = new Date(fileStat.mtimeMs).toISOString().slice(0, 10);
  const note = buildIndexedNote({
    fallbackDate,
    frontmatter,
    rawContent,
    relativeFile,
    body,
    mtimeMs: fileStat.mtimeMs,
  });
  const sections = splitIntoHeadingChunks(body, note.title);
  const chunks = sections.map((section) =>
    createChunk({
      content: section.content,
      heading: section.heading,
      headingLevel: section.headingLevel,
      note,
    }),
  );

  return {
    relativeFile,
    mtimeMs: fileStat.mtimeMs,
    note,
    chunks,
  };
}

function createChunkIndexEntry(chunk: CorpusChunk): ChunkIndexEntry {
  return {
    chunk_id: chunk.id,
    note_id: chunk.note_id,
    source_path: chunk.source_path,
    heading: chunk.heading,
    heading_level: chunk.heading_level,
    text: chunk.text,
    summary: chunk.summary ?? "",
    tokens_estimated: estimateTokens(chunk.text),
    content_hash: createHashValue(chunk.text),
    type: chunk.note_type,
    status: chunk.status,
  };
}

function isReusableManifestFile(file: LegacyManifestFile | undefined) {
  if (!file) {
    return false;
  }

  return file.chunks.every(
    (chunk) =>
      typeof chunk.note_id === "string" &&
      chunk.note_id.length > 0 &&
      typeof chunk.note_type === "string" &&
      allowedStatusesByType[chunk.note_type as NoteType] instanceof Set,
  );
}

function buildLexicalIndex(chunks: ChunkIndexEntry[]) {
  const terms: Record<string, string[]> = {};

  for (const chunk of chunks) {
    const tokens = chunk.text
      .toLowerCase()
      .replace(/[^a-z0-9/._-]+/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    for (const token of new Set(tokens)) {
      terms[token] ??= [];
      terms[token].push(chunk.chunk_id);
    }
  }

  for (const token of Object.keys(terms)) {
    terms[token].sort((left, right) => left.localeCompare(right));
  }

  return terms;
}

function buildGraphIndex(notes: RegistryNote[]) {
  const noteIds = new Set(notes.map((note) => note.id));
  const edges: GraphEdge[] = [];
  const unresolvedLinks: DiagnosticsReport["unresolved_links"] = [];

  for (const note of notes) {
    const groupedLinks = (note as RegistryNote & { link_groups?: LinkGroups })
      .link_groups;

    if (!groupedLinks) {
      continue;
    }

    const missingTargets = new Set<string>();

    for (const [group, targets] of Object.entries(groupedLinks) as Array<
      [keyof LinkGroups, string[]]
    >) {
      for (const target of targets) {
        if (!noteIds.has(target)) {
          missingTargets.add(target);
          continue;
        }

        edges.push({
          from: note.id,
          to: target,
          type: edgeTypeByLinkGroup[group],
        });
      }
    }

    if (missingTargets.size > 0) {
      unresolvedLinks.push({
        from: note.id,
        targets: Array.from(missingTargets).sort((left, right) =>
          left.localeCompare(right),
        ),
      });
    }
  }

  edges.sort(
    (left, right) =>
      left.from.localeCompare(right.from) ||
      left.to.localeCompare(right.to) ||
      left.type.localeCompare(right.type),
  );

  return {
    graph: {
      nodes: notes.map<GraphNode>((note) => ({
        id: note.id,
        type: note.type,
        status: note.status,
      })),
      edges,
    },
    unresolvedLinks,
  };
}

function countBy(items: string[]) {
  return items.reduce<Record<string, number>>((accumulator, item) => {
    accumulator[item] = (accumulator[item] ?? 0) + 1;
    return accumulator;
  }, {});
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const vaultPath = path.resolve(options.vaultPath);
  const outputDir = path.resolve(options.outputDir);
  const corpusPath = path.join(outputDir, `${corpusName}.corpus.json`);
  const legacyManifestPath = path.join(outputDir, `${corpusName}.manifest.json`);
  const manifestPath = path.join(outputDir, "manifest.json");
  const noteRegistryPath = path.join(outputDir, "note-registry.json");
  const chunkIndexPath = path.join(outputDir, "chunk-index.json");
  const lexicalIndexPath = path.join(outputDir, "lexical-index.json");
  const vectorIndexPath = path.join(outputDir, "vector-index.json");
  const graphIndexPath = path.join(outputDir, "graph-index.json");
  const diagnosticsPath = path.join(outputDir, "diagnostics.json");
  const cleanupReportPath = path.join(outputDir, "cleanup-report.json");

  if (!(await pathExists(vaultPath))) {
    throw new Error(
      `Vault not found at ${vaultPath}. Run pnpm rag:init first.`,
    );
  }

  const previousManifest = options.force
    ? null
    : await readJsonFile<LegacyManifest>(legacyManifestPath);
  const markdownFiles = await walkMarkdownFiles(vaultPath);
  const nextFiles: Record<string, LegacyManifestFile> = {};
  const notesByPath = new Map<string, IndexedNote>();
  let skippedFiles = 0;
  let updatedFiles = 0;

  for (const filePath of markdownFiles) {
    const relativeFile = path.relative(vaultPath, filePath).replace(/\\/g, "/");
    const fileStat = await stat(filePath);
    const previousFile = previousManifest?.files[relativeFile];
    const parsedFile = await parseMarkdownFile(vaultPath, filePath);

    notesByPath.set(relativeFile, parsedFile.note);

    if (
      previousFile &&
      previousFile.mtime_ms === fileStat.mtimeMs &&
      isReusableManifestFile(previousFile)
    ) {
      nextFiles[relativeFile] = previousFile;
      skippedFiles += 1;
      continue;
    }

    nextFiles[relativeFile] = {
      mtime_ms: fileStat.mtimeMs,
      chunks: parsedFile.chunks,
    };
    updatedFiles += 1;
  }

  const notes = Array.from(notesByPath.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, note]) => note);
  const chunks = Object.keys(nextFiles)
    .sort((left, right) => left.localeCompare(right))
    .flatMap((filePath) => nextFiles[filePath].chunks);
  const generatedAt = new Date().toISOString();
  const deletedFiles = Math.max(
    0,
    Object.keys(previousManifest?.files ?? {}).length -
      Object.keys(nextFiles).length,
  );

  const registryWithLinks = notes.map((note) => ({
    id: note.id,
    type: note.type,
    repo_slug: note.repoSlug,
    path: note.path,
    title: note.title,
    status: note.status,
    created: note.created,
    updated: note.updated,
    summary: note.summary,
    tags: note.tags,
    keywords: note.keywords,
    outbound_links: flattenLinkGroups(note.linkGroups),
    inbound_links: [],
    content_hash: note.contentHash,
    mtime_ms: note.mtimeMs,
    owner: note.owner,
    legacy_type: note.legacyType,
    legacy_status: note.legacyStatus,
    link_groups: note.linkGroups,
  }));

  const duplicateNoteIds = registryWithLinks.reduce<Map<string, string[]>>(
    (accumulator, note) => {
      const bucket = accumulator.get(note.id) ?? [];
      bucket.push(note.path);
      accumulator.set(note.id, bucket);
      return accumulator;
    },
    new Map(),
  );

  for (const [noteId, paths] of duplicateNoteIds.entries()) {
    if (paths.length > 1) {
      throw new Error(
        `registry.duplicate_id: Duplicate memory note id '${noteId}' in ${paths.join(", ")}`,
      );
    }
  }

  const notesById = new Map(registryWithLinks.map((note) => [note.id, note]));

  for (const note of registryWithLinks) {
    for (const target of note.outbound_links) {
      if (notesById.has(target)) {
        notesById.get(target)?.inbound_links.push(note.id);
      }
    }
  }

  const chunkIndex = chunks.map(createChunkIndexEntry);
  const chunkIdsByNoteId = chunkIndex.reduce<Map<string, string[]>>(
    (accumulator, chunk) => {
      const chunkIds = accumulator.get(chunk.note_id) ?? [];
      chunkIds.push(chunk.chunk_id);
      accumulator.set(chunk.note_id, chunkIds);
      return accumulator;
    },
    new Map(),
  );
  const noteRegistry = registryWithLinks
    .map<RegistryNote>((note) => ({
      ...note,
      chunk_ids: chunkIdsByNoteId.get(note.id) ?? [],
      inbound_links: Array.from(new Set(note.inbound_links)).sort((left, right) =>
        left.localeCompare(right),
      ),
    }))
    .map(({ link_groups: _linkGroups, ...note }) => note);
  const { graph, unresolvedLinks } = buildGraphIndex(registryWithLinks as Array<
    RegistryNote & { link_groups: LinkGroups }
  >);

  if (unresolvedLinks.length > 0 && !options.allowUnresolvedLinks) {
    const [firstUnresolvedLink] = unresolvedLinks;
    throw new Error(
      `links.target_missing: ${firstUnresolvedLink.from} references missing note ids ${firstUnresolvedLink.targets.join(", ")}`,
    );
  }

  const lexicalIndex = buildLexicalIndex(chunkIndex);
  const repoSlug = notes.find((note) => note.repoSlug)?.repoSlug ?? null;
  const validationWarnings = notes.flatMap((note) => {
    const warnings: string[] = [];

    if (note.syntheticId) {
      warnings.push(`${note.path}: missing frontmatter id; generated ${note.id}`);
    }

    if (!note.summary) {
      warnings.push(`${note.path}: missing summary`);
    }

    return warnings;
  });
  const diagnostics: DiagnosticsReport = {
    schema_version: 2,
    generated_at: generatedAt,
    repo_slug: repoSlug,
    notes: noteRegistry.length,
    chunks: chunkIndex.length,
    notes_by_type: countBy(noteRegistry.map((note) => note.type)),
    notes_by_status: countBy(noteRegistry.map((note) => note.status)),
    synthetic_ids: notes
      .filter((note) => note.syntheticId)
      .map((note) => note.path),
    legacy_type_normalizations: notes
      .filter(
        (note) =>
          !!note.legacyType &&
          note.legacyType.trim().toLowerCase() !== note.type,
      )
      .map((note) => ({
        path: note.path,
        from: note.legacyType ?? "unknown",
        to: note.type,
      })),
    status_normalizations: notes
      .filter(
        (note) =>
          !!note.legacyStatus &&
          normalizeStatusAlias(note.legacyStatus.trim().toLowerCase(), note.type) !==
            note.legacyStatus.trim().toLowerCase(),
      )
      .map((note) => ({
        path: note.path,
        from: note.legacyStatus ?? "unknown",
        to: note.status,
      })),
    unresolved_links: unresolvedLinks,
    validation_warnings: validationWarnings,
  };
  const combinedContentHash = createHashValue(
    JSON.stringify({
      noteRegistry,
      chunkIndex,
      graph,
    }),
  );
  const manifest = {
    schema_version: 2,
    repo_slug: repoSlug,
    generated_at: generatedAt,
    generator: "@playground/obsidian-memory",
    source_root: path.relative(repoRoot, vaultPath) || "vault",
    index_root: path.relative(repoRoot, outputDir) || ".rag",
    notes: noteRegistry.length,
    chunks: chunkIndex.length,
    content_hash: `sha256:${combinedContentHash}`,
  };
  const corpus = {
    schema_version: 1,
    corpus: corpusName,
    generated_at: generatedAt,
    repo_root: repoRoot,
    vault_root: vaultPath,
    chunk_count: chunks.length,
    chunks,
  };
  const legacyManifest: LegacyManifest = {
    schema_version: 1,
    corpus: corpusName,
    generated_at: generatedAt,
    files: nextFiles,
  };
  const cleanupReport = {
    schema_version: 2,
    generated_at: generatedAt,
    stale_generated_files: [],
    duplicate_notes: [],
    orphan_notes: [],
    sessions_to_summarize: [],
    specs_to_archive: [],
    apply_generated_safe: true,
  };
  const vectorIndex = {
    schema_version: 2,
    generated_at: generatedAt,
    status: "not_configured",
    engine: null,
    embeddings: [],
  };
  const summary = {
    files: markdownFiles.length,
    notes: noteRegistry.length,
    chunks: chunkIndex.length,
    updated: updatedFiles,
    skipped: skippedFiles,
    deleted: deletedFiles,
    manifest_path: path.relative(repoRoot, manifestPath),
    note_registry_path: path.relative(repoRoot, noteRegistryPath),
    chunk_index_path: path.relative(repoRoot, chunkIndexPath),
    graph_index_path: path.relative(repoRoot, graphIndexPath),
    diagnostics_path: path.relative(repoRoot, diagnosticsPath),
    corpus_path: path.relative(repoRoot, corpusPath),
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(
    noteRegistryPath,
    `${JSON.stringify(noteRegistry, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    chunkIndexPath,
    `${JSON.stringify(chunkIndex, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    lexicalIndexPath,
    `${JSON.stringify(
      {
        schema_version: 2,
        generated_at: generatedAt,
        terms: lexicalIndex,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  await writeFile(
    vectorIndexPath,
    `${JSON.stringify(vectorIndex, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    graphIndexPath,
    `${JSON.stringify(
      {
        schema_version: 2,
        generated_at: generatedAt,
        ...graph,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  await writeFile(
    diagnosticsPath,
    `${JSON.stringify(diagnostics, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    cleanupReportPath,
    `${JSON.stringify(cleanupReport, null, 2)}\n`,
    "utf8",
  );
  await writeFile(corpusPath, `${JSON.stringify(corpus, null, 2)}\n`, "utf8");
  await writeFile(
    legacyManifestPath,
    `${JSON.stringify(legacyManifest, null, 2)}\n`,
    "utf8",
  );

  if (options.json) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log(`Indexed ${summary.chunks} chunks from ${summary.notes} notes.`);
  console.log(
    `Updated ${summary.updated} files, skipped ${summary.skipped}, deleted ${summary.deleted}.`,
  );
  console.log(`Manifest: ${summary.manifest_path}`);
  console.log(`Note registry: ${summary.note_registry_path}`);
  console.log(`Chunk index: ${summary.chunk_index_path}`);
  console.log(`Graph index: ${summary.graph_index_path}`);
  console.log(`Diagnostics: ${summary.diagnostics_path}`);
  console.log(`Compatibility corpus: ${summary.corpus_path}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
