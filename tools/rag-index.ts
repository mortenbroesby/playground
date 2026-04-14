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

type FrontmatterValue = string | string[] | boolean | number | null;

type Frontmatter = Record<string, FrontmatterValue>;

type CorpusChunk = {
  id: string;
  text: string;
  source_file: string;
  source_path: string;
  heading: string;
  heading_level: 2 | 0;
  note_type: string | null;
  repo_slug: string | null;
  tags: string[];
  status: string | null;
  summary: string | null;
  keywords: string[];
  mtime_ms: number;
};

type ManifestFile = {
  mtime_ms: number;
  chunks: CorpusChunk[];
};

type Manifest = {
  schema_version: 1;
  corpus: string;
  generated_at: string;
  files: Record<string, ManifestFile>;
};

const repoRoot = path.resolve(__dirname, "..");
const corpusName = "obsidian-vault";
const defaultVaultPath = path.join(repoRoot, "vault");
const defaultOutputDir = path.join(repoRoot, ".rag");
const skippedDirectoryNames = new Set([".obsidian", ".trash"]);
const skippedRelativeDirectories = new Set(["90 Templates", "91 Scripts"]);

function parseArgs(argv: string[]) {
  const options = {
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
      "Builds the portable obsidian-vault corpus under .rag/.",
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
  const result: Frontmatter = {};
  const lines = rawYaml.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (!line.trim() || line.trimStart().startsWith("#")) {
      continue;
    }

    const match = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);

    if (!match) {
      continue;
    }

    const [, key, rawValue = ""] = match;

    if (rawValue === "") {
      const list: string[] = [];
      let cursor = index + 1;

      while (cursor < lines.length) {
        const itemMatch = lines[cursor].match(/^\s+-\s*(.*)$/);

        if (!itemMatch) {
          break;
        }

        list.push(parseScalar(itemMatch[1])?.toString() ?? "");
        cursor += 1;
      }

      result[key] = list.length > 0 ? list : null;
      index = cursor - 1;
      continue;
    }

    result[key] = parseScalar(rawValue);
  }

  return result;
}

function parseScalar(rawValue: string): FrontmatterValue {
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
    return value.map(String).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function splitIntoHeadingChunks(body: string) {
  const lines = body.split(/\r?\n/);
  const chunks: { heading: string; headingLevel: 2 | 0; content: string }[] =
    [];
  let currentHeading = "Overview";
  let currentHeadingLevel: 2 | 0 = 0;
  let currentLines: string[] = [];
  let documentTitle: string | null = null;

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

    if (h1Match && !documentTitle) {
      documentTitle = h1Match[1].trim();
    }

    if (h2Match) {
      pushCurrent();
      currentHeading = h2Match[1].trim();
      currentHeadingLevel = 2;
      currentLines = [line];
      continue;
    }

    if (currentHeading === "Overview" && documentTitle) {
      currentHeading = documentTitle;
    }

    currentLines.push(line);
  }

  pushCurrent();

  return chunks.length > 0
    ? chunks
    : [{ heading: "Overview", headingLevel: 0, content: body }];
}

function createChunk({
  content,
  frontmatter,
  heading,
  headingLevel,
  mtimeMs,
  relativeFile,
}: {
  content: string;
  frontmatter: Frontmatter;
  heading: string;
  headingLevel: 2 | 0;
  mtimeMs: number;
  relativeFile: string;
}): CorpusChunk {
  const sourceFile = `vault/${relativeFile}`;
  const noteType =
    toStringValue(frontmatter.type) ?? toStringValue(frontmatter.note_type);
  const repoSlug =
    toStringValue(frontmatter.repo_slug) ?? toStringValue(frontmatter.repo);
  const statusValue = toStringValue(frontmatter.status);
  const summary = toStringValue(frontmatter.summary);
  const tags = toStringArray(frontmatter.tags);
  const keywords = toStringArray(frontmatter.keywords);
  const chunkPath = `${sourceFile} § ${heading}`;
  const metadataLines = [
    `Source: ${sourceFile}`,
    `Heading: ${heading}`,
    noteType ? `Type: ${noteType}` : null,
    repoSlug ? `Repo: ${repoSlug}` : null,
    statusValue ? `Status: ${statusValue}` : null,
    tags.length > 0 ? `Tags: ${tags.join(", ")}` : null,
    keywords.length > 0 ? `Keywords: ${keywords.join(", ")}` : null,
    summary ? `Summary: ${summary}` : null,
  ].filter(Boolean);

  return {
    id: createChunkId(chunkPath),
    text: `${metadataLines.join("\n")}\n\n${content.trim()}`.trim(),
    source_file: sourceFile,
    source_path: chunkPath,
    heading,
    heading_level: headingLevel,
    note_type: noteType,
    repo_slug: repoSlug,
    tags,
    status: statusValue,
    summary,
    keywords,
    mtime_ms: mtimeMs,
  };
}

