import { spawnSync } from "node:child_process";
import { statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { findProjectRoot } from "workspace-tools";

import {
  findMemoryChunk,
  getMemoryContext,
  loadMemoryCorpus,
  planMemoryQuery,
  retrieveMemoryCandidates,
} from "./obsidian-rag.mjs";
import {
  buildCleanupReport,
  buildWriteTargetPath,
  classifyMemoryInput,
  findStaleGeneratedFiles,
  findWriteDuplicates,
  loadTypedMemoryArtifacts,
  renderTypedNoteTemplate,
  validateWriteInput,
} from "./rag-governance.mjs";
import { createRetrievalObservability } from "./retrieval-observability.mjs";

const defaultRepoRoot = findProjectRoot(path.dirname(fileURLToPath(import.meta.url)), "pnpm");

export function createMemoryService(options = {}) {
  const repoRoot = options.repoRoot ?? defaultRepoRoot;
  const vaultRoot = options.vaultRoot ?? (
    process.env.PLAYGROUND_OBSIDIAN_MEMORY_VAULT_ROOT
      ? path.resolve(process.env.PLAYGROUND_OBSIDIAN_MEMORY_VAULT_ROOT)
      : path.join(repoRoot, "vault")
  );
  const indexRoot = options.indexRoot ?? (
    process.env.PLAYGROUND_OBSIDIAN_MEMORY_INDEX_ROOT
      ? path.resolve(process.env.PLAYGROUND_OBSIDIAN_MEMORY_INDEX_ROOT)
      : path.join(repoRoot, ".rag")
  );
  const retrievalObservability =
    options.retrievalObservability ?? createRetrievalObservability({ indexRoot });

  let loadedCorpus = null;

  function ensureCorpus() {
    try {
      statSync(path.join(indexRoot, "manifest.json"));
      statSync(path.join(indexRoot, "chunk-index.json"));
      statSync(path.join(indexRoot, "note-registry.json"));
    } catch {
      const result = spawnSync("pnpm", ["rag:index"], {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: "pipe",
      });

      if (result.status !== 0) {
        throw new Error(
          `Unable to build typed memory indexes with pnpm rag:index.\n${result.stderr || result.stdout}`,
        );
      }
    }
  }

  async function loadCorpus() {
    ensureCorpus();

    const manifestPath = path.join(indexRoot, "manifest.json");
    const stat = statSync(manifestPath);

    if (loadedCorpus?.mtimeMs === stat.mtimeMs) {
      return loadedCorpus.value;
    }

    loadedCorpus = {
      mtimeMs: stat.mtimeMs,
      value: await loadMemoryCorpus(indexRoot),
    };

    return loadedCorpus.value;
  }

  async function searchMemory(args) {
    const corpus = await loadCorpus();
    const limit = Number.isFinite(args.limit)
      ? Math.max(1, Math.min(20, args.limit))
      : 5;
    const query = args.query.trim();
    const fullDetail = args.detail === "full";

    if (!query) {
      throw new Error("query is required");
    }

    const queryPlan = planMemoryQuery(query);
    const candidates = retrieveMemoryCandidates({
      corpus,
      query,
      limit,
      repoSlug: args.repo_slug,
      noteType: args.note_type,
      integrityMode: args.integrity_mode,
      vectorMode: args.vector_mode,
      retrievalMode: args.retrieval_mode,
      queryPlan,
    });
    const hits = candidates.filter((hit) => hasSubstantiveContent(hit));
    const retrievalSummary = formatRetrievalSummary(candidates.retrieval);

    if (hits.length === 0) {
      await retrievalObservability.logSearch({
        query,
        results: [],
      });
      return [`No memory results found for: ${query}`, retrievalSummary]
        .filter(Boolean)
        .join("\n");
    }

    await retrievalObservability.logSearch({
      query,
      results: hits.map((chunk, index) => ({
        rank: index + 1,
        chunkId: chunk.chunkId,
        noteId: chunk.noteId,
        sourcePath: chunk.sourcePath,
        sourceFile: chunk.sourceFile,
        heading: chunk.heading,
        score: chunk.score,
        weakUse: true,
        strongUse: false,
        retrievalSources: [...(chunk.retrievalSources ?? [])],
      })),
    });

    const formattedHits = hits.map((chunk, index) => {
      if (fullDetail) {
        return formatFullChunk(chunk, `#${index + 1} score=${chunk.score}`);
      }

      return [
        `#${index + 1} score=${chunk.score}`,
        `source_path: ${chunk.sourcePath}`,
        `type: ${chunk.noteType ?? "unknown"} status: ${chunk.status ?? "unknown"} repo: ${chunk.repoSlug ?? "unknown"}`,
        `heading: ${chunk.heading}`,
        chunk.summary ? `summary: ${chunk.summary}` : null,
        "",
        `excerpt: ${createExcerpt(contentOnly(chunk), query)}`,
      ]
        .filter((line) => line !== null)
        .join("\n");
    });

    if (fullDetail) {
      return [retrievalSummary, formattedHits.join("\n\n---\n\n")]
        .filter(Boolean)
        .join("\n\n");
    }

    return [
      "Compact memory results. Use memory_unfold with a source_path for detail.",
      retrievalSummary,
      "",
      formattedHits.join("\n\n---\n\n"),
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function unfoldMemory(args) {
    const corpus = await loadCorpus();
    const chunk = findMemoryChunk({
      corpus,
      sourcePath: args.source_path?.trim(),
      sourceFile: args.source_file?.trim(),
      heading: args.heading?.trim(),
    });

    if (!chunk) {
      throw new Error(
        "No memory chunk matched the provided source path or file plus heading.",
      );
    }

    await retrievalObservability.logUnfold({
      target: {
        chunkId: chunk.chunkId,
        noteId: chunk.noteId,
        sourcePath: chunk.sourcePath,
        sourceFile: chunk.sourceFile,
        heading: chunk.heading,
        strongUse: true,
      },
    });

    return formatFullChunk(chunk);
  }

  async function contextMemory(args) {
    const repoSlug = args.repo_slug ?? "playground";
    const fullDetail = args.detail === "full";
    const corpus = await loadCorpus();
    const chunks = getMemoryContext({
      corpus,
      repoSlug,
    });

    if (chunks.length === 0) {
      return searchMemory({
        query: `architecture spec plan memory ${repoSlug}`,
        limit: 5,
        repo_slug: repoSlug,
      });
    }

    await retrievalObservability.logContext({
      repoSlug,
      results: chunks.map((chunk, index) => ({
        rank: index + 1,
        chunkId: chunk.chunkId,
        noteId: chunk.noteId,
        sourcePath: chunk.sourcePath,
        sourceFile: chunk.sourceFile,
        heading: chunk.heading,
        score: chunk.score ?? null,
        weakUse: true,
        strongUse: false,
        retrievalSources: [...(chunk.retrievalSources ?? [])],
      })),
    });

    const formattedChunks = chunks.map((chunk) =>
      formatContextChunk(chunk, fullDetail),
    );

    if (fullDetail) {
      return formattedChunks.join("\n\n---\n\n");
    }

    return [
      `source_file: ${chunks[0].sourceFile}`,
      "Compact repo context. Use memory_unfold with source_file and heading for detail.",
      "",
      formattedChunks.join("\n\n"),
    ].join("\n");
  }

  function classifyInput(args) {
    const input = args.input?.trim();

    if (!input) {
      throw new Error("input is required");
    }

    return classifyMemoryInput(input);
  }

  async function proposeWrite(args) {
    validateWriteInput({
      noteType: args.note_type,
      title: args.title,
      summary: args.summary,
    });

    const artifacts = await loadTypedMemoryArtifacts(indexRoot);
    const duplicates = findWriteDuplicates({
      noteRegistry: artifacts.noteRegistry,
      noteType: args.note_type,
      title: args.title,
      summary: args.summary,
    });

    if (duplicates.exact.length > 0) {
      throw new Error(
        `Exact duplicate note candidate exists:\n${duplicates.exact.map((note) => `- ${note.path}`).join("\n")}`,
      );
    }

    const repoSlug = args.repo_slug ?? "playground";
    const target = buildWriteTargetPath({
      vaultRoot,
      repoSlug,
      noteType: args.note_type,
      title: args.title,
    });
    const rendered = renderTypedNoteTemplate({
      noteType: args.note_type,
      repoSlug,
      title: args.title,
      summary: args.summary,
      owner: args.owner,
    });

    return {
      note_id: rendered.noteId,
      type: args.note_type,
      path: path.relative(repoRoot, target.absolutePath),
      repo_slug: repoSlug,
      dry_run: true,
      duplicate_proposals: duplicates.heuristic,
      content_preview: rendered.content,
      next_step: "Review the proposal, then use pnpm rag:write --apply to create the note.",
    };
  }

  async function cleanDryRun() {
    const artifacts = await loadTypedMemoryArtifacts(indexRoot);
    const staleGeneratedFiles = await findStaleGeneratedFiles(indexRoot);

    return {
      dry_run: true,
      ...buildCleanupReport({
        noteRegistry: artifacts.noteRegistry,
        chunkIndex: artifacts.chunkIndex,
        diagnostics: artifacts.diagnostics,
        staleGeneratedFiles,
      }),
    };
  }

  return {
    repoRoot,
    vaultRoot,
    indexRoot,
    searchMemory,
    unfoldMemory,
    contextMemory,
    classifyInput,
    proposeWrite,
    cleanDryRun,
  };
}

function formatContextChunk(chunk, fullDetail) {
  const integrityLine =
    chunk.validationStatus === "warning"
      ? `integrity: warning (${(chunk.validationIssues ?? []).join(", ") || "unspecified"})`
      : null;

  if (!fullDetail) {
    return [`## ${chunk.heading}`, integrityLine, trimText(contentOnly(chunk), 450)]
      .filter((line) => line !== null)
      .join("\n");
  }

  return [
    `## ${chunk.heading}`,
    `source_path: ${chunk.sourcePath}`,
    chunk.summary ? `summary: ${chunk.summary}` : null,
    integrityLine,
    "",
    contentOnly(chunk),
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function formatRetrievalSummary(retrieval) {
  if (!retrieval) {
    return null;
  }

  const sourceLine = `retrieval_sources: ${retrieval.sources.join(", ")}`;
  const vector = retrieval.vector;
  const vectorLine = vector.available
    ? `vector_search: ready (${vector.engine?.name ?? "unknown"}, ${vector.dimensions ?? "?"}d, candidates=${vector.candidateCount ?? 0})`
    : `vector_search: unavailable (${vector.reason ?? "unknown"})`;

  return [sourceLine, vectorLine].join("\n");
}

function formatFullChunk(chunk, headingLine = null) {
  const integrityLine =
    chunk.validationStatus === "warning"
      ? `integrity: warning (${(chunk.validationIssues ?? []).join(", ") || "unspecified"})`
      : null;

  return [
    headingLine,
    `source_path: ${chunk.sourcePath}`,
    `type: ${chunk.noteType ?? "unknown"} status: ${chunk.status ?? "unknown"} repo: ${chunk.repoSlug ?? "unknown"}`,
    `heading: ${chunk.heading}`,
    chunk.summary ? `summary: ${chunk.summary}` : null,
    integrityLine,
    "",
    contentOnly(chunk),
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function contentOnly(chunk) {
  const separatorIndex = chunk.text.indexOf("\n\n");

  if (separatorIndex === -1) {
    return chunk.text;
  }

  return chunk.text.slice(separatorIndex + 2).trim();
}

function hasSubstantiveContent(chunk) {
  const content = contentOnly(chunk)
    .replace(/^#+\s+.+$/gm, "")
    .replace(/\s+/g, " ")
    .trim();

  return content.length >= 40;
}

function createExcerpt(content, query, maxLength = 240) {
  const compactContent = compactWhitespace(content);

  if (compactContent.length <= maxLength) {
    return compactContent;
  }

  const tokens = query
    .toLowerCase()
    .replace(/[^a-z0-9/._-]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
  const lowerContent = compactContent.toLowerCase();
  const matchIndex = tokens
    .map((token) => lowerContent.indexOf(token))
    .filter((index) => index >= 0)
    .sort((left, right) => left - right)[0];

  if (matchIndex === undefined) {
    return trimText(compactContent, maxLength);
  }

  const start = Math.max(0, matchIndex - Math.floor(maxLength / 3));
  const end = Math.min(compactContent.length, start + maxLength);
  const prefix = start > 0 ? "... " : "";
  const suffix = end < compactContent.length ? " ..." : "";

  return `${prefix}${compactContent.slice(start, end).trim()}${suffix}`;
}

function compactWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function trimText(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 20).trimEnd()}\n...[truncated]`;
}
