import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  DETERMINISTIC_VECTOR_ENGINE,
  buildQueryEmbeddingInput,
  cosineSimilarity,
  embedTextDeterministically,
} from "./deterministic-embeddings.mjs";

const DEFAULT_NOTE_TYPE_BOOSTS = {
  "repo-home": 8,
  "architecture-record": 10,
  spec: 8,
  session: 4,
  todo: 5,
  investigation: 3,
  reference: 3,
  glossary: 4,
};

const DEFAULT_STATUS_BOOSTS = {
  accepted: 8,
  active: 6,
  proposed: 2,
  done: 1,
  archived: -8,
  superseded: -10,
};

const LEGACY_TYPE_ALIASES = {
  repo: "repo-home",
  "repo-home": "repo-home",
  "repo-architecture": "architecture-record",
  "repo-decision": "architecture-record",
  "architecture-record": "architecture-record",
  spec: "spec",
  "repo-spec": "spec",
  "repo-session": "session",
  "session-note": "session",
  session: "session",
  todo: "todo",
  task: "todo",
  "repo-task": "todo",
  "repo-tasks": "todo",
  investigation: "investigation",
  reference: "reference",
  glossary: "glossary",
};

const LEGACY_STATUS_ALIASES = {
  backlog: "proposed",
  proposed: "proposed",
  draft: "proposed",
  active: "active",
  ready: "active",
  "in progress": "active",
  accepted: "accepted",
  current: "accepted",
  done: "done",
  complete: "done",
  completed: "done",
  archived: "archived",
  superseded: "superseded",
};

const DEFAULT_INTEGRITY_MODE = "prefer-healthy";
const GRAPH_SEED_LIMIT = 1;
const DEFAULT_VECTOR_MODE = "auto";
const DEFAULT_RETRIEVAL_MODE = "default";
const VECTOR_RRF_K = 60;
const MIN_VECTOR_SIMILARITY = 0.18;
const BM25_K1 = 1.2;
const BM25_B = 0.75;
const BM25_FIELD_WEIGHTS = {
  text: 1,
  title: 2.5,
  path: 2.5,
  summary: 1.25,
  tags: 1,
  keywords: 2,
};

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

