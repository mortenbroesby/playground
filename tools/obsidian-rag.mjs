import { readFile } from "node:fs/promises";

function tokenize(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9/._-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function normalize(value) {
  return value.toLowerCase();
}

function estimateTokens(value) {
  if (!value) {
    return 0;
  }

  return Math.max(1, Math.ceil(value.length / 4));
}

function maybePushReason(reasons, condition, reason, scoreDelta) {
  if (!condition) {
    return 0;
  }

  reasons.push(reason);
  return scoreDelta;
}

export function indexMemoryCorpus(corpus) {
  return corpus.chunks.map((chunk) => {
    const searchText = `${chunk.source_path}\n${chunk.text}`;

    return {
      chunkId: chunk.id,
      sourceFile: chunk.source_file,
      sourcePath: chunk.source_path,
      heading: chunk.heading,
      noteType: chunk.note_type,
      repoSlug: chunk.repo_slug,
      tags: [...chunk.tags],
      keywords: [...chunk.keywords],
      summary: chunk.summary,
      text: chunk.text,
      mtimeMs: chunk.mtime_ms,
      normalizedText: normalize(searchText),
      normalizedHeading: normalize(chunk.heading),
      normalizedSummary: normalize(chunk.summary ?? ""),
      queryTokens: tokenize(searchText),
      pathTokens: new Set(tokenize(chunk.source_path)),
      keywordTokens: new Set(tokenize(chunk.keywords.join(" "))),
      tagTokens: new Set(tokenize(chunk.tags.join(" "))),
    };
  });
}

export async function loadMemoryCorpus(corpusPath) {
  const corpus = JSON.parse(await readFile(corpusPath, "utf8"));
  return indexMemoryCorpus(corpus);
}

function filterMemoryCorpus(corpus, filters) {
  return corpus
    .filter((doc) => !filters.repoSlug || doc.repoSlug === filters.repoSlug)
    .filter((doc) => !filters.noteType || doc.noteType === filters.noteType);
}

export function rerankMemoryCandidates(input) {
  const query = input.query.trim();
  const limit = input.limit ?? 5;
  const normalizedQuery = normalize(query);
  const queryTokens = tokenize(query);

  const ranked = filterMemoryCorpus(input.corpus, input)
    .map((doc) => {
      const reasons = [];
      const docTokenSet = new Set(doc.queryTokens);
      let score = 0;

      for (const token of queryTokens) {
        score += maybePushReason(
          reasons,
          docTokenSet.has(token),
          `text-token:${token}`,
          2,
        );
        score += maybePushReason(
          reasons,
          doc.pathTokens.has(token),
          `path-token:${token}`,
          3,
        );
        score += maybePushReason(
          reasons,
          doc.keywordTokens.has(token),
          `keyword-token:${token}`,
          4,
        );
        score += maybePushReason(
          reasons,
          doc.tagTokens.has(token),
          `tag-token:${token}`,
          2,
        );
      }

      score += maybePushReason(
        reasons,
        doc.normalizedText.includes(normalizedQuery),
        "exact-query-text",
        10,
      );
      score += maybePushReason(
        reasons,
        doc.normalizedHeading.includes(normalizedQuery),
        "exact-query-heading",
        8,
      );
      score += maybePushReason(
        reasons,
        !!doc.normalizedSummary && doc.normalizedSummary.includes(normalizedQuery),
        "exact-query-summary",
        6,
      );

      score += maybePushReason(
        reasons,
        normalizedQuery.includes("decision") && doc.noteType === "repo-decision",
        "note-type:decision",
        4,
      );
      score += maybePushReason(
        reasons,
        normalizedQuery.includes("session") && doc.noteType === "repo-session",
        "note-type:session",
        4,
      );
      score += maybePushReason(
        reasons,
        normalizedQuery.includes("architecture") &&
          doc.noteType === "repo-architecture",
        "note-type:architecture",
        4,
      );

      if (score === 0) {
        return null;
      }

      return {
        chunkId: doc.chunkId,
        sourceFile: doc.sourceFile,
        sourcePath: doc.sourcePath,
        heading: doc.heading,
        noteType: doc.noteType,
        repoSlug: doc.repoSlug,
        tags: doc.tags,
        keywords: doc.keywords,
        summary: doc.summary,
        score,
        matchReasons: reasons,
        text: doc.text,
      };
    })
    .filter(Boolean)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.sourceFile.localeCompare(right.sourceFile) ||
        left.heading.localeCompare(right.heading),
    );

  return ranked.slice(0, limit);
}

export function retrieveMemoryCandidates(input) {
  return rerankMemoryCandidates(input);
}

export function findMemoryChunk(input) {
  return input.corpus.find((candidate) =>
    input.sourcePath
      ? candidate.sourcePath === input.sourcePath
      : candidate.sourceFile === input.sourceFile &&
          candidate.heading === input.heading,
  );
}

export function getMemoryContext(input) {
  const repoSlug = input.repoSlug ?? "playground";
  const headings = input.headings ?? [
    "What This Repo Is",
    "Current Architecture",
    "Architecture Map",
    "Active Focus",
    "Open Questions",
    "Key Decisions",
    "Next Actions",
  ];

  return headings
    .map((heading) =>
      input.corpus.find(
        (candidate) =>
          candidate.repoSlug === repoSlug &&
          candidate.sourceFile.endsWith(
            `00 Repositories/${repoSlug}/00 Repo Home.md`,
          ) &&
          candidate.heading === heading,
      ),
    )
    .filter(Boolean);
}

export function assembleMemoryContext(input) {
  const tokenBudget = input.tokenBudget ?? 600;
  const maxItems = input.maxItems ?? input.candidates.length;
  const items = [];
  const references = [];
  let estimatedTokens = 0;

  for (const candidate of input.candidates.slice(0, maxItems)) {
    const candidateTokens = estimateTokens(candidate.text);

    if (items.length > 0 && estimatedTokens + candidateTokens > tokenBudget) {
      break;
    }

    items.push({
      chunkId: candidate.chunkId,
      sourceFile: candidate.sourceFile,
      sourcePath: candidate.sourcePath,
      heading: candidate.heading,
      noteType: candidate.noteType,
      score: candidate.score,
      matchReasons: [...candidate.matchReasons],
      text: candidate.text,
      estimatedTokens: candidateTokens,
    });

    references.push({
      sourceFile: candidate.sourceFile,
      sourcePath: candidate.sourcePath,
      heading: candidate.heading,
      noteType: candidate.noteType,
      score: candidate.score,
    });

    estimatedTokens += candidateTokens;
  }

  return {
    query: input.query,
    candidateCount: input.candidates.length,
    selectedCount: items.length,
    truncated: items.length < Math.min(input.candidates.length, maxItems),
    items,
    references,
    estimatedTokens,
    tokenBudget,
  };
}

export function getMemoryDiagnostics(input) {
  return {
    chunkCount: input.corpus.length,
    noteTypes: input.corpus.reduce((acc, item) => {
      const key = item.noteType ?? "unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  };
}
