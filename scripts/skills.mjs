#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { findProjectRoot } from "workspace-tools";

import {
  getRegistryPath,
  loadGeneratedSkillRegistry,
  isRegistryCurrent,
  loadSkillSources,
  writeSkillRegistry,
} from "./lib/skills-registry.mjs";

const repoRoot = findProjectRoot(
  path.dirname(fileURLToPath(import.meta.url)),
  "pnpm",
);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function usage() {
  console.log(`Usage:
  pnpm skills:list
  pnpm skills:search <query>
  pnpm skills:read <skill-name>[,<skill-name>...]
  pnpm skills:route <task description> [--json]
  node scripts/skills.mjs registry [--check]

Notes:
  - Repo-owned skills live directly in \`.skills/\`.
  - Frontmatter is the canonical machine-readable metadata contract.
  - \`.skills/registry.generated.json\` is the deterministic generated registry artifact.
  - \`skills:install\` and \`skills:sync\` are intentionally unsupported in this repo architecture.`);
}

// Keep the CLI thin. Discovery, parsing, and registry generation should live in
// dedicated helpers so this file mostly dispatches commands and formats output.
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

function splitRequestedSkillNames(args) {
  return args
    .flatMap((arg) => arg.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function listSkills() {
  for (const skill of getSkillRegistry().skills) {
    console.log(`${skill.id}: ${skill.description}`);
  }
}

function normalizeText(value) {
  return value.trim().toLowerCase();
}

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
  const queryTokens = tokenize(query);
  let score = 0;

  if (includesPhrase(normalizedText, normalizeText(query))) {
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

  const idScore = scoreTextField(skill.id, query) * 2;
  if (idScore > 0) {
    score += idScore;
    reasons.push("id");
    exactPhraseMatch ||= includesPhrase(
      normalizeText(skill.id),
      normalizeText(query),
    );
  }

  const nameScore = scoreTextField(skill.display_name, query) * 2;
  if (nameScore > 0) {
    score += nameScore;
    reasons.push("name");
    exactPhraseMatch ||= includesPhrase(
      normalizeText(skill.display_name),
      normalizeText(query),
    );
  }

  const descriptionScore = scoreTextField(skill.description, query);
  if (descriptionScore > 0) {
    score += descriptionScore;
    reasons.push("description");
    exactPhraseMatch ||= includesPhrase(
      normalizeText(skill.description),
      normalizeText(query),
    );
  }

  const tagsScore = scoreListField(skill.tags, query, 2);
  if (tagsScore > 0) {
    score += tagsScore;
    reasons.push("tags");
    exactPhraseMatch ||= skill.tags.some((value) =>
      includesPhrase(normalizeText(value), normalizeText(query)),
    );
  }

  const triggerScore = scoreListField(skill.triggers, query, 3);
  if (triggerScore > 0) {
    score += triggerScore;
    reasons.push("triggers");
    exactPhraseMatch ||= skill.triggers.some((value) =>
      includesPhrase(normalizeText(value), normalizeText(query)),
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

function sortMatches(left, right) {
  return (
    right.score - left.score || left.skill.id.localeCompare(right.skill.id)
  );
}

function searchSkills(query) {
  const needle = normalizeText(query);
  if (!needle) {
    fail("`pnpm skills:search` requires a non-empty query.");
  }

  const registry = getSkillRegistry();
  const metadataMatches = registry.skills
    .map((skill) => ({
      skill,
      ...scoreMetadataMatch(skill, query),
    }))
    .filter((match) => match.score > 0)
    .sort(sortMatches);

  const fallbackMatches = getAllSkillSources()
    .filter((skill) => normalizeText(skill.contents).includes(needle))
    .sort((left, right) => left.id.localeCompare(right.id));

  const hasExactMetadataPhraseMatch = metadataMatches.some(
    (match) => match.exactPhraseMatch,
  );

  if (fallbackMatches.length > 0 && !hasExactMetadataPhraseMatch) {
    for (const skill of fallbackMatches) {
      console.log(`${skill.id}: ${skill.description} [content fallback]`);
    }
    return;
  }

  if (metadataMatches.length > 0) {
    for (const match of metadataMatches) {
      console.log(
        `${match.skill.id}: ${match.skill.description} [metadata: ${match.reasons.join(
          ", ",
        )}]`,
      );
    }
    return;
  }

  if (fallbackMatches.length === 0) {
    process.exit(1);
  }

  for (const skill of fallbackMatches) {
    console.log(`${skill.id}: ${skill.description} [content fallback]`);
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
      // `--check` is the cheap guard path for hooks/CI. It should fail loudly
      // when the committed registry drifts from the current skill tree.
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

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

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

function scoreRouteSkill(skill, taskText) {
  const reasons = [];
  let score = skill.routing_weight;

  const triggerScore = scoreListField(skill.triggers, taskText, 4);
  if (triggerScore > 0) {
    score += triggerScore;
    reasons.push("trigger match");
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
    score,
    reasons,
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

  const registry = getSkillRegistry();
  const rankedSkills = registry.skills
    .map((skill) => scoreRouteSkill(skill, text))
    .sort(sortMatches);

  const primaryMatch =
    rankedSkills.find((match) => match.score > 0) ??
    rankedSkills.find((match) => match.skill.id === "engineering-workflow");

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
        match.score > skillThresholdForSecondary(primaryMatch?.score ?? 0),
    )
    .map((match) => match.skill.id);

  const secondarySkills = unique([
    ...profile.defaultSecondarySkills,
    ...secondaryCandidates,
  ]).filter((skill) => skill !== primarySkill);

  const rationale = [];
  if (primaryMatch) {
    rationale.push(
      `Primary skill \`${primarySkill}\` won the registry score from ${
        unique(primaryMatch.reasons).join(", ") || "routing weight"
      }.`,
    );
  } else {
    rationale.push(
      "No strong metadata match surfaced, so the umbrella workflow stays primary.",
    );
  }
  if (secondarySkills.length > 0) {
    rationale.push(
      `Secondary skills come from the primary skill profile and the next strongest registry matches.`,
    );
  }

  const route = {
    mode: profile.mode,
    confidence:
      (primaryMatch?.score ?? 0) >= 20
        ? "high"
        : (primaryMatch?.score ?? 0) >= 8
          ? "medium"
          : "low",
    rationale,
    primarySkill,
    secondarySkills,
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
    secondarySkills.includes("frontend-design");
  const mentionsDocs =
    primarySkill === "documentation-and-adrs" ||
    secondarySkills.includes("documentation-and-adrs") ||
    secondarySkills.includes("doc-coauthoring");

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

  const result = {
    task: text,
    alwaysApplyRules: ["repo-workflow", "skill-routing"],
    ...route,
  };

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

function skillThresholdForSecondary(primaryScore) {
  if (primaryScore >= 20) {
    return 8;
  }

  if (primaryScore >= 10) {
    return 5;
  }

  return 3;
}

function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === "--help" || command === "-h") {
    usage();
    return;
  }

  switch (command) {
    case "list":
      listSkills();
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

main();