function dedupeOrdered(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function resolveCandidatePool(limit, retrievalMode = DEFAULT_RETRIEVAL_MODE) {
  if (retrievalMode === "quality") {
    return Math.max(limit * 5, limit + 4);
  }

  return Math.max(limit * 3, limit);
}

function createVectorState(overrides = {}) {
  return {
    enabled: true,
    available: false,
    status: "missing",
    reason: "vector_index_missing",
    engine: null,
    dimensions: DETERMINISTIC_VECTOR_ENGINE.dimensions,
    candidateCount: 0,
    used: false,
    ...overrides,
  };
}

function annotateCollection(items, metadataKey, metadataValue) {
  Object.defineProperty(items, metadataKey, {
    configurable: true,
    enumerable: false,
    writable: true,
    value: metadataValue,
  });

  return items;
}

function annotateCorpus(corpus, metadata = {}) {
  annotateCollection(corpus, "vectorIndex", {
    ...createVectorState(),
    ...(corpus.vectorIndex ?? {}),
    ...(metadata.vectorIndex ?? {}),
  });

  annotateCollection(corpus, "lexicalIndex", metadata.lexicalIndex ?? corpus.lexicalIndex ?? null);

  return corpus;
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

function normalizeNoteType(noteType) {
  if (!noteType) {
    return "reference";
  }

  return LEGACY_TYPE_ALIASES[noteType] ?? noteType;
}

function normalizeNoteStatus(status, noteType) {
  const normalized = LEGACY_STATUS_ALIASES[normalize(status ?? "")] ?? status;

  if (!normalized) {
    return noteType === "architecture-record" ? "accepted" : "active";
  }

  if (normalized === "active" && noteType === "architecture-record") {
    return "accepted";
  }

  return normalized;
}

function parseSourceFile(sourcePath) {
  const separator = " § ";
  const separatorIndex = sourcePath.indexOf(separator);
  return separatorIndex === -1 ? sourcePath : sourcePath.slice(0, separatorIndex);
}

function coerceLegacyCorpus(input) {
  const corpus = input.chunks.map((chunk) => {
    const noteType = normalizeNoteType(chunk.note_type);
    const status = normalizeNoteStatus(chunk.status, noteType);

    return {
      chunkId: chunk.id,
      noteId: chunk.note_id ?? chunk.id,
      sourceFile: chunk.source_file ?? parseSourceFile(chunk.source_path),
      sourcePath: chunk.source_path,
      heading: chunk.heading,
      noteType,
      status,
      repoSlug: chunk.repo_slug ?? null,
      tags: [...(chunk.tags ?? [])],
      keywords: [...(chunk.keywords ?? [])],
      summary: chunk.summary ?? null,
      title: chunk.heading,
      text: chunk.text,
      mtimeMs: chunk.mtime_ms ?? 0,
      updated: null,
      normalizedText: normalize(`${chunk.source_path}\n${chunk.text}`),
      normalizedHeading: normalize(chunk.heading),
      normalizedSummary: normalize(chunk.summary ?? ""),
      normalizedTitle: normalize(chunk.heading),
      queryTokens: tokenize(`${chunk.source_path}\n${chunk.text}`),
      pathTokens: new Set(tokenize(chunk.source_path)),
      keywordTokens: new Set(tokenize((chunk.keywords ?? []).join(" "))),
      tagTokens: new Set(tokenize((chunk.tags ?? []).join(" "))),
      titleTokens: new Set(tokenize(chunk.heading)),
      linkedNoteIds: new Set(),
      graphLookup: new Map(),
      vectorEmbedding: null,
    };
  });

  return annotateCorpus(corpus, {
    vectorIndex: createVectorState({
      status: "legacy",
      reason: "legacy_corpus_has_no_vector_index",
    }),
  });
}

function buildGraphLookup(edges) {
  const adjacency = new Map();

  for (const edge of edges ?? []) {
    adjacency.get(edge.from)?.push(edge) ?? adjacency.set(edge.from, [edge]);
    adjacency.get(edge.to)?.push({
      from: edge.to,
      to: edge.from,
      type: edge.type,
      reverse: true,
    }) ?? adjacency.set(edge.to, [{
      from: edge.to,
      to: edge.from,
      type: edge.type,
      reverse: true,
    }]);
  }

  const graphLookup = new Map();

  for (const noteId of adjacency.keys()) {
    const visited = new Set([noteId]);
    const queue = [{ noteId, distance: 0 }];
    const distances = new Map();

    while (queue.length > 0) {
      const current = queue.shift();

      for (const edge of adjacency.get(current.noteId) ?? []) {
        if (visited.has(edge.to)) {
          continue;
        }

        visited.add(edge.to);
        const nextDistance = current.distance + 1;
        distances.set(edge.to, nextDistance);

        if (nextDistance < 2) {
          queue.push({ noteId: edge.to, distance: nextDistance });
        }
      }
    }

    graphLookup.set(noteId, distances);
  }

  return graphLookup;
}

function buildTypedCorpus({ noteRegistry, chunkIndex, graphIndex, vectorIndex, lexicalIndex }) {
  const notesById = new Map(
    noteRegistry.map((note) => [note.id, note]),
  );
  const graphLookup = buildGraphLookup(graphIndex?.edges);
  const vectorLookup = new Map(
    (vectorIndex?.embeddings ?? []).map((entry) => [entry.chunk_id, entry.values]),
  );

  const corpus = chunkIndex.map((chunk) => {
    const note = notesById.get(chunk.note_id);
    const noteType = normalizeNoteType(chunk.type ?? note?.type);
    const status = normalizeNoteStatus(chunk.status ?? note?.status, noteType);
    const sourceFile = parseSourceFile(chunk.source_path);
    const searchText = `${chunk.source_path}\n${chunk.text}`;

    return {
      chunkId: chunk.chunk_id,
      noteId: chunk.note_id,
      sourceFile,
      sourcePath: chunk.source_path,
      heading: chunk.heading,
      noteType,
      status,
      repoSlug: note?.repo_slug ?? note?.repoSlug ?? null,
      tags: [...(note?.tags ?? [])],
      keywords: [...(note?.keywords ?? [])],
      summary: chunk.summary || note?.summary || null,
      title: note?.title ?? chunk.heading,
      text: chunk.text,
      mtimeMs: note?.mtime_ms ?? 0,
      updated: note?.updated ?? null,
      validationStatus: note?.validation_status ?? "ok",
      validationIssues: [...(note?.validation_issues ?? [])],
      normalizedText: normalize(searchText),
      normalizedHeading: normalize(chunk.heading),
      normalizedSummary: normalize(chunk.summary || note?.summary || ""),
      normalizedTitle: normalize(note?.title ?? chunk.heading),
      queryTokens: tokenize(searchText),
      pathTokens: new Set(tokenize(chunk.source_path)),
      keywordTokens: new Set(tokenize((note?.keywords ?? []).join(" "))),
      tagTokens: new Set(tokenize((note?.tags ?? []).join(" "))),
      titleTokens: new Set(tokenize(note?.title ?? chunk.heading)),
      linkedNoteIds: new Set(note?.outbound_links ?? []),
      graphLookup: graphLookup.get(chunk.note_id) ?? new Map(),
      vectorEmbedding: vectorLookup.get(chunk.chunk_id) ?? null,
    };
  });

  return annotateCorpus(corpus, {
    lexicalIndex,
    vectorIndex:
      vectorIndex?.status === "ready"
        ? createVectorState({
            available: true,
            status: "ready",
            reason: null,
            engine: vectorIndex.engine ?? DETERMINISTIC_VECTOR_ENGINE,
            dimensions:
              vectorIndex.engine?.dimensions ?? DETERMINISTIC_VECTOR_ENGINE.dimensions,
            embeddingCount: vectorIndex.embeddings?.length ?? 0,
          })
        : createVectorState({
            status: vectorIndex?.status ?? "missing",
            reason:
              vectorIndex?.reason ??
              (vectorIndex ? "vector_index_not_ready" : "vector_index_missing"),
            engine: vectorIndex?.engine ?? null,
          }),
  });
}

/**
 * Normalize a legacy or typed memory corpus into the ranked retrieval shape.
 */
export function indexMemoryCorpus(corpus) {
  if (Array.isArray(corpus)) {
    return annotateCorpus(corpus);
  }

  if (Array.isArray(corpus?.chunks) && !Array.isArray(corpus?.chunkIndex)) {
    return coerceLegacyCorpus(corpus);
  }

  if (Array.isArray(corpus?.noteRegistry) && Array.isArray(corpus?.chunkIndex)) {
    return buildTypedCorpus(corpus);
  }

  throw new Error("Unsupported memory corpus format.");
}

function resolveIndexRoot(indexPath) {
  if (!indexPath) {
    throw new Error("An index path is required.");
  }

  return indexPath.endsWith(".json") ? path.dirname(indexPath) : indexPath;
}

/**
 * Load the typed memory indexes from disk and normalize them for retrieval.
 */
export async function loadMemoryCorpus(indexPath) {
  const indexRoot = resolveIndexRoot(indexPath);
  const [noteRegistry, chunkIndex, graphIndex, vectorIndex, lexicalIndex] = await Promise.all([
    readFile(path.join(indexRoot, "note-registry.json"), "utf8").then(JSON.parse),
    readFile(path.join(indexRoot, "chunk-index.json"), "utf8").then(JSON.parse),
    readFile(path.join(indexRoot, "graph-index.json"), "utf8").then(JSON.parse),
    readFile(path.join(indexRoot, "vector-index.json"), "utf8")
      .then(JSON.parse)
      .catch(() => null),
    readFile(path.join(indexRoot, "lexical-index.json"), "utf8")
      .then(JSON.parse)
      .catch(() => null),
  ]);

  return indexMemoryCorpus({
    noteRegistry,
    chunkIndex,
    graphIndex,
    vectorIndex,
    lexicalIndex,
  });
}

export function classifyMemoryQuery(query) {
  const normalized = normalize(query);
  const keywords = dedupeOrdered(tokenize(query));
  const preferredNoteTypes = [];
  let intent = "general";

  if (/\b(what is|overview|repo|architecture|decision|tradeoff|why)\b/.test(normalized)) {
    preferredNoteTypes.push("repo-home", "architecture-record");
  }

  if (/\b(build|implement|plan|spec|rebuild)\b/.test(normalized)) {
    preferredNoteTypes.push("spec", "todo");
    intent = "implementation";
  }

  if (/\b(recent|happened|session|log|handoff)\b/.test(normalized)) {
    preferredNoteTypes.push("session");
    intent = "session";
  }

  if (/\b(todo|task|remain|next)\b/.test(normalized)) {
    preferredNoteTypes.push("todo");
    if (intent === "general" || intent === "implementation") {
      intent = "task";
    }
  }

  if (/\b(reference|command|api|how)\b/.test(normalized)) {
    preferredNoteTypes.push("reference");
    if (intent === "general") {
      intent = "reference";
    }
  }

  if (
    intent === "general" &&
    /\b(what is|overview|repo|architecture|decision|tradeoff|why|who owns|ownership)\b/.test(
      normalized,
    )
  ) {
    intent = "architecture";
  }

  const excludedStatuses = [];
  if (!/\b(archive|archived|history|historical|superseded)\b/.test(normalized)) {
    excludedStatuses.push("archived", "superseded");
  }

  return {
    original: query,
    normalized,
    keywords,
    intent,
    preferredNoteTypes: dedupeOrdered(preferredNoteTypes),
    excludedStatuses: dedupeOrdered(excludedStatuses),
  };
}

function buildExpandedQueryVariants(classification) {
  const keywordPhrase = classification.keywords.join(" ");
  const expanded = [];

  if (keywordPhrase && keywordPhrase !== classification.normalized) {
    expanded.push(keywordPhrase);
  }

  const suffixByNoteType = {
    "repo-home": "repo overview",
    "architecture-record": "architecture decision",
    spec: "implementation spec",
    session: "session handoff",
    todo: "remaining tasks",
    reference: "reference guide",
    glossary: "glossary reference",
    investigation: "investigation summary",
  };

  for (const noteType of classification.preferredNoteTypes) {
    const suffix = suffixByNoteType[noteType];
    if (suffix && keywordPhrase) {
      expanded.push(`${keywordPhrase} ${suffix}`);
    }
  }

  return dedupeOrdered(expanded).filter(
    (variant) => variant !== classification.original && variant !== classification.normalized,
  );
}

function createQueryPlan(query) {
  const classification = classifyMemoryQuery(query);

  return {
    original: query,
    normalized: classification.normalized,
    keywords: [...classification.keywords],
    classification,
    variants: {
      normalized: classification.normalized,
      expanded: buildExpandedQueryVariants(classification),
    },
    routing: {
      allowArchived: classification.excludedStatuses.length === 0,
      useGraphExpansion: classification.intent !== "reference",
    },
    expectedNoteTypes: [...classification.preferredNoteTypes],
    negativeStatuses: [...classification.excludedStatuses],
  };
}

function applyRecencyBoost(doc) {
  if (!doc.updated) {
    return 0;
  }

  const updatedAt = new Date(doc.updated);
  if (Number.isNaN(updatedAt.valueOf())) {
    return 0;
  }

  const ageDays = (Date.now() - updatedAt.valueOf()) / (1000 * 60 * 60 * 24);

  if (doc.noteType === "session") {
    if (ageDays <= 7) {
      return 6;
    }

    if (ageDays <= 30) {
      return 3;
    }
  }

  if (doc.noteType === "todo" && ageDays <= 30) {
    return 4;
  }

  return 0;
}

function shouldUseRecencyBoost(queryPlan, doc) {
  const preferredNoteTypes =
    queryPlan.classification?.preferredNoteTypes ?? queryPlan.expectedNoteTypes ?? [];

  if (preferredNoteTypes.includes("session")) {
    return doc.noteType === "session";
  }

  if (preferredNoteTypes.includes("todo")) {
    return doc.noteType === "todo";
  }

  return preferredNoteTypes.length === 0;
}

function getPlannedQueryTexts(query, queryPlan) {
  return dedupeOrdered([
    query.trim(),
    queryPlan.normalized,
    queryPlan.variants?.normalized,
    ...(queryPlan.variants?.expanded ?? []),
  ]);
}

function exactMatchBoost(doc, normalizedQuery) {
  if (!normalizedQuery) {
    return { score: 0, reasons: [] };
  }

  const reasons = [];
  let score = 0;

  score += maybePushReason(
    reasons,
    doc.noteId === normalizedQuery,
    "exact:id",
    20,
  );
  score += maybePushReason(
    reasons,
    normalize(doc.sourceFile) === normalizedQuery ||
      normalize(doc.sourcePath) === normalizedQuery,
    "exact:path",
    18,
  );
  score += maybePushReason(
    reasons,
    doc.normalizedTitle === normalizedQuery,
    "exact:title",
    12,
  );

  return { score, reasons };
}

function filterMemoryCorpus(corpus, filters) {
  return corpus
    .filter((doc) => !filters.repoSlug || doc.repoSlug === filters.repoSlug)
    .filter((doc) => !filters.noteType || doc.noteType === filters.noteType)
    .filter(
      (doc) =>
        filters.integrityMode !== "exclude-warning" ||
        doc.validationStatus !== "warning",
    )
    .filter(
      (doc) =>
        !filters.queryPlan?.negativeStatuses?.includes(doc.status),
    );
}

function heuristicLexicalSearch(input) {
  const query = input.query.trim();
  const queryPlan = input.queryPlan ?? createQueryPlan(query);
  const plannedQueries = getPlannedQueryTexts(query, queryPlan);
  const normalizedQuery = plannedQueries[0] ? normalize(plannedQueries[0]) : "";
  const queryTokens = dedupeOrdered(
    plannedQueries.flatMap((plannedQuery) => tokenize(plannedQuery)),
  );
  const expectedNoteTypes =
    queryPlan.classification?.preferredNoteTypes ?? queryPlan.expectedNoteTypes ?? [];
  const integrityMode = input.integrityMode ?? DEFAULT_INTEGRITY_MODE;

  return filterMemoryCorpus(input.corpus, {
    ...input,
    integrityMode,
    queryPlan,
  })
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
        score += maybePushReason(
          reasons,
          doc.titleTokens.has(token),
          `title-token:${token}`,
          3,
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
        doc.normalizedSummary.includes(normalizedQuery),
        "exact-query-summary",
        6,
      );
      score += maybePushReason(
        reasons,
        (queryPlan.variants?.expanded ?? []).some((variant) =>
          doc.normalizedText.includes(normalize(variant)),
        ),
        "plan-variant:text",
        4,
      );
      score += maybePushReason(
        reasons,
        (queryPlan.variants?.expanded ?? []).some((variant) =>
          doc.normalizedHeading.includes(normalize(variant)),
        ),
        "plan-variant:heading",
        3,
      );

      score += maybePushReason(
        reasons,
        normalizedQuery.includes("decision") &&
          doc.noteType === "architecture-record",
        "note-type:decision",
        6,
      );
      score += maybePushReason(
        reasons,
        normalizedQuery.includes("session") && doc.noteType === "session",
        "note-type:session",
        6,
      );
      score += maybePushReason(
        reasons,
        normalizedQuery.includes("architecture") &&
          doc.noteType === "architecture-record",
        "note-type:architecture",
        6,
      );

      const exact = exactMatchBoost(doc, normalizedQuery);
      score += exact.score;
      reasons.push(...exact.reasons);

      if (score === 0) {
        return null;
      }

      return {
        ...doc,
        score,
        matchReasons: [...reasons, "source:lexical"],
        retrievalSources: ["lexical"],
      };
    })
    .filter(Boolean)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.sourceFile.localeCompare(right.sourceFile) ||
        left.heading.localeCompare(right.heading),
    );
}

