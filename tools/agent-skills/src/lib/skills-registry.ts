import fs from "node:fs";
import path from "node:path";

import {
  ALLOWED_GROUPS,
  ALLOWED_TIERS,
  parseCatalogMetadata,
  parseSkillMetadata,
} from "./skills-metadata.ts";
import type { RegistrySkill } from "./skills-routing.ts";

export const GENERATED_REGISTRY_FILENAME = "registry.generated.json";
const SKILL_METADATA_FILENAME = "registry.metadata.json";
const METADATA_DIRNAME = ".metadata";
const REGISTRY_VERSION = 1;
const SKILL_METADATA_VERSION = 1;

export type SkillGroup = RegistrySkill["group"];
export type SkillTier = RegistrySkill["tier"];

export interface GeneratedSkillRegistryEntry {
  id: string;
  display_name: string;
  description: string;
  source_dir: string;
  source_skill_md_path: string;
  tags: string[];
  triggers: string[];
  anti_triggers: string[];
  group: SkillGroup;
  tier: SkillTier;
}

export interface GeneratedSkillRegistry {
  version: number;
  skills: GeneratedSkillRegistryEntry[];
}

export interface SkillSource {
  id: string;
  displayName: string;
  description: string;
  tags: string[];
  triggers: string[];
  antiTriggers: string[];
  group: SkillGroup;
  tier: SkillTier;
  dir: string;
  relativeDir: string;
  skillPath: string;
  relativeSkillPath: string;
  contents: string;
}

export { REGISTRY_VERSION };

export function getSkillsRoot(repoRoot: string): string {
  return path.join(repoRoot, ".skills");
}

function getMetadataRoot(repoRoot: string): string {
  return path.join(getSkillsRoot(repoRoot), METADATA_DIRNAME);
}

export function getRegistryPath(repoRoot: string): string {
  return path.join(getMetadataRoot(repoRoot), GENERATED_REGISTRY_FILENAME);
}

export function getSkillMetadataPath(repoRoot: string): string {
  return path.join(getMetadataRoot(repoRoot), SKILL_METADATA_FILENAME);
}

function validateMetadataShape(metadata: unknown, metadataPath: string): void {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new Error(`${metadataPath}: registry metadata must be a JSON object.`);
  }

  const objectMetadata = metadata as Record<string, unknown>;
  if (objectMetadata.version !== SKILL_METADATA_VERSION) {
    throw new Error(
      `${metadataPath}: unsupported registry metadata version ${String(
        objectMetadata.version,
      )}. Expected ${SKILL_METADATA_VERSION}.`,
    );
  }

  if (
    !objectMetadata.skills ||
    typeof objectMetadata.skills !== "object" ||
    Array.isArray(objectMetadata.skills)
  ) {
    throw new Error(
      `${metadataPath}: registry metadata must contain a "skills" object.`,
    );
  }
}

