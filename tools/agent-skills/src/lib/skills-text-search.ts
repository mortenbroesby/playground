export type ScorableField =
  | "id"
  | "display_name"
  | "description"
  | "tags"
  | "triggers"
  | "anti_triggers";

type TokenizedFieldStats = { counts: Map<string, number>; length: number };

export type Bm25Model = {
  corpusSize: number;
  avgFieldLength: Record<ScorableField, number>;
  termDocumentFrequency: Record<ScorableField, Map<string, number>>;
  fieldStatsByDocumentId: Map<string, Record<ScorableField, TokenizedFieldStats>>;
};

type SearchDocument = { id: string };

export type PreparedSearchQuery = {
  raw: string;
  normalized: string;
  tokens: string[];
  expandedTokens: string[];
  expandedText: string;
  hasSynonymExpansion: boolean;
  hasMorphologyExpansion: boolean;
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "before",
  "by",
  "for",
  "from",
  "how",
  "if",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "their",
  "then",
  "this",
  "to",
  "use",
  "when",
  "with",
  "work",
]);

const BM25_MIN_TOKEN_LENGTH = 2;
const BM25_K1 = 1.2;
const BM25_B = 0.75;
const BM25_EPSILON = 1e-8;

const BM25_QUERY_SYNONYMS: Record<string, readonly string[]> = {
  ai: ["artificial", "intelligence"],
  pr: ["pull", "request", "merge"],
  ci: ["continuous integration", "pipeline"],
  cicd: ["ci", "continuous integration", "continuous deployment"],
  continuous: ["ci"],
  integration: ["ci"],
  pipeline: ["ci", "continuous integration"],
  ux: ["ui", "user", "experience"],
  uxui: ["ui", "user", "experience"],
};

const bm25ModelCache = new WeakMap<ReadonlyArray<SearchDocument>, Bm25Model>();

export function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

export function tokenize(value: string): string[] {
  const tokens = normalizeText(value).match(/[a-z0-9]+/g) || [];
  return [...new Set(
    tokens
      .map((token) => token.toLowerCase())
      .filter(
        (token) => token.length >= BM25_MIN_TOKEN_LENGTH && !STOP_WORDS.has(token),
      ),
  )];
}

function tokenizeForFrequency(value: string): string[] {
  return (
    normalizeText(value)
      .match(/[a-z0-9]+/g)
      ?.map((token) => token.toLowerCase())
      .filter((token) => token.length >= BM25_MIN_TOKEN_LENGTH && !STOP_WORDS.has(token)) || []
  );
}

function expandQueryToken(token: string): string[] {
  const normalizedToken = normalizeText(token);
  const expansion = new Set<string>([normalizedToken]);

  const synonymTokens = BM25_QUERY_SYNONYMS[normalizedToken];
  if (synonymTokens) {
    for (const synonym of synonymTokens) {
      for (const expandedToken of tokenize(synonym)) {
        expansion.add(expandedToken);
      }
    }
  }

  if (normalizedToken.endsWith("ing") && normalizedToken.length > 5) {
    expansion.add(normalizedToken.slice(0, -3));
  }
  if (normalizedToken.endsWith("ers") && normalizedToken.length > 5) {
    expansion.add(normalizedToken.slice(0, -3));
  }
  if (normalizedToken.endsWith("ed") && normalizedToken.length > 4) {
    expansion.add(normalizedToken.slice(0, -2));
  }
  if (normalizedToken.endsWith("s") && normalizedToken.length > 3) {
    expansion.add(normalizedToken.slice(0, -1));
  }

  return [...new Set(
    Array.from(expansion).filter(
      (candidate) => candidate.length >= BM25_MIN_TOKEN_LENGTH,
    ),
  )];
}

function expandQueryTokens(tokens: string[]): string[] {
  if (tokens.length === 0) {
    return [];
  }

  const expanded = new Set<string>();
  for (const token of tokens) {
    for (const candidate of expandQueryToken(token)) {
      if (!STOP_WORDS.has(candidate)) {
        expanded.add(candidate);
      }
    }
  }

  return [...expanded];
}

export function prepareSearchQuery(query: string): PreparedSearchQuery {
  const normalized = normalizeText(query);
  const tokens = tokenize(query);
  const expandedTokens = expandQueryTokens(tokens);

  let hasSynonymExpansion = false;
  let hasMorphologyExpansion = false;
  for (const token of tokens) {
    const directSynonyms = BM25_QUERY_SYNONYMS[token];
    if (directSynonyms && directSynonyms.length > 0) {
      hasSynonymExpansion = true;
    }
    if (!hasMorphologyExpansion) {
      const directExpansion = new Set(expandQueryToken(token));
      directExpansion.delete(token);
      if (directExpansion.size > 0 && !directSynonyms) {
        hasMorphologyExpansion = true;
      }
    }
  }

  return {
    raw: query,
    normalized,
    tokens,
    expandedTokens,
    expandedText: expandedTokens.join(" "),
    hasSynonymExpansion,
    hasMorphologyExpansion,
  };
}

export function includesPhrase(haystack: string, needle: string): boolean {
  return haystack.includes(needle);
}