function scoreBm25Field(termFrequency, fieldLength, averageFieldLength, fieldWeight, documentFrequency, documentCount) {
  if (!termFrequency || !documentFrequency || !documentCount) {
    return 0;
  }

  const normalizedFieldLength =
    averageFieldLength > 0 ? fieldLength / averageFieldLength : 1;
  const denominator =
    termFrequency + BM25_K1 * (1 - BM25_B + BM25_B * normalizedFieldLength);
  const idf = Math.log(1 + (documentCount - documentFrequency + 0.5) / (documentFrequency + 0.5));

  return fieldWeight * idf * ((termFrequency * (BM25_K1 + 1)) / denominator);
}

function lexicalSearch(input) {
  const lexicalIndex = input.corpus.lexicalIndex;

  if (!lexicalIndex?.terms || lexicalIndex.schema_version !== 3) {
    return heuristicLexicalSearch(input);
  }

  const query = input.query.trim();
  const queryPlan = input.queryPlan ?? createQueryPlan(query);
  const plannedQueries = getPlannedQueryTexts(query, queryPlan);
  const normalizedQuery = plannedQueries[0] ? normalize(plannedQueries[0]) : "";
  const queryTokens = dedupeOrdered(
    plannedQueries.flatMap((plannedQuery) => tokenize(plannedQuery)),
  );
  const integrityMode = input.integrityMode ?? DEFAULT_INTEGRITY_MODE;
  const filteredDocs = filterMemoryCorpus(input.corpus, {
    ...input,
    integrityMode,
    queryPlan,
  });
  const filteredDocIds = new Set(filteredDocs.map((doc) => doc.chunkId));

  return filteredDocs
    .map((doc) => {
      const reasons = [];
      let score = 0;

      for (const token of queryTokens) {
        const termEntry = lexicalIndex.terms[token];
        const posting = termEntry?.docs?.find((entry) => entry.chunk_id === doc.chunkId);

        if (!posting) {
          continue;
        }

        reasons.push(`bm25:${token}`);
        const documentFrequency = termEntry.docs.length;

        for (const [fieldName, termFrequency] of Object.entries(posting.fields ?? {})) {
          const fieldWeight = BM25_FIELD_WEIGHTS[fieldName] ?? 0;

          if (!fieldWeight) {
            continue;
          }

          const averageFieldLength = lexicalIndex.avgFieldLengths?.[fieldName] ?? 0;
          const fieldLength =
            lexicalIndex.documents?.[doc.chunkId]?.fieldLengths?.[fieldName] ?? 0;
          score += scoreBm25Field(
            termFrequency,
            fieldLength,
            averageFieldLength,
            fieldWeight,
            documentFrequency,
            lexicalIndex.documentCount ?? filteredDocIds.size,
          );
        }
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
        doc.normalizedSummary.includes(normalizedQuery),
        "exact-query-summary",
        6,
      );

      const exact = exactMatchBoost(doc, normalizedQuery);
      score += exact.score;
      reasons.push(...exact.reasons);

      if (score === 0) {
        return null;
      }

      return {
        ...doc,
        score: Number(score.toFixed(3)),
        matchReasons: [...dedupeOrdered(reasons), "source:lexical"],
        retrievalSources: ["lexical"],
      };
    })
    .filter(Boolean)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.sourceFile.localeCompare(right.sourceFile) ||
        left.heading.localeCompare(right.heading),
    );
}