export function loadRegistryMetadata(repoRoot: string): Record<string, unknown> {
  const metadataPath = getSkillMetadataPath(repoRoot);
  if (!fs.existsSync(metadataPath)) {
    throw new Error(
      `${path.relative(repoRoot, metadataPath)}: missing registry metadata file. Rebuild with \`pnpm skills:registry\` after adding metadata entries.`,
    );
  }

  let metadata: unknown;
  try {
    metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  } catch (error) {
    throw new Error(
      `${path.relative(
        repoRoot,
        metadataPath,
      )}: invalid JSON in registry metadata: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const relativePath = path.relative(repoRoot, metadataPath);
  validateMetadataShape(metadata, relativePath);
  return (metadata as Record<string, unknown>).skills as Record<string, unknown>;
}

function validateStringArray(
  value: unknown,
  field: string,
  registryPath: string,
  skillIndex: number,
): void {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new Error(
      `${registryPath}: skill entry ${skillIndex} field "${field}" must be an array of strings.`,
    );
  }
}

// Validate the fields that downstream CLI code branches on so policy-aware
// ranking can trust a loaded generated registry, even before the artifact
// version changes again in the future.
function validateRegistrySkillEntry(
  skill: Record<string, unknown>,
  registryPath: string,
  skillIndex: number,
): void {
  if (!skill || typeof skill !== "object" || Array.isArray(skill)) {
    throw new Error(
      `${registryPath}: skill entry ${skillIndex} must be a JSON object.`,
    );
  }

  const requiredStringFields = [
    "id",
    "display_name",
    "description",
    "source_dir",
    "source_skill_md_path",
    "group",
    "tier",
  ];
  for (const field of requiredStringFields) {
    const value = skill[field];
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(
        `${registryPath}: skill entry ${skillIndex} field "${field}" must be a non-empty string.`,
      );
    }
  }

  validateStringArray(skill.tags, "tags", registryPath, skillIndex);
  validateStringArray(skill.triggers, "triggers", registryPath, skillIndex);
  validateStringArray(skill.anti_triggers, "anti_triggers", registryPath, skillIndex);

  if (!ALLOWED_GROUPS.includes(skill.group as SkillGroup)) {
    throw new Error(
      `${registryPath}: skill entry ${skillIndex} field "group" must be one of ${ALLOWED_GROUPS.join(
        ", ",
      )}.`,
    );
  }

  if (!ALLOWED_TIERS.includes(skill.tier as SkillTier)) {
    throw new Error(
      `${registryPath}: skill entry ${skillIndex} field "tier" must be one of ${ALLOWED_TIERS.join(
        ", ",
      )}.`,
    );
  }
}

export function ensureSkillsRoot(repoRoot: string): string {
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
function collectSkillDirectories(skillsRoot: string): string[] {
  const entries = fs.readdirSync(skillsRoot, { withFileTypes: true });
  const skillDirectories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(skillsRoot, entry.name))
    .filter((directoryPath) =>
      fs.existsSync(path.join(directoryPath, "SKILL.md")),
    )
    .sort((left, right) => left.localeCompare(right));

  for (const directoryPath of skillDirectories) {
    const nestedEntries = fs.readdirSync(directoryPath, {
      withFileTypes: true,
    });
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

export function loadSkillSources(repoRoot: string): SkillSource[] {
  const skillsRoot = ensureSkillsRoot(repoRoot);
  const metadataEntries = loadRegistryMetadata(repoRoot);

  return collectSkillDirectories(skillsRoot).map((directoryPath) => {
    const skillPath = path.join(directoryPath, "SKILL.md");
    const relativeDir = path.relative(repoRoot, directoryPath);
    const relativeSkillPath = path.relative(repoRoot, skillPath);
    const contents = fs.readFileSync(skillPath, "utf8");
    const metadata = parseSkillMetadata({
      content: contents,
      filePath: relativeSkillPath,
    });
    const metadataFilePath = path.relative(repoRoot, getSkillMetadataPath(repoRoot));
    const skillId = path.basename(directoryPath);
    const rawCatalogMetadata = metadataEntries[skillId];

    if (!rawCatalogMetadata) {
      throw new Error(
        `${metadataFilePath}: missing catalog metadata entry for skill "${skillId}". Add ".skills/${skillId}" metadata in ${path.basename(
          metadataFilePath,
        )} before loading this skill.`,
      );
    }

    const catalogMetadata = parseCatalogMetadata({
      filePath: metadataFilePath,
      skillId,
      entry: rawCatalogMetadata as Record<string, unknown>,
    });

    return {
      id: skillId,
      displayName: metadata.name,
      description: metadata.description,
      tags: catalogMetadata.tags,
      triggers: catalogMetadata.triggers,
      antiTriggers: catalogMetadata.anti_triggers,
      group: catalogMetadata.group as SkillGroup,
      tier: catalogMetadata.tier as SkillTier,
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
// reliably. Keep the policy surface intentionally small so the catalog remains
// understandable to both humans and scripts.
export function buildSkillRegistry(repoRoot: string): GeneratedSkillRegistry {
  const skills = loadSkillSources(repoRoot).map((skill): GeneratedSkillRegistryEntry => ({
    id: skill.id,
    display_name: skill.displayName,
    description: skill.description,
    source_dir: skill.relativeDir,
    source_skill_md_path: skill.relativeSkillPath,
    tags: skill.tags,
    triggers: skill.triggers,
    anti_triggers: skill.antiTriggers,
    group: skill.group,
    tier: skill.tier,
  }));

  return {
    version: REGISTRY_VERSION,
    skills,
  };
}

export function serializeSkillRegistry(registry: GeneratedSkillRegistry): string {
  return `${JSON.stringify(registry, null, 2)}\n`;
}

export function loadGeneratedSkillRegistry(repoRoot: string): GeneratedSkillRegistry {
  const registryPath = getRegistryPath(repoRoot);
  if (!fs.existsSync(registryPath)) {
    throw new Error(
      `Missing generated skill registry: ${path.relative(
        repoRoot,
        registryPath,
      )}. Rebuild with \`pnpm skills:registry\`.`,
    );
  }

  let registry: unknown;
  try {
    registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  } catch (error) {
    throw new Error(
      `${path.relative(repoRoot, registryPath)}: invalid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  const relativeRegistryPath = path.relative(repoRoot, registryPath);
  validateRegistryShape(registry, relativeRegistryPath);
  return registry as GeneratedSkillRegistry;
}

function validateRegistryShape(registry: unknown, registryPath: string): void {
  if (!registry || typeof registry !== "object") {
    throw new Error(`${registryPath}: registry file must contain a JSON object.`);
  }

  const typed = registry as Record<string, unknown>;
  if (typed.version !== REGISTRY_VERSION) {
    throw new Error(
      `${registryPath}: unsupported registry version ${String(
        typed.version,
      )}. Expected ${REGISTRY_VERSION}.`,
    );
  }

  if (!Array.isArray(typed.skills)) {
    throw new Error(`${registryPath}: registry file must contain a skills array.`);
  }

  typed.skills.forEach((skill, index) => {
    validateRegistrySkillEntry(
      skill as Record<string, unknown>,
      registryPath,
      index,
    );
  });
}

export function writeSkillRegistry(repoRoot: string): GeneratedSkillRegistry {
  const registry = buildSkillRegistry(repoRoot);
  fs.writeFileSync(getRegistryPath(repoRoot), serializeSkillRegistry(registry));
  return registry;
}

// "Current" means byte-for-byte equal to a fresh rebuild. That is stricter than
// semantic equality on purpose because the generated file is intended to be a
// checked-in artifact with stable formatting.
export function isRegistryCurrent(repoRoot: string): boolean {
  const registryPath = getRegistryPath(repoRoot);
  if (!fs.existsSync(registryPath)) {
    return false;
  }

  const currentContents = fs.readFileSync(registryPath, "utf8");
  return currentContents === serializeSkillRegistry(buildSkillRegistry(repoRoot));
}
