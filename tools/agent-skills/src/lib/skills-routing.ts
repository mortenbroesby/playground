import {
  getRecentUsageScore,
  type UsageCache,
  loadUsageCache,
} from "./skills-usage-cache.ts";

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

const BM25_QUERY_SYNONYMS: Record<string, readonly string[]> = {
  ai: ["artificial", "intelligence"],
  pr: ["pull", "request", "merge"],
  ci: ["continuous", "integration"],
  ux: ["ui", "user", "experience"],
  uxui: ["ui", "user", "experience"],
};

export type ActivationMode =
  | "default"
  | "high-priority-when-relevant"
  | "quiet-until-strong-match"
  | "explicit-only";

export interface RegistrySkill {
  id: string;
  display_name: string;
  description: string;
  tags: string[];
  triggers: string[];
  anti_triggers: string[];
  routing_weight: number;
  daily_driver: boolean;
  agent_benefit: number;
  catalog_group: string;
  activation_mode: ActivationMode;
}

export interface PolicyRouteMatch {
  skill: RegistrySkill;
  evidenceScore: number;
  reasons: string[];
  explicitMatch: boolean;
  activationRank: number;
  recentUsageScore: number;
  policyReasons: string[];
}

export interface RouteResult {
  task: string;
  mode: string;
  confidence: "high" | "medium" | "low";
  rationale: string[];
  primarySkill: string;
  secondarySkills: string[];
  alwaysApplyRules: string[];
  extraRules: string[];
  notes: string[];
}

const ROUTE_PROFILES: Record<
  string,
  {
    mode: string;
    defaultSecondarySkills: string[];
  }
> = {
  "code-review-and-quality": {
    mode: "review",
    defaultSecondarySkills: ["engineering-workflow"],
  },
  "debugging-and-error-recovery": {
    mode: "debug",
    defaultSecondarySkills: ["test-driven-development"],
  },
  "documentation-and-adrs": {
    mode: "docs",
    defaultSecondarySkills: ["doc-coauthoring"],
  },
  "engineering-workflow": {
    mode: "implement",
    defaultSecondarySkills: ["incremental-implementation"],
  },
  "frontend-design": {
    mode: "implement",
    defaultSecondarySkills: ["engineering-workflow"],
  },
  "planning-and-task-breakdown": {
    mode: "plan",
    defaultSecondarySkills: ["engineering-workflow"],
  },
  "spec-driven-development": {
    mode: "spec",
    defaultSecondarySkills: ["engineering-workflow"],
  },
};

type ScorableField =
  | "id"
  | "display_name"
  | "description"
  | "tags"
  | "triggers"
  | "anti_triggers";

type Bm25Model = {
  corpusSize: number;
  avgFieldLength: Record<ScorableField, number>;
  termDocumentFrequency: Record<ScorableField, Map<string, number>>;
  skillFieldTokens: Map<
    string,
    Record<ScorableField, { counts: Map<string, number>; length: number }>
  >;
};

const BM25_K1 = 1.2;
const BM25_B = 0.75;
const BM25_EPSILON = 1e-8;

const BM25_SEARCH_FIELD_WEIGHTS: Record<ScorableField, number> = {
  id: 2.2,
  display_name: 2,
  description: 1.1,
  tags: 1.3,
  triggers: 2.4,
  anti_triggers: -1.8,
};

const BM25_ROUTE_FIELD_WEIGHTS: Record<ScorableField, number> = {
  id: 1.9,
  display_name: 1.7,
  description: 1.0,
  tags: 1.5,
  triggers: 2.2,
  anti_triggers: -2.2,
};