function graphSearch(input) {
  const queryPlan = input.queryPlan ?? createQueryPlan(input.query);
  const integrityMode = input.integrityMode ?? DEFAULT_INTEGRITY_MODE;

  if (queryPlan.routing?.useGraphExpansion === false) {
    return [];
  }

  const lexicalCandidates = input.lexicalCandidates ?? [];
  const seedCandidates = lexicalCandidates.slice(0, GRAPH_SEED_LIMIT);
  const seedNoteIds = new Set(seedCandidates.map((candidate) => candidate.noteId));

  if (seedNoteIds.size === 0) {
    return [];
  }

  return filterMemoryCorpus(input.corpus, {
    ...input,
    integrityMode,
    queryPlan,
  })
    .map((doc) => {
      const reasons = ["route:graph"];
      let graphScore = 0;

      if (seedNoteIds.has(doc.noteId)) {
        return null;
      }

      const distances = [...seedNoteIds]
        .map((seedNoteId) => doc.graphLookup.get(seedNoteId))
        .filter((distance) => Number.isFinite(distance))
        .sort((left, right) => left - right);
      const graphDistance = distances[0];

      if (graphDistance === 1) {
        graphScore = 5;
        reasons.push("graph:direct");
      } else if (graphDistance === 2) {
        graphScore = 2;
        reasons.push("graph:distance-2");
      }

      if (graphScore === 0) {
        return null;
      }

      return {
        chunkId: doc.chunkId,
        noteId: doc.noteId,
        sourceFile: doc.sourceFile,
        sourcePath: doc.sourcePath,
        heading: doc.heading,
        noteType: doc.noteType,
        status: doc.status,
        repoSlug: doc.repoSlug,
        tags: doc.tags,
        keywords: doc.keywords,
        summary: doc.summary,
        title: doc.title,
        validationStatus: doc.validationStatus ?? "ok",
        validationIssues: [...(doc.validationIssues ?? [])],
        score: graphScore,
        matchReasons: [...reasons, "source:graph"],
        text: doc.text,
        retrievalSources: ["graph"],
      };
    })
    .filter(Boolean)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.sourceFile.localeCompare(right.sourceFile) ||
        left.heading.localeCompare(right.heading),
    );
}

