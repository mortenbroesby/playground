#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { findProjectRoot } from "workspace-tools";

import {
  getRegistryPath,
  isRegistryCurrent,
  loadGeneratedSkillRegistry,
  loadSkillSources,
  writeSkillRegistry,
} from "./lib/skills-registry.mjs";
import {
  getRecentUsageScore,
  loadUsageCache,
  recordSkillUsage,
} from "./lib/skills-usage-cache.mjs";

const repoRoot = findProjectRoot(
  path.dirname(fileURLToPath(import.meta.url)),
  "pnpm",
);

const ALLOWED_GROUPS = new Set([
  "workflow",
  "support",
  "specialist",
  "imported",
]);

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

const ROUTE_PROFILES = {
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

function fail(message) {
  console.error(message);
  process.exit(1);
}

function usage() {
  console.log(`Usage:
  pnpm skills:list [--all] [--group <workflow|support|specialist|imported>] [--daily-driver] [--cold]
  pnpm skills:search <query>
  pnpm skills:read <skill-name>[,<skill-name>...]
  pnpm skills:route <task description> [--json]
  node scripts/skills.mjs registry [--check]

Notes:
  - Repo-owned skills live directly in \`.skills/\`.
  - SKILL.md frontmatter is the canonical identity contract; routing and catalog
    metadata comes from `.skills/registry.metadata.json`.
  - \`.skills/registry.generated.json\` is the deterministic generated registry artifact.
  - \`skills:install\` and \`skills:sync\` are intentionally unsupported in this repo architecture.`);
}

function getAllSkillSources() {
  try {
    return loadSkillSources(repoRoot);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

function getSkillRegistry() {
  try {
    return loadGeneratedSkillRegistry(repoRoot);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

function loadAdvisoryUsageCache() {
  try {
    return loadUsageCache(repoRoot);
  } catch {
    return { version: 1, entries: {} };
  }
}

function splitRequestedSkillNames(args) {
  return args
    .flatMap((arg) => arg.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizeText(value) {
  return value.trim().toLowerCase();
}

function tokenize(value) {
  return [...new Set(normalizeText(value).match(/[a-z0-9]+/g) || [])].filter(
    (token) => token.length > 2 && !STOP_WORDS.has(token),
  );
}

function includesPhrase(haystack, needle) {
  return haystack.includes(needle);
}

function countTokenOverlap(haystackTokens, queryTokens) {
  const haystackTokenSet = new Set(haystackTokens);
  return queryTokens.filter((token) => haystackTokenSet.has(token)).length;
}

function scoreTextField(text, query) {
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

function scoreListField(values, query, multiplier) {
  return values.reduce(
    (total, value) => total + scoreTextField(value, query) * multiplier,
    0,
  );
}

function scoreMetadataMatch(skill, query) {
  let score = 0;
  const reasons = [];
  let exactPhraseMatch = false;
  const normalizedQuery = normalizeText(query);

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

  return {
    exactPhraseMatch,
    score,
    reasons,
  };
}

function scoreRouteEvidence(skill, taskText) {
  const reasons = [];
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

  const nameScore = scoreTextField(
    `${skill.id} ${skill.display_name}`,
    taskText,
  );
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

function getRecentUsage(skillId, usageCache, now = Date.now()) {
  return getRecentUsageScore(usageCache, skillId, now);
}

function matchesSkillName(skill, query) {
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

function activationRank(skill, evidenceScore, explicitMatch) {
  switch (skill.activation_mode) {
    case "explicit-only":
      return explicitMatch ? 0 : 2;
    case "quiet-until-strong-match":
      return evidenceScore >= 12 || explicitMatch ? 0 : 1;
    default:
      return 0;
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function formatCatalogHints(skill, warm) {
  const hints = [];
  if (skill.daily_driver) {
    hints.push("[daily-driver]");
  }
  hints.push(`[group: ${skill.catalog_group}]`);
  if (warm) {
    hints.push("[warm]");
  }
  return hints.join(" ");
}

function renderSkillSummary(skill, { warm = false } = {}) {
  const description = skill.description;
  const catalogGroup = skill.catalog_group ?? skill.catalogGroup;
  const dailyDriver = skill.daily_driver ?? skill.dailyDriver;

  return `${skill.id}: ${description} ${formatCatalogHints(
    {
      ...skill,
      catalog_group: catalogGroup,
      daily_driver: dailyDriver,
    },
    warm,
  )}`.trim();
}

function comparePolicyRanked(left, right) {
  return (
    right.evidenceScore - left.evidenceScore ||
    left.activationRank - right.activationRank ||
    Number(right.skill.daily_driver) - Number(left.skill.daily_driver) ||
    right.skill.agent_benefit - left.skill.agent_benefit ||
    right.recentUsageScore - left.recentUsageScore ||
    left.skill.id.localeCompare(right.skill.id)
  );
}

function compareListRanked(left, right) {
  return (
    Number(right.skill.daily_driver) - Number(left.skill.daily_driver) ||
    right.skill.agent_benefit - left.skill.agent_benefit ||
    right.recentUsageScore - left.recentUsageScore ||
    left.skill.id.localeCompare(right.skill.id)
  );
}

function buildPolicyEntry(skill, evidenceScore, reasons, usageCache, query) {
  const explicitMatch = matchesSkillName(skill, query);
  const recentUsageScore = getRecentUsage(skill.id, usageCache);
  const activation = activationRank(skill, evidenceScore, explicitMatch);
  const policyReasons = [];

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

export function rankSkillsForList(
  skills,
  { includeAll = false, group = null, dailyDriverOnly = false, coldOnly = false } = {},
) {
  const usageCache = loadAdvisoryUsageCache();

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

export function rankSearchMatches(skills, query) {
  const usageCache = loadAdvisoryUsageCache();

  return skills
    .map((skill) => {
      const metadata = scoreMetadataMatch(skill, query);
      return buildPolicyEntry(
        skill,
        metadata.score,
        metadata.reasons,
        usageCache,
        query,
      );
    })
    .filter((entry) => entry.evidenceScore > 0)
    .sort(comparePolicyRanked);
}

function listSkills(args = []) {
  const groupFlagIndex = args.indexOf("--group");
  const group = groupFlagIndex >= 0 ? args[groupFlagIndex + 1] : null;
  const includeAll = args.includes("--all");
  const dailyDriverOnly = args.includes("--daily-driver");
  const coldOnly = args.includes("--cold");

  if (groupFlagIndex >= 0 && !group) {
    fail("`pnpm skills:list --group` requires a group name.");
  }

  if (group && !ALLOWED_GROUPS.has(group)) {
    fail(
      "`pnpm skills:list --group` must be one of workflow, support, specialist, or imported.",
    );
  }

  for (const entry of rankSkillsForList(getSkillRegistry().skills, {
    includeAll,
    group,
    dailyDriverOnly,
    coldOnly,
  })) {
    console.log(
      renderSkillSummary(entry.skill, {
        warm: entry.recentUsageScore > 0,
      }),
    );
  }
}

function searchSkills(query) {
  const needle = normalizeText(query);
  if (!needle) {
    fail("`pnpm skills:search` requires a non-empty query.");
  }

  const metadataMatches = rankSearchMatches(getSkillRegistry().skills, query);
  const fallbackMatches = getAllSkillSources()
    .filter((skill) => normalizeText(skill.contents).includes(needle))
    .sort((left, right) => left.id.localeCompare(right.id));

  if (metadataMatches.length > 0) {
    for (const match of metadataMatches) {
      console.log(
        `${renderSkillSummary(match.skill, {
          warm: match.recentUsageScore > 0,
        })} [metadata: ${unique(match.reasons).join(", ")}]`,
      );
    }
    return;
  }

  if (fallbackMatches.length === 0) {
    process.exit(1);
  }

  for (const skill of fallbackMatches) {
    console.log(`${renderSkillSummary(skill)} [content fallback]`);
  }
}

function readSkills(names) {
  const requestedNames = splitRequestedSkillNames(names);
  if (requestedNames.length === 0) {
    fail("`pnpm skills:read` requires at least one skill name.");
  }

  const registrySkills = getSkillRegistry().skills;
  const requestedIds = new Set(
    registrySkills
      .filter((skill) =>
        requestedNames.some((requestedName) => {
          const normalizedRequestedName = normalizeText(requestedName);
          return (
            normalizeText(skill.id) === normalizedRequestedName ||
            normalizeText(skill.display_name) === normalizedRequestedName
          );
        }),
      )
      .map((skill) => skill.id),
  );

  const allSkills = getAllSkillSources();
  const byName = new Map(allSkills.map((skill) => [skill.id, skill]));

  for (const skillName of requestedNames) {
    const normalizedRequestedName = normalizeText(skillName);
    const resolvedSkillId = registrySkills.find(
      (skill) =>
        normalizeText(skill.id) === normalizedRequestedName ||
        normalizeText(skill.display_name) === normalizedRequestedName,
    )?.id;

    if (!resolvedSkillId || !requestedIds.has(resolvedSkillId)) {
      fail(`Unknown skill: ${skillName}`);
    }

    const skill = byName.get(resolvedSkillId);
    if (!skill) {
      fail(`Missing skill source for registry entry: ${resolvedSkillId}`);
    }

    try {
      recordSkillUsage(repoRoot, resolvedSkillId);
    } catch {}

    if (requestedNames.length > 1) {
      console.log(`=== ${skill.id} ===`);
    }
    console.log(`Base directory: ${skill.relativeDir}`);
    console.log("");
    process.stdout.write(skill.contents);
    if (!skill.contents.endsWith("\n")) {
      process.stdout.write("\n");
    }
    if (requestedNames.length > 1 && skillName !== requestedNames.at(-1)) {
      console.log("");
    }
  }
}

function rebuildRegistry(args) {
  const checkMode = args.includes("--check");
  const registryPath = path.relative(repoRoot, getRegistryPath(repoRoot));

  try {
    if (checkMode) {
      if (!isRegistryCurrent(repoRoot)) {
        fail(
          `Skill registry is stale: ${registryPath}. Rebuild with \`node scripts/skills.mjs registry\`.`,
        );
      }

      console.log(`Skill registry is current: ${registryPath}`);
      return;
    }

    writeSkillRegistry(repoRoot);
    console.log(`Wrote ${registryPath}`);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function skillThresholdForSecondary(primaryEvidenceScore) {
  if (primaryEvidenceScore >= 20) {
    return 8;
  }

  if (primaryEvidenceScore >= 10) {
    return 5;
  }

  return 3;
}

export function routeTaskFromRegistry(skills, text) {
  const usageCache = loadAdvisoryUsageCache();
  const rankedSkills = skills
    .map((skill) => {
      const evidence = scoreRouteEvidence(skill, text);
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
        match.evidenceScore >
          skillThresholdForSecondary(primaryMatch?.evidenceScore ?? 0),
    )
    .map((match) => match.skill.id);

  const rationale = [];
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

  const route = {
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
    /\bprompt\b/,
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

  return {
    task: text,
    alwaysApplyRules: ["repo-workflow", "skill-routing"],
    ...route,
  };
}

function routeTask(args) {
  const jsonMode = args.includes("--json");
  const text = args
    .filter((arg) => arg !== "--json")
    .join(" ")
    .trim();

  if (!text) {
    fail("`pnpm skills:route` requires a task description.");
  }

  const result = routeTaskFromRegistry(getSkillRegistry().skills, text);

  if (jsonMode) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`Mode: ${result.mode}`);
  console.log(`Confidence: ${result.confidence}`);
  console.log(`Primary skill: ${result.primarySkill}`);
  console.log(
    `Secondary skills: ${result.secondarySkills.join(", ") || "(none)"}`,
  );
  console.log(`Always-applied rules: ${result.alwaysApplyRules.join(", ")}`);
  console.log(`Extra rules: ${result.extraRules.join(", ") || "(none)"}`);
  console.log("");
  console.log("Why:");
  for (const reason of result.rationale) {
    console.log(`- ${reason}`);
  }
  if (result.notes.length > 0) {
    console.log("");
    console.log("Notes:");
    for (const note of result.notes) {
      console.log(`- ${note}`);
    }
  }
}

function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === "--help" || command === "-h") {
    usage();
    return;
  }

  switch (command) {
    case "list":
      listSkills(args);
      return;
    case "search":
      searchSkills(args.join(" "));
      return;
    case "read":
      readSkills(args);
      return;
    case "route":
      routeTask(args);
      return;
    case "registry":
      rebuildRegistry(args);
      return;
    case "install":
      fail(
        "`pnpm skills:install` is not supported in the root .skills architecture.",
      );
    case "sync":
      fail(
        "`pnpm skills:sync` is not supported. Keep AGENTS.md thin and load skills on demand.",
      );
    default:
      fail(`Unknown skills command: ${command}`);
  }
}

const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  main();
}
