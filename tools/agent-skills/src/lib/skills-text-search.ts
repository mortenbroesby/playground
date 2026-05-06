export type ScorableField =
  | "id"
  | "display_name"
  | "description"
  | "tags"
  | "triggers"
  | "anti_triggers";

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

const MIN_TOKEN_LENGTH = 2;

const QUERY_SYNONYMS: Record<string, readonly string[]> = {
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

export function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

export function tokenize(value: string): string[] {
  const tokens = normalizeText(value).match(/[a-z0-9]+/g) || [];
  return [...new Set(
    tokens
      .map((token) => token.toLowerCase())
      .filter(
        (token) => token.length >= MIN_TOKEN_LENGTH && !STOP_WORDS.has(token),
      ),
  )];
}

function expandQueryToken(token: string): string[] {
  const normalizedToken = normalizeText(token);
  const expansion = new Set<string>([normalizedToken]);

  const synonymTokens = QUERY_SYNONYMS[normalizedToken];
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
      (candidate) => candidate.length >= MIN_TOKEN_LENGTH,
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
    const directSynonyms = QUERY_SYNONYMS[token];
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
