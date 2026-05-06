import {
  type Bm25Model,
  prepareSearchQuery,
  type ScorableField,
  getBm25Model,
  includesPhrase,
  normalizeText,
  scoreListField,
  scoreTextField,
  scoreWithBm25,
  tokenize,
} from "./skills-text-search";

export type SkillTier =
  | "daily"
  | "normal"
  | "quiet"
  | "explicit";

export type SkillGroup =
  | "workflow"
  | "support"
  | "specialist"
  | "imported";

export interface RegistrySkill {
  id: string;
  display_name: string;
  description: string;
  tags: string[];
  triggers: string[];
  anti_triggers: string[];
  group: SkillGroup;
  tier: SkillTier;
}

export interface PolicyRouteMatch {
  skill: RegistrySkill;
  evidenceScore: number;
  reasons: string[];
  explicitMatch: boolean;
  activationRank: number;
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
  let score = skill.tier === "daily" ? 0.5 : 0;

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

  return {
    skill,
    evidenceScore: score,
    reasons,
  };
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
  switch (skill.tier) {
    case "explicit":
      return explicitMatch ? 0 : 2;
    case "quiet":
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
  query: string,
): PolicyRouteMatch {
  const explicitMatch = matchesSkillName(skill, query);
  const activation = activationRank(skill, evidenceScore, explicitMatch);
  const policyReasons: string[] = [];

  if (skill.tier === "daily") {
    policyReasons.push("daily tier");
  }
  if (activation > 0) {
    policyReasons.push(
      skill.tier === "explicit"
        ? "explicit tier gating"
        : "quiet activation gate",
    );
  }

  return {
    skill,
    evidenceScore,
    reasons,
    explicitMatch,
    activationRank: activation,
    policyReasons,
  };
}

function tierRank(skill: RegistrySkill): number {
  switch (skill.tier) {
    case "daily":
      return 0;
    case "normal":
      return 1;
    case "quiet":
      return 2;
    case "explicit":
      return 3;
    default:
      return 99;
  }
}

function comparePolicyRanked(
  left: PolicyRouteMatch,
  right: PolicyRouteMatch,
): number {
  return (
    right.evidenceScore - left.evidenceScore ||
    left.activationRank - right.activationRank ||
    tierRank(left.skill) - tierRank(right.skill) ||
    left.skill.id.localeCompare(right.skill.id)
  );
}

function compareListRanked(left: PolicyRouteMatch, right: PolicyRouteMatch): number {
  return (
    tierRank(left.skill) - tierRank(right.skill) ||
    left.skill.id.localeCompare(right.skill.id)
  );
}

export function rankSkillsForList(
  skills: RegistrySkill[],
  options: {
    includeAll?: boolean;
    group?: string | null;
    dailyTierOnly?: boolean;
  } = {},
): PolicyRouteMatch[] {
  const {
    includeAll = false,
    group = null,
    dailyTierOnly = false,
  } = options;

  return skills
    .map((skill) =>
      buildPolicyEntry(skill, 0, [], skill.id),
  )
    .filter((entry) => (group ? entry.skill.group === group : true))
    .filter((entry) => (dailyTierOnly ? entry.skill.tier === "daily" : true))
    .filter((entry) => {
      if (includeAll || group || dailyTierOnly) {
        return true;
      }

      return entry.skill.tier === "daily";
    })
    .sort(compareListRanked);
}

export function rankSearchMatches(
  skills: RegistrySkill[],
  query: string,
): PolicyRouteMatch[] {
  const preparedQuery = prepareSearchQuery(query);
  const bm25Model = getBm25Model(skills, getScorableFieldText);

  return skills
    .map((skill) => {
      const metadata = scoreMetadataMatch(
        skill,
        query,
        bm25Model,
        preparedQuery.tokens,
      );
      return buildPolicyEntry(skill, metadata.score, metadata.reasons, query);
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
): string {
  const description = skill.description;
  const hints = [`[group: ${skill.group}]`, `[tier: ${skill.tier}]`];
  return `${skill.id}: ${description} ${hints.join(" ")}`.trim();
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

export function routeTaskFromRegistry(
  skills: RegistrySkill[],
  text: string,
): RouteResult {
  const preparedQuery = prepareSearchQuery(text);
  const bm25Model = getBm25Model(skills, getScorableFieldText);
  const rankedSkills = skills
    .map((skill) => {
      const evidence = scoreRouteEvidence(skill, text, bm25Model, preparedQuery.tokens);
      return buildPolicyEntry(
        skill,
        evidence.evidenceScore,
        evidence.reasons,
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
        buildPolicyEntry(skill, 0, [], text),
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
        "evidence and tier policy"
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
    alwaysApplyRules: ["repo-workflow"],
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