/**
 * Rank memory chunks against a query using lexical, graph, vector, and rerank signals.
 */
export function rerankMemoryCandidates(input) {
  const limit = input.limit ?? 5;
  const retrievalMode = input.retrievalMode ?? DEFAULT_RETRIEVAL_MODE;
  const candidatePool = resolveCandidatePool(limit, retrievalMode);
  const lexicalCandidates = lexicalSearch(input);
  const graphCandidates = graphSearch({
    ...input,
    lexicalCandidates,
  });
  const seenNoteIds = new Map();

  for (const candidate of lexicalCandidates) {
    const duplicateCount = seenNoteIds.get(candidate.noteId) ?? 0;

    if (duplicateCount > 0) {
      candidate.score -= duplicateCount * 3;
      candidate.matchReasons.push("duplicate-note-penalty");
    }

    seenNoteIds.set(candidate.noteId, duplicateCount + 1);
  }

  return {
    lexicalCandidates: lexicalCandidates.slice(0, candidatePool),
    graphCandidates: graphCandidates.slice(0, candidatePool),
    candidatePool,
  };
}

function describeVectorUnavailability(vectorMode, vectorIndex) {
  if (vectorMode === "off") {
    return createVectorState({
      enabled: false,
      status: "disabled",
      reason: "disabled_by_request",
      engine: vectorIndex?.engine ?? null,
      dimensions: vectorIndex?.dimensions ?? DETERMINISTIC_VECTOR_ENGINE.dimensions,
    });
  }

  return createVectorState({
    enabled: true,
    available: false,
    status: vectorIndex?.status ?? "missing",
    reason: vectorIndex?.reason ?? "vector_index_missing",
    engine: vectorIndex?.engine ?? null,
    dimensions: vectorIndex?.dimensions ?? DETERMINISTIC_VECTOR_ENGINE.dimensions,
  });
}

