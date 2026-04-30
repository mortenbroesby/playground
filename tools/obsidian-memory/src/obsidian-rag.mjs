import { readFile } from "node:fs/promises";
import path from "node:path";

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
  return input.chunks.map((chunk) => {
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
    };
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

function buildTypedCorpus({ noteRegistry, chunkIndex, graphIndex }) {
  const notesById = new Map(
    noteRegistry.map((note) => [note.id, note]),
  );
  const graphLookup = buildGraphLookup(graphIndex?.edges);

  return chunkIndex.map((chunk) => {
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
    };
  });
}

/**
 * Normalize a legacy or typed memory corpus into the ranked retrieval shape.
 */
export function indexMemoryCorpus(corpus) {
  if (Array.isArray(corpus)) {
    return corpus;
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
  const [noteRegistry, chunkIndex, graphIndex] = await Promise.all([
    readFile(path.join(indexRoot, "note-registry.json"), "utf8").then(JSON.parse),
    readFile(path.join(indexRoot, "chunk-index.json"), "utf8").then(JSON.parse),
    readFile(path.join(indexRoot, "graph-index.json"), "utf8").then(JSON.parse),
  ]);

  return indexMemoryCorpus({
    noteRegistry,
    chunkIndex,
    graphIndex,
  });
}

function createQueryPlan(query) {
  const normalized = normalize(query);
  const keywords = Array.from(new Set(tokenize(query)));
  const expectedNoteTypes = [];

  if (/\b(what is|overview|repo|architecture|decision|tradeoff|why)\b/.test(normalized)) {
    expectedNoteTypes.push("repo-home", "architecture-record");
  }

  if (/\b(build|implement|plan|spec|rebuild)\b/.test(normalized)) {
    expectedNoteTypes.push("spec", "todo");
  }

  if (/\b(recent|happened|session|log|handoff)\b/.test(normalized)) {
    expectedNoteTypes.push("session");
  }

  if (/\b(todo|task|remain|next)\b/.test(normalized)) {
    expectedNoteTypes.push("todo");
  }

  if (/\b(reference|command|api|how)\b/.test(normalized)) {
    expectedNoteTypes.push("reference");
  }

  const negativeStatuses = [];
  if (!/\b(archive|archived|history|historical|superseded)\b/.test(normalized)) {
    negativeStatuses.push("archived", "superseded");
  }

  return {
    original: query,
    normalized,
    keywords,
    expectedNoteTypes: Array.from(new Set(expectedNoteTypes)),
    negativeStatuses,
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
  if (queryPlan.expectedNoteTypes.includes("session")) {
    return doc.noteType === "session";
  }

  if (queryPlan.expectedNoteTypes.includes("todo")) {
    return doc.noteType === "todo";
  }

  return queryPlan.expectedNoteTypes.length === 0;
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
        !filters.queryPlan?.negativeStatuses?.includes(doc.status),
    );
}

/**
 * Rank memory chunks against a query using lexical, status, and graph signals.
 */
export function rerankMemoryCandidates(input) {
  const query = input.query.trim();
  const limit = input.limit ?? 5;
  const normalizedQuery = normalize(query);
  const queryTokens = tokenize(query);
  const queryPlan = input.queryPlan ?? createQueryPlan(query);

  const baseRanked = filterMemoryCorpus(input.corpus, {
    ...input,
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

      if (queryPlan.expectedNoteTypes.includes(doc.noteType)) {
        score += maybePushReason(
          reasons,
          true,
          `plan-type:${doc.noteType}`,
          (DEFAULT_NOTE_TYPE_BOOSTS[doc.noteType] ?? 0) + 8,
        );
      } else if (queryPlan.expectedNoteTypes.length > 0) {
        score -= 4;
        reasons.push("plan-type:mismatch");
      } else {
        score += DEFAULT_NOTE_TYPE_BOOSTS[doc.noteType] ?? 0;
      }

      score += DEFAULT_STATUS_BOOSTS[doc.status] ?? 0;
      if (DEFAULT_STATUS_BOOSTS[doc.status]) {
        reasons.push(`status:${doc.status}`);
      }

      const recencyBoost = shouldUseRecencyBoost(queryPlan, doc)
        ? applyRecencyBoost(doc)
        : 0;
      if (recencyBoost > 0) {
        score += recencyBoost;
        reasons.push(`recency:${doc.noteType}`);
      }

      if (doc.validationStatus === "warning") {
        score -= 3;
        reasons.push("integrity:warning");
      }

      if (score === 0) {
        return null;
      }

      return {
        ...doc,
        score,
        matchReasons: reasons,
      };
    })
    .filter(Boolean)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.sourceFile.localeCompare(right.sourceFile) ||
        left.heading.localeCompare(right.heading),
    );

  const seedNoteIds = new Set(baseRanked.slice(0, 5).map((candidate) => candidate.noteId));

  const rankedWithGraph = baseRanked
    .map((candidate) => {
      let score = candidate.score;
      const reasons = [...candidate.matchReasons];

      if (seedNoteIds.has(candidate.noteId)) {
        reasons.push("graph:seed");
      } else {
        const distances = [...seedNoteIds]
          .map((seedNoteId) => candidate.graphLookup.get(seedNoteId))
          .filter((distance) => Number.isFinite(distance))
          .sort((left, right) => left - right);
        const graphDistance = distances[0];

        if (graphDistance === 1) {
          score += 5;
          reasons.push("graph:direct");
        } else if (graphDistance === 2) {
          score += 2;
          reasons.push("graph:distance-2");
        }
      }

      return {
        chunkId: candidate.chunkId,
        noteId: candidate.noteId,
        sourceFile: candidate.sourceFile,
        sourcePath: candidate.sourcePath,
        heading: candidate.heading,
        noteType: candidate.noteType,
        status: candidate.status,
        repoSlug: candidate.repoSlug,
        tags: candidate.tags,
        keywords: candidate.keywords,
        summary: candidate.summary,
        title: candidate.title,
        score,
        matchReasons: reasons,
        text: candidate.text,
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.sourceFile.localeCompare(right.sourceFile) ||
        left.heading.localeCompare(right.heading),
    );

  const seenNoteIds = new Map();

  for (const candidate of rankedWithGraph) {
    const duplicateCount = seenNoteIds.get(candidate.noteId) ?? 0;

    if (duplicateCount > 0) {
      candidate.score -= duplicateCount * 3;
      candidate.matchReasons.push("duplicate-note-penalty");
    }

    seenNoteIds.set(candidate.noteId, duplicateCount + 1);
  }

  return rankedWithGraph
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.sourceFile.localeCompare(right.sourceFile) ||
        left.heading.localeCompare(right.heading),
    )
    .slice(0, limit);
}

/**
 * Compatibility wrapper for callers that only need ranked candidates.
 */
export function retrieveMemoryCandidates(input) {
  return rerankMemoryCandidates(input);
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
