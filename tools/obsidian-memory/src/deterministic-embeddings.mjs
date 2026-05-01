const DEFAULT_DIMENSIONS = 48;

const CONCEPT_GROUPS = [
  ["architecture", "design", "structure", "layout", "topology"],
  ["decision", "adr", "tradeoff", "rationale", "why"],
  ["session", "handoff", "log", "timeline", "recent"],
  ["todo", "task", "next", "remaining", "backlog"],
  ["spec", "plan", "proposal", "build", "implement"],
  ["vector", "semantic", "embedding", "similarity"],
  ["retrieval", "search", "lookup", "query", "find"],
  ["memory", "knowledge", "context", "notes"],
  ["routing", "route", "navigation", "router"],
  ["host", "shell", "container"],
  ["remote", "microfrontend", "mfe"],
  ["compose", "composition", "layout"],
];

const CONCEPT_LOOKUP = new Map();

for (const group of CONCEPT_GROUPS) {
  for (const token of group) {
    CONCEPT_LOOKUP.set(token, group);
  }
}

export const DETERMINISTIC_VECTOR_ENGINE = Object.freeze({
  name: "deterministic-hash-v1",
  dimensions: DEFAULT_DIMENSIONS,
  metric: "cosine",
});

function tokenize(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9/._-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function stemToken(token) {
  return token
    .replace(/(?:ing|edly|edly|edly|ed|tion|sion|ment|ness|able|ible)$/u, "")
    .replace(/(?:ies)$/u, "y")
    .replace(/(?:es|s)$/u, "");
}

function trigrams(token) {
  if (token.length <= 3) {
    return [token];
  }

  const grams = [];
  for (let index = 0; index <= token.length - 3; index += 1) {
    grams.push(token.slice(index, index + 3));
  }
  return grams;
}

function stableHash(value, seed) {
  let hash = seed >>> 0;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function expandTokens(tokens) {
  const weighted = [];

  for (const token of tokens) {
    weighted.push([token, 1]);

    const stem = stemToken(token);
    if (stem && stem !== token) {
      weighted.push([stem, 0.7]);
    }

    const group = CONCEPT_LOOKUP.get(token) ?? CONCEPT_LOOKUP.get(stem);
    if (group) {
      for (const alias of group) {
        if (alias !== token) {
          weighted.push([alias, 0.35]);
        }
      }
    }

    for (const gram of trigrams(token)) {
      weighted.push([`tri:${gram}`, 0.15]);
    }
  }

  return weighted;
}

function normalizeVector(values) {
  const magnitude = Math.hypot(...values);
  if (magnitude === 0) {
    return values;
  }

  return values.map((value) => Number((value / magnitude).toFixed(6)));
}

export function embedTextDeterministically(input, options = {}) {
  const dimensions = options.dimensions ?? DEFAULT_DIMENSIONS;
  const vector = Array.from({ length: dimensions }, () => 0);
  const weightedTokens = expandTokens(tokenize(input));

  for (const [token, weight] of weightedTokens) {
    const primary = stableHash(token, 2166136261) % dimensions;
    const secondary = stableHash(token, 333555777) % dimensions;
    const tertiary = stableHash(token, 1013904223) % dimensions;
    const sign = stableHash(token, 2654435761) % 2 === 0 ? 1 : -1;

    vector[primary] += weight;
    vector[secondary] -= weight * 0.5 * sign;
    vector[tertiary] += weight * 0.25 * sign;
  }

  return normalizeVector(vector);
}

export function cosineSimilarity(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
    return 0;
  }

  let total = 0;
  for (let index = 0; index < left.length; index += 1) {
    total += left[index] * right[index];
  }

  return Number(total.toFixed(6));
}

export function buildChunkEmbeddingInput({ note, chunk }) {
  return [
    note?.title ?? chunk.heading,
    note?.summary ?? chunk.summary ?? "",
    chunk.heading,
    chunk.source_path,
    note?.keywords?.join(" ") ?? "",
    note?.tags?.join(" ") ?? "",
    chunk.text,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildQueryEmbeddingInput({ query, queryPlan }) {
  return [
    query,
    queryPlan?.classification?.intent ?? "",
    queryPlan?.classification?.preferredNoteTypes?.join(" ") ??
      queryPlan?.expectedNoteTypes?.join(" ") ??
      "",
    queryPlan?.keywords?.join(" ") ?? "",
    queryPlan?.variants?.expanded?.join(" ") ?? "",
  ]
    .filter(Boolean)
    .join("\n");
}