function reciprocalRankContribution(rank) {
  return 1 / (VECTOR_RRF_K + rank + 1);
}

function dedupeReasons(...reasonLists) {
  return Array.from(
    new Set(reasonLists.flatMap((reasons) => reasons ?? [])),
  );
}

function mergeRetrievalCandidates(input) {
  const merged = new Map();
  const lexicalRank = new Map();
  const vectorRank = new Map();
  const graphRank = new Map();

  input.lexicalCandidates.forEach((candidate, index) => {
    lexicalRank.set(candidate.chunkId, index);
  });
  input.vectorCandidates.forEach((candidate, index) => {
    vectorRank.set(candidate.chunkId, index);
  });
  input.graphCandidates.forEach((candidate, index) => {
    graphRank.set(candidate.chunkId, index);
  });

  for (const candidate of input.lexicalCandidates) {
    merged.set(candidate.chunkId, {
      ...candidate,
      lexicalScore: candidate.score,
    });
  }

  for (const candidate of input.vectorCandidates) {
    const current = merged.get(candidate.chunkId);
    if (current) {
      current.matchReasons = dedupeReasons(current.matchReasons, candidate.matchReasons);
      current.retrievalSources = Array.from(
        new Set([...(current.retrievalSources ?? []), ...(candidate.retrievalSources ?? [])]),
      );
      current.vectorSimilarity = candidate.vectorSimilarity;
    } else {
      merged.set(candidate.chunkId, { ...candidate });
    }
  }

  for (const candidate of input.graphCandidates) {
    const current = merged.get(candidate.chunkId);
    if (current) {
      current.matchReasons = dedupeReasons(current.matchReasons, candidate.matchReasons);
      current.retrievalSources = Array.from(
        new Set([...(current.retrievalSources ?? []), ...(candidate.retrievalSources ?? [])]),
      );
      current.graphScore = candidate.score;
    } else {
      merged.set(candidate.chunkId, {
        ...candidate,
        graphScore: candidate.score,
      });
    }
  }

  const ranked = Array.from(merged.values())
    .map((candidate) => {
      const lexicalIndex = lexicalRank.get(candidate.chunkId);
      const vectorIndex = vectorRank.get(candidate.chunkId);
      const graphIndex = graphRank.get(candidate.chunkId);
      const fusedScore =
        (lexicalIndex === undefined ? 0 : reciprocalRankContribution(lexicalIndex)) +
        (vectorIndex === undefined ? 0 : reciprocalRankContribution(vectorIndex)) +
        (graphIndex === undefined ? 0 : reciprocalRankContribution(graphIndex));
      const lexicalScore = candidate.lexicalScore ?? 0;
      const retrievalSources = Array.from(
        new Set(candidate.retrievalSources ?? ["lexical"]),
      );
      const sourceLabel =
        retrievalSources.length > 1 ? "source:hybrid" : `source:${retrievalSources[0]}`;

      return {
        ...candidate,
        score: Number((fusedScore * 1000 + lexicalScore).toFixed(3)),
        matchReasons: dedupeReasons(candidate.matchReasons, [sourceLabel]),
        retrievalSources,
        scoreBreakdown: {
          fused: Number(fusedScore.toFixed(6)),
          lexicalScore,
          lexicalRank: lexicalIndex ?? null,
          vectorRank: vectorIndex ?? null,
          graphRank: graphIndex ?? null,
          graphScore: candidate.graphScore ?? null,
          vectorSimilarity: candidate.vectorSimilarity ?? null,
        },
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        (right.vectorSimilarity ?? 0) - (left.vectorSimilarity ?? 0) ||
        left.sourceFile.localeCompare(right.sourceFile) ||
        left.heading.localeCompare(right.heading),
    )
    .slice(0, input.limit);

  return annotateCollection(ranked, "retrieval", {
    query: input.query,
    retrievalMode: input.retrievalMode ?? DEFAULT_RETRIEVAL_MODE,
    candidatePool: input.candidatePool ?? ranked.length,
    sources: input.vectorState.available
      ? ["lexical", "vector", "graph"]
      : ["lexical", "graph"],
    vector: input.vectorState,
  });
}

function rerankFusedCandidates(input) {
  const queryPlan = input.queryPlan ?? createQueryPlan(input.query);
  const integrityMode = input.integrityMode ?? DEFAULT_INTEGRITY_MODE;
  const expectedNoteTypes =
    queryPlan.classification?.preferredNoteTypes ?? queryPlan.expectedNoteTypes ?? [];

  return input.candidates
    .map((candidate) => {
      let score = candidate.score;
      const reasons = [...candidate.matchReasons];

      if (expectedNoteTypes.includes(candidate.noteType)) {
        score += maybePushReason(
          reasons,
          true,
          `plan-type:${candidate.noteType}`,
          (DEFAULT_NOTE_TYPE_BOOSTS[candidate.noteType] ?? 0) + 8,
        );
      } else if (expectedNoteTypes.length > 0) {
        score -= 4;
        reasons.push("plan-type:mismatch");
      } else {
        const noteTypeBoost = DEFAULT_NOTE_TYPE_BOOSTS[candidate.noteType] ?? 0;
        if (noteTypeBoost !== 0) {
          score += noteTypeBoost;
          reasons.push(`note-type:${candidate.noteType}`);
        }
      }

      score += DEFAULT_STATUS_BOOSTS[candidate.status] ?? 0;
      if (DEFAULT_STATUS_BOOSTS[candidate.status]) {
        reasons.push(`status:${candidate.status}`);
      }

      const recencyBoost = shouldUseRecencyBoost(queryPlan, candidate)
        ? applyRecencyBoost(candidate)
        : 0;
      if (recencyBoost > 0) {
        score += recencyBoost;
        reasons.push(`recency:${candidate.noteType}`);
      }

      if (candidate.validationStatus === "warning" && integrityMode === "prefer-healthy") {
        score -= 3;
        reasons.push("integrity:warning");
      }

      if (candidate.validationStatus === "warning" && integrityMode === "prefer-warning") {
        score += 3;
        reasons.push("integrity:prefer-warning");
      }

      if (
        queryPlan.routing?.allowArchived &&
        (candidate.status === "archived" || candidate.status === "superseded")
      ) {
        reasons.push("route:archive");
      }

      return {
        ...candidate,
        score: Number(score.toFixed(3)),
        matchReasons: dedupeReasons(reasons),
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        (right.scoreBreakdown?.fused ?? 0) - (left.scoreBreakdown?.fused ?? 0) ||
        (right.vectorSimilarity ?? 0) - (left.vectorSimilarity ?? 0) ||
        left.sourceFile.localeCompare(right.sourceFile) ||
        left.heading.localeCompare(right.heading),
    )
    .slice(0, input.limit ?? 5);
}

export function vectorSearch(input) {
  const query = input.query.trim();
  const limit = input.limit ?? 5;
  const retrievalMode = input.retrievalMode ?? DEFAULT_RETRIEVAL_MODE;
  const candidatePool = resolveCandidatePool(limit, retrievalMode);
  const queryPlan = input.queryPlan ?? createQueryPlan(query);
  const integrityMode = input.integrityMode ?? DEFAULT_INTEGRITY_MODE;
  const vectorMode = input.vectorMode ?? DEFAULT_VECTOR_MODE;
  const vectorIndex = input.corpus.vectorIndex ?? createVectorState();

  if (!query) {
    return annotateCollection([], "state", describeVectorUnavailability(vectorMode, vectorIndex));
  }

  if (vectorMode === "off" || !vectorIndex.available) {
    return annotateCollection(
      [],
      "state",
      describeVectorUnavailability(vectorMode, vectorIndex),
    );
  }

  const queryVector = embedTextDeterministically(
    buildQueryEmbeddingInput({
      query,
      queryPlan,
    }),
    {
      dimensions: vectorIndex.dimensions ?? DETERMINISTIC_VECTOR_ENGINE.dimensions,
    },
  );

  const candidates = filterMemoryCorpus(input.corpus, {
    ...input,
    integrityMode,
    queryPlan,
  })
    .map((doc) => {
      if (!Array.isArray(doc.vectorEmbedding)) {
        return null;
      }

      const similarity = cosineSimilarity(queryVector, doc.vectorEmbedding);
      if (similarity < MIN_VECTOR_SIMILARITY) {
        return null;
      }

      return {
        chunkId: doc.chunkId,
        noteId: doc.noteId,
        sourceFile: doc.sourceFile,
        sourcePath: doc.sourcePath,
        heading: doc.heading,
        noteType: doc.noteType,
        status: doc.status,
        repoSlug: doc.repoSlug,
        tags: doc.tags,
        keywords: doc.keywords,
        summary: doc.summary,
        title: doc.title,
        validationStatus: doc.validationStatus ?? "ok",
        validationIssues: [...(doc.validationIssues ?? [])],
        score: similarity,
        vectorSimilarity: similarity,
        matchReasons: [
          "source:vector",
          `vector-engine:${vectorIndex.engine?.name ?? DETERMINISTIC_VECTOR_ENGINE.name}`,
          `vector-cosine:${similarity.toFixed(3)}`,
        ],
        text: doc.text,
        retrievalSources: ["vector"],
      };
    })
    .filter(Boolean)
    .sort(
      (left, right) =>
        right.vectorSimilarity - left.vectorSimilarity ||
        left.sourceFile.localeCompare(right.sourceFile) ||
        left.heading.localeCompare(right.heading),
    )
    .slice(0, candidatePool);

  return annotateCollection(candidates, "state", createVectorState({
    enabled: true,
    available: true,
    status: "ready",
    reason: null,
    engine: vectorIndex.engine,
    dimensions: vectorIndex.dimensions,
    candidateCount: candidates.length,
    used: candidates.length > 0,
  }));
}

/**
 * Compatibility wrapper for callers that only need ranked candidates.
 */
export function retrieveMemoryCandidates(input) {
  const retrievalMode = input.retrievalMode ?? DEFAULT_RETRIEVAL_MODE;
  const { lexicalCandidates, graphCandidates, candidatePool } = rerankMemoryCandidates({
    ...input,
    retrievalMode,
  });
  const vectorCandidates = vectorSearch(input);
  const fusedCandidates = mergeRetrievalCandidates({
    query: input.query,
    lexicalCandidates,
    vectorCandidates,
    graphCandidates,
    vectorState: vectorCandidates.state,
    limit: input.limit ?? 5,
    retrievalMode,
    candidatePool,
  });

  const reranked = rerankFusedCandidates({
    query: input.query,
    queryPlan: input.queryPlan,
    integrityMode: input.integrityMode,
    candidates: fusedCandidates,
    limit: input.limit ?? 5,
  });

  return annotateCollection(reranked, "retrieval", fusedCandidates.retrieval);
}

/**
 * Resolve one chunk by exact source path or by file plus heading.
 */
export function findMemoryChunk(input) {
  return input.corpus.find((candidate) =>
    input.sourcePath
      ? candidate.sourcePath === input.sourcePath
      : candidate.sourceFile === input.sourceFile &&
          candidate.heading === input.heading,
  );
}

/**
 * Return the canonical repo-home context headings for one repository slug.
 */
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
          candidate.noteType === "repo-home" &&
          candidate.repoSlug === repoSlug &&
          candidate.sourceFile.endsWith(
            `00 Repositories/${repoSlug}/00 Repo Home.md`,
          ) &&
          candidate.heading === heading,
      ),
    )
    .filter(Boolean);
}

/**
 * Assemble a bounded context bundle from ranked retrieval candidates.
 */
export function assembleMemoryContext(input) {
  const tokenBudget = input.tokenBudget ?? 600;
  const maxItems = input.maxItems ?? input.candidates.length;
  const items = [];
  const references = [];
  const omitted = [];
  let estimatedTokens = 0;

  for (const candidate of input.candidates.slice(0, maxItems)) {
    const candidateTokens = estimateTokens(candidate.text);

    if (estimatedTokens + candidateTokens > tokenBudget) {
      omitted.push({
        noteId: candidate.noteId,
        chunkId: candidate.chunkId,
        reason: "token_budget",
      });
      continue;
    }

    items.push({
      noteId: candidate.noteId,
      chunkId: candidate.chunkId,
      sourceFile: candidate.sourceFile,
      sourcePath: candidate.sourcePath,
      heading: candidate.heading,
      noteType: candidate.noteType,
      status: candidate.status,
      validationStatus: candidate.validationStatus ?? "ok",
      validationIssues: [...(candidate.validationIssues ?? [])],
      score: candidate.score,
      matchReasons: [...candidate.matchReasons],
      text: candidate.text,
      estimatedTokens: candidateTokens,
    });

    references.push({
      noteId: candidate.noteId,
      sourceFile: candidate.sourceFile,
      sourcePath: candidate.sourcePath,
      heading: candidate.heading,
      noteType: candidate.noteType,
      status: candidate.status,
      validationStatus: candidate.validationStatus ?? "ok",
      validationIssues: [...(candidate.validationIssues ?? [])],
      score: candidate.score,
    });

    estimatedTokens += candidateTokens;
  }

  return {
    query: input.query,
    candidateCount: input.candidates.length,
    selectedCount: items.length,
    truncated:
      omitted.length > 0 || items.length < Math.min(input.candidates.length, maxItems),
    items,
    references,
    omitted,
    estimatedTokens,
    tokenBudget,
  };
}

/**
 * Summarize corpus composition for debugging and fixture verification.
 */
export function getMemoryDiagnostics(input) {
  return {
    chunkCount: input.corpus.length,
    vectorStatus: input.corpus.vectorIndex?.status ?? "missing",
    noteTypes: input.corpus.reduce((acc, item) => {
      const key = item.noteType ?? "unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
    statuses: input.corpus.reduce((acc, item) => {
      const key = item.status ?? "unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  };
}

/**
 * Infer retrieval intent, preferred note types, and excluded statuses.
 */
export function planMemoryQuery(query) {
  return createQueryPlan(query);
}
