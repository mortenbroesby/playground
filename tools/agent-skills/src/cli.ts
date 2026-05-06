#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { findProjectRoot } from "workspace-tools";

import {
  loadGeneratedSkillRegistry,
  loadSkillSources,
  writeSkillRegistry,
  getRegistryPath,
  isRegistryCurrent,
} from "./lib/skills-registry.ts";
import {
  rankSearchMatches,
  rankSkillsForList,
  renderSkillSummary,
  routeTaskFromRegistry,
  type RegistrySkill,
} from "./lib/skills-routing.ts";

const repoRoot = findProjectRoot(
  path.dirname(fileURLToPath(import.meta.url)),
  "pnpm",
);
const allowedGroups = new Set(["workflow", "support", "specialist", "imported"]);

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function usage(): void {
  console.log(`Usage:
  pnpm skills:list [--all] [--group <workflow|support|specialist|imported>] [--daily]
  pnpm skills:search <query>
  pnpm skills:read <skill-name>[,<skill-name>...]
  pnpm skills:route <task description> [--json]
  pnpm skills:registry [--check]

Notes:
  - Repo-owned skills live directly in \`.skills/\`.
  - SKILL.md frontmatter is the canonical identity contract; routing and catalog
    metadata comes from \`.skills/.metadata/registry.metadata.json\`.
  - \`.skills/.metadata/registry.generated.json\` is the deterministic generated
    registry artifact.
  - \`skills:install\` and \`skills:sync\` are intentionally unsupported in this repo architecture.`);
}

function getAllSkillSources() {
  try {
    return loadSkillSources(repoRoot);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

function getSkillRegistry(): ReturnType<typeof loadGeneratedSkillRegistry> {
  try {
    return loadGeneratedSkillRegistry(repoRoot);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

function splitRequestedSkillNames(args: string[]): string[] {
  return args
    .flatMap((arg) => arg.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function listSkills(args: string[] = []): void {
  const groupFlagIndex = args.indexOf("--group");
  const group = groupFlagIndex >= 0 ? args[groupFlagIndex + 1] ?? null : null;
  const includeAll = args.includes("--all");
  const dailyTierOnly = args.includes("--daily");

  if (groupFlagIndex >= 0 && !group) {
    fail("`pnpm skills:list --group` requires a group name.");
  }

  if (group && !allowedGroups.has(group)) {
    fail(
      "`pnpm skills:list --group` must be one of workflow, support, specialist, or imported.",
    );
  }

  for (const entry of rankSkillsForList(
    getSkillRegistry().skills,
    {
      includeAll,
      group,
      dailyTierOnly,
    },
  )) {
    console.log(renderSkillSummary(entry.skill));
  }
}

function searchSkills(query: string): void {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    fail("`pnpm skills:search` requires a non-empty query.");
  }

  const metadataMatches = rankSearchMatches(
    getSkillRegistry().skills,
    query,
  );
  const fallbackMatches = getAllSkillSources()
    .filter((skill) => skill.contents.toLowerCase().includes(needle))
    .sort((left, right) => left.id.localeCompare(right.id));

  if (metadataMatches.length > 0) {
    for (const match of metadataMatches) {
      console.log(
        `${renderSkillSummary(match.skill)} [metadata: ${match.reasons.join(", ")}]`,
      );
    }
    return;
  }

  if (fallbackMatches.length === 0) {
    process.exit(1);
  }

  for (const skill of fallbackMatches) {
    console.log(
      `${renderSkillSummary(
        {
          id: skill.id,
          display_name: skill.displayName,
          description: skill.description,
          group: skill.group,
          tier: skill.tier,
          tags: skill.tags,
          triggers: skill.triggers,
          anti_triggers: skill.antiTriggers,
        },
      )} [content fallback]`,
    );
  }
}

function readSkills(names: string[]): void {
  const requestedNames = splitRequestedSkillNames(names);
  if (requestedNames.length === 0) {
    fail("`pnpm skills:read` requires at least one skill name.");
  }

  const registrySkills = getSkillRegistry().skills;
  const requestedIds = new Set(
    registrySkills
      .filter((skill) =>
        requestedNames.some((requestedName) => {
          const normalizedRequestedName = requestedName.trim().toLowerCase();
          return (
            skill.id.toLowerCase() === normalizedRequestedName ||
            skill.display_name.toLowerCase() === normalizedRequestedName
          );
        }),
      )
      .map((skill) => skill.id),
  );

  const allSkills = getAllSkillSources() as {
    id: string;
    relativeDir: string;
    contents: string;
  }[];

  for (const skillName of requestedNames) {
    const normalizedRequestedName = skillName.trim().toLowerCase();
    const resolvedSkillId = registrySkills.find(
      (skill) =>
        skill.id.toLowerCase() === normalizedRequestedName ||
        skill.display_name.toLowerCase() === normalizedRequestedName,
    )?.id;

    if (!resolvedSkillId || !requestedIds.has(resolvedSkillId)) {
      fail(`Unknown skill: ${skillName}`);
    }

    const skill = allSkills.find((item) => item.id === resolvedSkillId);
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

function rebuildRegistry(args: string[]): void {
  const checkMode = args.includes("--check");
  const registryPath = path.relative(repoRoot, getRegistryPath(repoRoot));

  try {
    if (checkMode) {
      if (!isRegistryCurrent(repoRoot)) {
        fail(
          `Skill registry is stale: ${registryPath}. Rebuild with \`pnpm skills:registry\`.`,
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

function routeTask(args: string[]): void {
  const jsonMode = args.includes("--json");
  const text = args
    .filter((arg) => arg !== "--json" && arg !== "--")
    .join(" ")
    .trim()
    .replace(/\s+--$/, "");

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
  console.log(`Secondary skills: ${result.secondarySkills.join(", ") || "(none)"}`);
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

export function main(args: string[] = process.argv.slice(2)): void {
  const [command, ...rest] = args;

  if (!command || command === "--help" || command === "-h") {
    usage();
    return;
  }

  switch (command) {
    case "list":
      listSkills(rest);
      return;
    case "search":
      searchSkills(rest.join(" "));
      return;
    case "read":
      readSkills(rest);
      return;
    case "route":
      routeTask(rest);
      return;
    case "registry":
      rebuildRegistry(rest);
      return;
    case "install":
      fail("`pnpm skills:install` is not supported in the root .skills architecture.");
    case "sync":
      fail(
        "`pnpm skills:sync` is not supported. Keep AGENTS.md thin and load skills on demand.",
      );
    default:
      fail(`Unknown skills command: ${command}`);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}

export { getAllSkillSources, getSkillRegistry, listSkills, readSkills, rebuildRegistry, routeTask };