function countTokenOverlap(
  haystackTokens: string[],
  queryTokens: string[],
): number {
  const haystackTokenSet = new Set(haystackTokens);
  return queryTokens.filter((token) => haystackTokenSet.has(token)).length;
}

export function scoreTextField(text: string, query: string): number {
  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(query);
  const queryTokens = tokenize(query);
  let score = 0;

  if (includesPhrase(normalizedText, normalizedQuery)) {
    score += 10;
  }

  score += countTokenOverlap(tokenize(text), queryTokens) * 2;
  return score;
}

export function scoreListField(
  values: string[],
  query: string,
  multiplier: number,
): number {
  return values.reduce(
    (total, value) => total + scoreTextField(value, query) * multiplier,
    0,
  );
}

export function getBm25Model<TDocument extends SearchDocument>(
  documents: TDocument[],
  getScorableFieldText: (document: TDocument, field: ScorableField) => string,
): Bm25Model {
  const cached = bm25ModelCache.get(documents);
  if (cached) {
    return cached;
  }

  const avgFieldLength: Record<ScorableField, number> = {
    id: 0,
    display_name: 0,
    description: 0,
    tags: 0,
    triggers: 0,
    anti_triggers: 0,
  };
  const termDocumentFrequency: Record<ScorableField, Map<string, number>> = {
    id: new Map(),
    display_name: new Map(),
    description: new Map(),
    tags: new Map(),
    triggers: new Map(),
    anti_triggers: new Map(),
  };
  const fieldStatsByDocumentId = new Map<
    string,
    Record<ScorableField, TokenizedFieldStats>
  >();
  const fields = Object.keys(avgFieldLength) as ScorableField[];

  for (const document of documents) {
    const byField: Record<ScorableField, TokenizedFieldStats> = {
      id: { counts: new Map(), length: 0 },
      display_name: { counts: new Map(), length: 0 },
      description: { counts: new Map(), length: 0 },
      tags: { counts: new Map(), length: 0 },
      triggers: { counts: new Map(), length: 0 },
      anti_triggers: { counts: new Map(), length: 0 },
    };

    for (const field of fields) {
      const text = getScorableFieldText(document, field);
      const tokens = tokenizeForFrequency(text);
      const tokenSet = new Set<string>();

      for (const token of tokens) {
        const next = (byField[field].counts.get(token) ?? 0) + 1;
        byField[field].counts.set(token, next);
        byField[field].length++;
        tokenSet.add(token);
      }

      for (const token of tokenSet) {
        termDocumentFrequency[field].set(
          token,
          (termDocumentFrequency[field].get(token) ?? 0) + 1,
        );
      }
    }

    fieldStatsByDocumentId.set(document.id, byField);
  }

  for (const field of fields) {
    const totalLength = [...fieldStatsByDocumentId.values()].reduce(
      (sum, value) => sum + value[field].length,
      0,
    );
    avgFieldLength[field] = documents.length > 0 ? totalLength / documents.length : 1;
  }

  const model: Bm25Model = {
    corpusSize: documents.length,
    avgFieldLength,
    termDocumentFrequency,
    fieldStatsByDocumentId,
  };
  bm25ModelCache.set(documents, model);
  return model;
}

function scoreBm25ForField(
  documentId: string,
  queryTokens: string[],
  model: Bm25Model,
  field: ScorableField,
  fieldWeight: number,
): number {
  if (queryTokens.length === 0 || model.corpusSize === 0) {
    return 0;
  }

  const fieldData = model.fieldStatsByDocumentId.get(documentId)?.[field];
  if (!fieldData) {
    return 0;
  }

  const avgFieldLength = model.avgFieldLength[field] || 1;
  let score = 0;
  for (const token of queryTokens) {
    const termFrequency = fieldData.counts.get(token) ?? 0;
    if (termFrequency === 0) {
      continue;
    }

    const docsWithToken = model.termDocumentFrequency[field].get(token) ?? 0;
    if (docsWithToken === 0) {
      continue;
    }

    const idf =
      Math.log(1 + (model.corpusSize - docsWithToken + 0.5) / (docsWithToken + 0.5));
    const denominator =
      termFrequency +
      BM25_K1 *
        (1 - BM25_B + BM25_B * (fieldData.length / avgFieldLength));
    score +=
      idf * (termFrequency * (BM25_K1 + 1)) / (denominator + BM25_EPSILON);
  }

  return score * fieldWeight;
}

export function scoreWithBm25<TDocument extends SearchDocument>(
  document: TDocument,
  query: string,
  queryTokens: string[],
  model: Bm25Model,
  fieldWeights: Record<ScorableField, number>,
): number {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const expandedQueryTokens = expandQueryTokens(queryTokens);
  const scoredQueryTokens =
    expandedQueryTokens.length > 0 ? expandedQueryTokens : queryTokens;

  const fields = Object.keys(fieldWeights) as ScorableField[];
  let score = 0;
  for (const field of fields) {
    score += scoreBm25ForField(
      document.id,
      scoredQueryTokens,
      model,
      field,
      fieldWeights[field],
    );
  }

  return score;
}
