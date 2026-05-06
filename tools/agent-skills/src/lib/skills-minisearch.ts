import MiniSearch from "minisearch";

import type { PolicyRouteMatch, RegistrySkill } from "./skills-routing";
import { matchesSkillName, renderSkillSummary } from "./skills-routing";
import { prepareSearchQuery } from "./skills-text-search";

type MiniSearchDocument = {
  id: string;
  display_name: string;
  description: string;
  tags: string;
  triggers: string;
  anti_triggers: string;
  group: RegistrySkill["group"];
  tier: RegistrySkill["tier"];
};

const miniSearchCache = new WeakMap<
  ReadonlyArray<RegistrySkill>,
  MiniSearch<MiniSearchDocument>
>();

function toMiniSearchDocument(skill: RegistrySkill): MiniSearchDocument {
  return {
    id: skill.id,
    display_name: skill.display_name,
    description: skill.description,
    tags: skill.tags.join(" "),
    triggers: skill.triggers.join(" "),
    anti_triggers: skill.anti_triggers.join(" "),
    group: skill.group,
    tier: skill.tier,
  };
}

function getMiniSearchIndex(skills: RegistrySkill[]): MiniSearch<MiniSearchDocument> {
  const cached = miniSearchCache.get(skills);
  if (cached) {
    return cached;
  }

  const index = new MiniSearch<MiniSearchDocument>({
    fields: ["id", "display_name", "description", "tags", "triggers"],
    storeFields: [
      "id",
      "display_name",
      "description",
      "group",
      "tier",
      "tags",
      "triggers",
      "anti_triggers",
    ],
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      boost: {
        id: 2.2,
        display_name: 2,
        description: 1.1,
        tags: 1.3,
        triggers: 2.4,
      },
    },
  });
  index.addAll(skills.map(toMiniSearchDocument));
  miniSearchCache.set(skills, index);
  return index;
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

function activationRank(skill: RegistrySkill, query: string): number {
  const explicitMatch = matchesSkillName(skill, query);
  switch (skill.tier) {
    case "explicit":
      return explicitMatch ? 0 : 2;
    case "quiet":
      return explicitMatch ? 0 : 1;
    default:
      return 0;
  }
}

export function rankMiniSearchMatches(
  skills: RegistrySkill[],
  query: string,
): PolicyRouteMatch[] {
  const index = getMiniSearchIndex(skills);
  const byId = new Map(skills.map((skill) => [skill.id, skill]));
  const preparedQuery = prepareSearchQuery(query);
  const searchableQuery = preparedQuery.expandedText || preparedQuery.normalized;

  return index
    .search(searchableQuery)
    .map((result) => {
      const skill = byId.get(result.id);
      if (!skill) {
        return null;
      }

      const reasons = ["minisearch"];
      if (preparedQuery.hasSynonymExpansion) {
        reasons.push("synonym");
      }
      if (preparedQuery.hasMorphologyExpansion) {
        reasons.push("query expansion");
      }
      if (matchesSkillName(skill, query)) {
        reasons.unshift("name");
      }

      const policyReasons: string[] = [];
      const computedActivationRank = activationRank(skill, query);
      if (skill.tier === "daily") {
        policyReasons.push("daily tier");
      }
      if (computedActivationRank > 0) {
        policyReasons.push(
          skill.tier === "explicit"
            ? "explicit tier gating"
            : "quiet activation gate",
        );
      }

      return {
        skill,
        evidenceScore: result.score,
        reasons,
        explicitMatch: matchesSkillName(skill, query),
        activationRank: computedActivationRank,
        policyReasons,
      } satisfies PolicyRouteMatch;
    })
    .filter((entry): entry is PolicyRouteMatch => entry !== null)
    .filter((entry) => !(entry.skill.tier === "explicit" && !entry.explicitMatch))
    .sort((left, right) => {
      return (
        right.evidenceScore - left.evidenceScore ||
        left.activationRank - right.activationRank ||
        tierRank(left.skill) - tierRank(right.skill) ||
        left.skill.id.localeCompare(right.skill.id)
      );
    });
}

export function renderMiniSearchMatch(entry: PolicyRouteMatch): string {
  return `${renderSkillSummary(entry.skill)} [metadata: ${entry.reasons.join(", ")}]`;
}
