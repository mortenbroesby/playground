import fs from "node:fs";
import path from "node:path";

import { parseSkillMetadata } from "./skills-metadata.mjs";

const GENERATED_REGISTRY_FILENAME = "registry.generated.json";
const REGISTRY_VERSION = 1;

export { GENERATED_REGISTRY_FILENAME, REGISTRY_VERSION };

export function getSkillsRoot(repoRoot) {
  return path.join(repoRoot, ".skills");
}

export function getRegistryPath(repoRoot) {
  return path.join(getSkillsRoot(repoRoot), GENERATED_REGISTRY_FILENAME);
}

export function ensureSkillsRoot(repoRoot) {
  const skillsRoot = getSkillsRoot(repoRoot);
  if (!fs.existsSync(skillsRoot)) {
    throw new Error("Missing .skills directory.");
  }
  return skillsRoot;
}

// The generated registry assumes one checked-in skill per direct child
// directory: `.skills/<skill-id>/SKILL.md`. Enforcing that layout keeps ids
// unambiguous and prevents the registry from inheriting accidental nested
// structure.
function collectSkillDirectories(skillsRoot) {
  const entries = fs.readdirSync(skillsRoot, { withFileTypes: true });
  const skillDirectories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(skillsRoot, entry.name))
    .filter((directoryPath) =>
      fs.existsSync(path.join(directoryPath, "SKILL.md")),
    )
    .sort((left, right) => left.localeCompare(right));

  for (const directoryPath of skillDirectories) {
    const nestedEntries = fs.readdirSync(directoryPath, { withFileTypes: true });
    for (const entry of nestedEntries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const nestedSkillPath = path.join(directoryPath, entry.name, "SKILL.md");
      if (fs.existsSync(nestedSkillPath)) {
        throw new Error(
          `Nested skill path is not supported: ${path.relative(
            skillsRoot,
            nestedSkillPath,
          )}. Repo-owned skills must live at .skills/<skill-id>/SKILL.md.`,
        );
      }
    }
  }

  return skillDirectories;
}

export function loadSkillSources(repoRoot) {
  const skillsRoot = ensureSkillsRoot(repoRoot);

  return collectSkillDirectories(skillsRoot).map((directoryPath) => {
    const skillPath = path.join(directoryPath, "SKILL.md");
    const relativeDir = path.relative(repoRoot, directoryPath);
    const relativeSkillPath = path.relative(repoRoot, skillPath);
    const contents = fs.readFileSync(skillPath, "utf8");
    const metadata = parseSkillMetadata({
      content: contents,
      filePath: relativeSkillPath,
    });

    return {
      id: path.basename(directoryPath),
      displayName: metadata.name,
      description: metadata.description,
      tags: metadata.tags,
      triggers: metadata.triggers,
      antiTriggers: metadata.anti_triggers,
      routingWeight: metadata.routing_weight,
      dir: directoryPath,
      relativeDir,
      skillPath,
      relativeSkillPath,
      contents,
    };
  });
}

// The registry is the machine-readable discovery surface. Keep the emitted
// shape deterministic and boring so both humans and scripts can diff it
// reliably.
export function buildSkillRegistry(repoRoot) {
  const skills = loadSkillSources(repoRoot).map((skill) => ({
    id: skill.id,
    display_name: skill.displayName,
    description: skill.description,
    source_dir: skill.relativeDir,
    source_skill_md_path: skill.relativeSkillPath,
    tags: skill.tags,
    triggers: skill.triggers,
    anti_triggers: skill.antiTriggers,
    routing_weight: skill.routingWeight,
  }));

  return {
    version: REGISTRY_VERSION,
    skills,
  };
}

export function serializeSkillRegistry(registry) {
  return `${JSON.stringify(registry, null, 2)}\n`;
}

export function writeSkillRegistry(repoRoot) {
  const registry = buildSkillRegistry(repoRoot);
  fs.writeFileSync(getRegistryPath(repoRoot), serializeSkillRegistry(registry));
  return registry;
}

// "Current" means byte-for-byte equal to a fresh rebuild. That is stricter than
// semantic equality on purpose because the generated file is intended to be a
// checked-in artifact with stable formatting.
export function isRegistryCurrent(repoRoot) {
  const registryPath = getRegistryPath(repoRoot);
  if (!fs.existsSync(registryPath)) {
    return false;
  }

  const currentContents = fs.readFileSync(registryPath, "utf8");
  return currentContents === serializeSkillRegistry(buildSkillRegistry(repoRoot));
}