export function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function tokenize(value: string): string[] {
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

  return [...new Set(Array.from(expansion).filter((candidate) => candidate.length >= BM25_MIN_TOKEN_LENGTH))];
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

function includesPhrase(haystack: string, needle: string): boolean {
  return haystack.includes(needle);
}

function countTokenOverlap(haystackTokens: string[], queryTokens: string[]): number {
  const haystackTokenSet = new Set(haystackTokens);
  return queryTokens.filter((token) => haystackTokenSet.has(token)).length;
}

function scoreTextField(text: string, query: string): number {
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

function getScorableFieldText(skill: RegistrySkill, field: ScorableField): string {
  switch (field) {
    case "id":
      return skill.id;
    case "display_name":
      return skill.display_name;
    case "description":
      return skill.description;
    case "tags":
      return skill.tags.join(" ");
    case "triggers":
      return skill.triggers.join(" ");
    case "anti_triggers":
      return skill.anti_triggers.join(" ");
    default:
      return "";
  }
}

function buildBm25Model(skills: RegistrySkill[]): Bm25Model {
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
  const skillFieldTokens = new Map<
    string,
    Record<ScorableField, { counts: Map<string, number>; length: number }>
  >();
  const fields = Object.keys(avgFieldLength) as ScorableField[];

  for (const skill of skills) {
    const byField: Record<ScorableField, { counts: Map<string, number>; length: number }> = {
      id: { counts: new Map(), length: 0 },
      display_name: { counts: new Map(), length: 0 },
      description: { counts: new Map(), length: 0 },
      tags: { counts: new Map(), length: 0 },
      triggers: { counts: new Map(), length: 0 },
      anti_triggers: { counts: new Map(), length: 0 },
    };

    for (const field of fields) {
      const text = getScorableFieldText(skill, field);
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

    skillFieldTokens.set(skill.id, byField);
  }

  for (const field of fields) {
    const totalLength = [...skillFieldTokens.values()].reduce(
      (sum, value) => sum + value[field].length,
      0,
    );
    avgFieldLength[field] =
      skills.length > 0 ? totalLength / skills.length : 1;
  }

  return {
    corpusSize: skills.length,
    avgFieldLength,
    termDocumentFrequency,
    skillFieldTokens,
  };
}

function scoreBm25ForField(
  skill: RegistrySkill,
  queryTokens: string[],
  model: Bm25Model,
  field: ScorableField,
  fieldWeight: number,
): number {
  if (queryTokens.length === 0 || model.corpusSize === 0) {
    return 0;
  }

  const fieldData = model.skillFieldTokens.get(skill.id)?.[field];
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

function scoreWithBm25(
  skill: RegistrySkill,
  query: string,
  queryTokens: string[],
  model: Bm25Model,
  fieldWeights: Record<ScorableField, number>,
): number {
  const normalisedQuery = normalizeText(query);
  if (!normalisedQuery) {
    return 0;
  }

  const expandedQueryTokens = expandQueryTokens(queryTokens);
  const scoredQueryTokens =
    expandedQueryTokens.length > 0 ? expandedQueryTokens : queryTokens;

  const fields = Object.keys(fieldWeights) as ScorableField[];
  let score = 0;
  for (const field of fields) {
    score += scoreBm25ForField(
      skill,
      scoredQueryTokens,
      model,
      field,
      fieldWeights[field],
    );
  }

  return score;
}

function scoreListField(values: string[], query: string, multiplier: number): number {
  return values.reduce(
    (total, value) => total + scoreTextField(value, query) * multiplier,
    0,
  );
}

export function scoreMetadataMatch(
  skill: RegistrySkill,
  query: string,
  bm25Model?: Bm25Model,
  queryTokens: string[] = tokenize(query),
) {
  let score = 0;
  const reasons: string[] = [];
  let exactPhraseMatch = false;
  const normalizedQuery = normalizeText(query);
  const safeQueryTokens = queryTokens.length > 0 ? queryTokens : tokenize(query);
  const bm25Score =
    bm25Model === undefined || safeQueryTokens.length === 0
      ? 0
      : scoreWithBm25(skill, query, safeQueryTokens, bm25Model, BM25_SEARCH_FIELD_WEIGHTS);

  const idScore = scoreTextField(skill.id, query) * 2;
  if (idScore > 0) {
    score += idScore;
    reasons.push("id");
    exactPhraseMatch ||= includesPhrase(normalizeText(skill.id), normalizedQuery);
  }

  const nameScore = scoreTextField(skill.display_name, query) * 2;
  if (nameScore > 0) {
    score += nameScore;
    reasons.push("name");
    exactPhraseMatch ||= includesPhrase(
      normalizeText(skill.display_name),
      normalizedQuery,
    );
  }

  const descriptionScore = scoreTextField(skill.description, query);
  if (descriptionScore > 0) {
    score += descriptionScore;
    reasons.push("description");
    exactPhraseMatch ||= includesPhrase(
      normalizeText(skill.description),
      normalizedQuery,
    );
  }

  const tagsScore = scoreListField(skill.tags, query, 2);
  if (tagsScore > 0) {
    score += tagsScore;
    reasons.push("tags");
    exactPhraseMatch ||= skill.tags.some((value) =>
      includesPhrase(normalizeText(value), normalizedQuery),
    );
  }

  const triggerScore = scoreListField(skill.triggers, query, 3);
  if (triggerScore > 0) {
    score += triggerScore;
    reasons.push("triggers");
    exactPhraseMatch ||= skill.triggers.some((value) =>
      includesPhrase(normalizeText(value), normalizedQuery),
    );
  }

  const antiTriggerPenalty = scoreListField(skill.anti_triggers, query, 3);
  if (antiTriggerPenalty > 0) {
    score -= antiTriggerPenalty;
    reasons.push("anti-triggers");
  }

  if (bm25Score > 0) {
    score += bm25Score;
    reasons.push("bm25");
  }

  return {
    exactPhraseMatch,
    score,
    reasons,
  };
}

function scoreRouteEvidence(
  skill: RegistrySkill,
  taskText: string,
  bm25Model?: Bm25Model,
  queryTokens: string[] = tokenize(taskText),
) {
  const reasons: string[] = [];
  let score = skill.routing_weight;

  const triggerScore = scoreListField(skill.triggers, taskText, 4);
  if (triggerScore > 0) {
    score += triggerScore;
    reasons.push("evidence match");
  }

  const tagScore = scoreListField(skill.tags, taskText, 3);
  if (tagScore > 0) {
    score += tagScore;
    reasons.push("tag match");
  }

  const nameScore = scoreTextField(`${skill.id} ${skill.display_name}`, taskText);
  if (nameScore > 0) {
    score += nameScore;
    reasons.push("name match");
  }

  const descriptionScore = scoreTextField(skill.description, taskText);
  if (descriptionScore > 0) {
    score += descriptionScore;
    reasons.push("description match");
  }

  const antiTriggerPenalty = scoreListField(skill.anti_triggers, taskText, 4);
  if (antiTriggerPenalty > 0) {
    score -= antiTriggerPenalty;
    reasons.push("anti-trigger penalty");
  }

  const safeQueryTokens = queryTokens.length > 0 ? queryTokens : tokenize(taskText);
  const bm25Score =
    bm25Model === undefined || safeQueryTokens.length === 0
      ? 0
      : scoreWithBm25(
          skill,
          taskText,
          safeQueryTokens,
          bm25Model,
          BM25_ROUTE_FIELD_WEIGHTS,
        );
  if (bm25Score > 0) {
    score += bm25Score;
    reasons.push("bm25");
  }

  if (skill.id === "engineering-workflow") {
    score += 0.5;
    reasons.push("default umbrella workflow");
  }

  return {
    skill,
    evidenceScore: score,
    reasons,
  };
}

function getRecentUsage(skillId: string, usageCache: UsageCache, now = Date.now()) {
  return getRecentUsageScore(usageCache, skillId, now);
}

export function matchesSkillName(skill: RegistrySkill, query: string): boolean {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return false;
  }

  return (
    normalizeText(skill.id) === normalizedQuery ||
    normalizeText(skill.display_name) === normalizedQuery ||
    includesPhrase(normalizeText(skill.id), normalizedQuery) ||
    includesPhrase(normalizeText(skill.display_name), normalizedQuery)
  );
}

function activationRank(
  skill: RegistrySkill,
  evidenceScore: number,
  explicitMatch: boolean,
): number {
  switch (skill.activation_mode) {
    case "explicit-only":
      return explicitMatch ? 0 : 2;
    case "quiet-until-strong-match":
      return evidenceScore >= 12 || explicitMatch ? 0 : 1;
    default:
      return 0;
  }
}

function unique(values: ReadonlyArray<string>): string[] {
  return [...new Set(values.filter(Boolean))];
}

function buildPolicyEntry(
  skill: RegistrySkill,
  evidenceScore: number,
  reasons: string[],
  usageCache: UsageCache,
  query: string,
): PolicyRouteMatch {
  const explicitMatch = matchesSkillName(skill, query);
  const recentUsageScore = getRecentUsage(skill.id, usageCache, Date.now());
  const activation = activationRank(skill, evidenceScore, explicitMatch);
  const policyReasons: string[] = [];

  if (skill.daily_driver) {
    policyReasons.push("daily-driver boost");
  }
  if (skill.agent_benefit > 3) {
    policyReasons.push("benefit boost");
  }
  if (recentUsageScore > 0) {
    policyReasons.push("warm-recency tie-break");
  }
  if (activation > 0) {
    policyReasons.push(
      skill.activation_mode === "explicit-only"
        ? "explicit-only gating"
        : "quiet activation gate",
    );
  }

  return {
    skill,
    evidenceScore,
    reasons,
    explicitMatch,
    activationRank: activation,
    recentUsageScore,
    policyReasons,
  };
}

function comparePolicyRanked(
  left: PolicyRouteMatch,
  right: PolicyRouteMatch,
): number {
  return (
    right.evidenceScore - left.evidenceScore ||
    left.activationRank - right.activationRank ||
    Number(right.skill.daily_driver) - Number(left.skill.daily_driver) ||
    right.skill.agent_benefit - left.skill.agent_benefit ||
    right.recentUsageScore - left.recentUsageScore ||
    left.skill.id.localeCompare(right.skill.id)
  );
}

function compareListRanked(left: PolicyRouteMatch, right: PolicyRouteMatch): number {
  return (
    Number(right.skill.daily_driver) - Number(left.skill.daily_driver) ||
    right.skill.agent_benefit - left.skill.agent_benefit ||
    right.recentUsageScore - left.recentUsageScore ||
    left.skill.id.localeCompare(right.skill.id)
  );
}

export function rankSkillsForList(
  skills: RegistrySkill[],
  options: {
    includeAll?: boolean;
    group?: string | null;
    dailyDriverOnly?: boolean;
    coldOnly?: boolean;
  } = {},
  repoRoot = process.cwd(),
): PolicyRouteMatch[] {
  const usageCache = loadUsageCache(repoRoot);
  const {
    includeAll = false,
    group = null,
    dailyDriverOnly = false,
    coldOnly = false,
  } = options;

  return skills
    .map((skill) =>
      buildPolicyEntry(skill, 0, [], usageCache, skill.id),
  )
    .filter((entry) => (group ? entry.skill.catalog_group === group : true))
    .filter((entry) => (dailyDriverOnly ? entry.skill.daily_driver : true))
    .filter((entry) => (coldOnly ? entry.recentUsageScore === 0 : true))
    .filter((entry) => {
      if (includeAll || group || dailyDriverOnly || coldOnly) {
        return true;
      }

      return (
        entry.skill.daily_driver ||
        (entry.skill.agent_benefit >= 4 && entry.recentUsageScore > 0)
      );
    })
    .sort(compareListRanked);
}

export function rankSearchMatches(
  skills: RegistrySkill[],
  query: string,
  repoRoot = process.cwd(),
): PolicyRouteMatch[] {
  const usageCache = loadUsageCache(repoRoot);
  const queryTokens = tokenize(query);
  const bm25Model = buildBm25Model(skills);

  return skills
    .map((skill) => {
      const metadata = scoreMetadataMatch(
        skill,
        query,
        bm25Model,
        queryTokens,
      );
      return buildPolicyEntry(skill, metadata.score, metadata.reasons, usageCache, query);
    })
    .filter((entry) => entry.evidenceScore > 0)
    .sort(comparePolicyRanked);
}

function skillThresholdForSecondary(primaryEvidenceScore: number): number {
  if (primaryEvidenceScore >= 20) {
    return 8;
  }
  if (primaryEvidenceScore >= 10) {
    return 5;
  }
  return 3;
}

export function renderSkillSummary(
  skill: RegistrySkill,
  options: {
    warm?: boolean;
  } = {},
): string {
  const description = skill.description;
  const hints = [`[group: ${skill.catalog_group}]`];
  if (skill.daily_driver) {
    hints.unshift("[daily-driver]");
  }
  if (options.warm) {
    hints.push("[warm]");
  }
  return `${skill.id}: ${description} ${hints.join(" ")}`.trim();
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

export function routeTaskFromRegistry(
  skills: RegistrySkill[],
  text: string,
  repoRoot = process.cwd(),
): RouteResult {
  const usageCache = loadUsageCache(repoRoot);
  const queryTokens = tokenize(text);
  const bm25Model = buildBm25Model(skills);
  const rankedSkills = skills
    .map((skill) => {
      const evidence = scoreRouteEvidence(skill, text, bm25Model, queryTokens);
      return buildPolicyEntry(
        skill,
        evidence.evidenceScore,
        evidence.reasons,
        usageCache,
        text,
      );
    })
    .filter((entry) => entry.evidenceScore > 0)
    .sort(comparePolicyRanked);

  const primaryMatch =
    rankedSkills[0] ??
    skills
      .filter((skill) => skill.id === "engineering-workflow")
      .map((skill) =>
        buildPolicyEntry(skill, 0.5, ["default umbrella workflow"], usageCache, text),
      )[0];

  const primarySkill = primaryMatch?.skill.id || "engineering-workflow";
  const profile = ROUTE_PROFILES[primarySkill] || {
    mode: "implement",
    defaultSecondarySkills:
      primarySkill === "engineering-workflow"
        ? ["incremental-implementation"]
        : ["engineering-workflow"],
  };

  const secondaryCandidates = rankedSkills
    .filter(
      (match) =>
        match.skill.id !== primarySkill &&
        match.evidenceScore > skillThresholdForSecondary(primaryMatch?.evidenceScore ?? 0),
    )
    .map((match) => match.skill.id);

  const rationale: string[] = [];
  if (primaryMatch) {
    rationale.push(
      `Primary skill \`${primarySkill}\` won from ${
        unique([...primaryMatch.reasons, ...primaryMatch.policyReasons]).join(", ") ||
        "routing weight"
      }.`,
    );
  } else {
    rationale.push(
      "No strong metadata match surfaced, so the umbrella workflow stays primary.",
    );
  }

  if (secondaryCandidates.length > 0 || profile.defaultSecondarySkills.length > 0) {
    rationale.push(
      "Secondary skills come from the primary skill profile and the next strongest registry matches.",
    );
  }

  const route: RouteResult = {
    mode: profile.mode,
    confidence:
      (primaryMatch?.evidenceScore ?? 0) >= 20
        ? "high"
        : (primaryMatch?.evidenceScore ?? 0) >= 8
          ? "medium"
          : "low",
    rationale,
    primarySkill,
    secondarySkills: unique([
      ...profile.defaultSecondarySkills,
      ...secondaryCandidates,
    ]).filter((skill) => skill !== primarySkill),
    extraRules: [],
    notes: [],
    task: text,
    alwaysApplyRules: ["repo-workflow", "skill-routing"],
  };

  const normalizedText = normalizeText(text);
  const mentionsAgentInfra = hasAny(normalizedText, [
    /\bagents?\.md\b/,
    /\b\.agents\b/,
    /\b\.claude\b/,
    /\b\.codex\b/,
    /\bhook\b/,
    /\brules?\b/,
    /\bskills?\b/,
    /\bbootstrap\b/,
    /\bcontext\b/,
  ]);
  const mentionsMemory = hasAny(normalizedText, [
    /\bvault\b/,
    /\bnote\b/,
    /\bnotes\b/,
    /\bdecision\b/,
    /\barchitecture\b/,
    /\bsession\b/,
    /\btask\b/,
    /\badr\b/,
    /\bmemory\b/,
  ]);
  const mentionsFrontend =
    primarySkill === "frontend-design" ||
    route.secondarySkills.includes("frontend-design");
  const mentionsDocs =
    primarySkill === "documentation-and-adrs" ||
    route.secondarySkills.includes("documentation-and-adrs") ||
    route.secondarySkills.includes("doc-coauthoring");

  if (mentionsFrontend) {
    route.secondarySkills.push("frontend-design");
    route.extraRules.push("frontend");
    route.notes.push(
      "Load the frontend rule only when UI or layout work is actually in scope.",
    );
  }

  if (mentionsAgentInfra) {
    route.extraRules.push("agent-infrastructure");
    route.notes.push(
      "Agent infrastructure work should load the path-scoped infrastructure rule.",
    );
  }

  if (mentionsMemory || mentionsDocs) {
    route.extraRules.push("memory-note-routing");
    route.notes.push(
      "Memory-related work should load the note-routing rule before creating durable notes.",
    );
  }

  route.secondarySkills = unique(route.secondarySkills).filter(
    (skill) => skill !== route.primarySkill,
  );
  route.extraRules = unique(route.extraRules);

  return route;
}