function createChunkId(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

async function parseMarkdownFile(vaultPath: string, filePath: string) {
  const fileStat = await stat(filePath);
  const relativeFile = path.relative(vaultPath, filePath).replace(/\\/g, "/");
  const { body, frontmatter } = parseFrontmatter(
    await readFile(filePath, "utf8"),
  );
  const sections = splitIntoHeadingChunks(body);

  return sections.map((section) =>
    createChunk({
      content: section.content,
      frontmatter,
      heading: section.heading,
      headingLevel: section.headingLevel,
      mtimeMs: fileStat.mtimeMs,
      relativeFile,
    }),
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const vaultPath = path.resolve(options.vaultPath);
  const outputDir = path.resolve(options.outputDir);
  const corpusPath = path.join(outputDir, `${corpusName}.corpus.json`);
  const manifestPath = path.join(outputDir, `${corpusName}.manifest.json`);

  if (!(await pathExists(vaultPath))) {
    throw new Error(
      `Vault not found at ${vaultPath}. Run pnpm rag:init first.`,
    );
  }

  const previousManifest = options.force
    ? null
    : await readJsonFile<Manifest>(manifestPath);
  const markdownFiles = await walkMarkdownFiles(vaultPath);
  const nextFiles: Record<string, ManifestFile> = {};
  let skippedFiles = 0;
  let updatedFiles = 0;

  for (const filePath of markdownFiles) {
    const relativeFile = path.relative(vaultPath, filePath).replace(/\\/g, "/");
    const fileStat = await stat(filePath);
    const previousFile = previousManifest?.files[relativeFile];

    if (previousFile && previousFile.mtime_ms === fileStat.mtimeMs) {
      nextFiles[relativeFile] = previousFile;
      skippedFiles += 1;
      continue;
    }

    nextFiles[relativeFile] = {
      mtime_ms: fileStat.mtimeMs,
      chunks: await parseMarkdownFile(vaultPath, filePath),
    };
    updatedFiles += 1;
  }

  const chunks = Object.keys(nextFiles)
    .sort((left, right) => left.localeCompare(right))
    .flatMap((filePath) => nextFiles[filePath].chunks);
  const generatedAt = new Date().toISOString();
  const deletedFiles = Math.max(
    0,
    Object.keys(previousManifest?.files ?? {}).length -
      Object.keys(nextFiles).length,
  );
  const manifest: Manifest = {
    schema_version: 1,
    corpus: corpusName,
    generated_at: generatedAt,
    files: nextFiles,
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
  const summary = {
    corpus: corpusName,
    files: markdownFiles.length,
    chunks: chunks.length,
    updated: updatedFiles,
    skipped: skippedFiles,
    deleted: deletedFiles,
    corpus_path: path.relative(repoRoot, corpusPath),
    manifest_path: path.relative(repoRoot, manifestPath),
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(corpusPath, `${JSON.stringify(corpus, null, 2)}\n`, "utf8");
  await writeFile(
    manifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  if (options.json) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log(
    `Indexed ${summary.chunks} chunks from ${summary.files} vault notes.`,
  );
  console.log(
    `Updated ${summary.updated} files, skipped ${summary.skipped}, deleted ${summary.deleted}.`,
  );
  console.log(`Corpus: ${summary.corpus_path}`);
  console.log(`Manifest: ${summary.manifest_path}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
