import fs from "node:fs";
import path from "node:path";

import {
  ALLOWED_ACTIVATION_MODES,
  ALLOWED_CATALOG_GROUPS,
  MAX_AGENT_BENEFIT,
  MIN_AGENT_BENEFIT,
  parseCatalogMetadata,
  parseSkillMetadata,
} from "./skills-metadata.mjs";

const GENERATED_REGISTRY_FILENAME = "registry.generated.json";
const SKILL_METADATA_FILENAME = "registry.metadata.json";
const REGISTRY_VERSION = 1;
const SKILL_METADATA_VERSION = 1;

export { GENERATED_REGISTRY_FILENAME, REGISTRY_VERSION };

export function getSkillsRoot(repoRoot) {
  return path.join(repoRoot, ".skills");
}

export function getRegistryPath(repoRoot) {
  return path.join(getSkillsRoot(repoRoot), GENERATED_REGISTRY_FILENAME);
}

export function getSkillMetadataPath(repoRoot) {
  return path.join(getSkillsRoot(repoRoot), SKILL_METADATA_FILENAME);
}

function validateMetadataShape(metadata, metadataPath) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new Error(`${metadataPath}: registry metadata must be a JSON object.`);
  }

  if (metadata.version !== SKILL_METADATA_VERSION) {
    throw new Error(
      `${metadataPath}: unsupported registry metadata version ${String(
        metadata.version,
      )}. Expected ${SKILL_METADATA_VERSION}.`,
    );
  }

  if (!metadata.skills || typeof metadata.skills !== "object" || Array.isArray(metadata.skills)) {
    throw new Error(
      `${metadataPath}: registry metadata must contain a "skills" object.`,
    );
  }
}

function loadRegistryMetadata(repoRoot) {
  const metadataPath = getSkillMetadataPath(repoRoot);
  if (!fs.existsSync(metadataPath)) {
    throw new Error(
      `${path.relative(repoRoot, metadataPath)}: missing registry metadata file. Rebuild with \`node scripts/skills.mjs registry\` after adding metadata entries.`,
    );
  }

  let metadata;
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
  return metadata.skills;
}

function validateRegistryShape(registry, registryPath) {
  if (!registry || typeof registry !== "object") {
    throw new Error(
      `${registryPath}: registry file must contain a JSON object.`,
    );
  }

  if (registry.version !== REGISTRY_VERSION) {
    throw new Error(
      `${registryPath}: unsupported registry version ${String(
        registry.version,
      )}. Expected ${REGISTRY_VERSION}.`,
    );
  }

  if (!Array.isArray(registry.skills)) {
    throw new Error(
      `${registryPath}: registry file must contain a skills array.`,
    );
  }

  registry.skills.forEach((skill, index) => {
    validateRegistrySkillEntry(skill, registryPath, index);
  });
}

function validateStringArray(value, field, registryPath, skillIndex) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new Error(
      `${registryPath}: skill entry ${skillIndex} field "${field}" must be an array of strings.`,
    );
  }
}

// Validate the fields that downstream CLI code branches on so policy-aware
// ranking can trust a loaded generated registry, even before the artifact
// version changes again in the future.
function validateRegistrySkillEntry(skill, registryPath, skillIndex) {
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
    "catalog_group",
    "activation_mode",
  ];

  for (const field of requiredStringFields) {
    if (typeof skill[field] !== "string" || skill[field].trim() === "") {
      throw new Error(
        `${registryPath}: skill entry ${skillIndex} field "${field}" must be a non-empty string.`,
      );
    }
  }

  validateStringArray(skill.tags, "tags", registryPath, skillIndex);
  validateStringArray(skill.triggers, "triggers", registryPath, skillIndex);
  validateStringArray(
    skill.anti_triggers,
    "anti_triggers",
    registryPath,
    skillIndex,
  );

  if (typeof skill.routing_weight !== "number" || !Number.isFinite(skill.routing_weight)) {
    throw new Error(
      `${registryPath}: skill entry ${skillIndex} field "routing_weight" must be a finite number.`,
    );
  }

  if (typeof skill.daily_driver !== "boolean") {
    throw new Error(
      `${registryPath}: skill entry ${skillIndex} field "daily_driver" must be a boolean.`,
    );
  }

  if (
    !Number.isInteger(skill.agent_benefit) ||
    skill.agent_benefit < MIN_AGENT_BENEFIT ||
    skill.agent_benefit > MAX_AGENT_BENEFIT
  ) {
    throw new Error(
      `${registryPath}: skill entry ${skillIndex} field "agent_benefit" must be an integer from ${MIN_AGENT_BENEFIT} to ${MAX_AGENT_BENEFIT}.`,
    );
  }

  if (!ALLOWED_CATALOG_GROUPS.includes(skill.catalog_group)) {
    throw new Error(
      `${registryPath}: skill entry ${skillIndex} field "catalog_group" must be one of ${ALLOWED_CATALOG_GROUPS.join(
        ", ",
      )}.`,
    );
  }

  if (!ALLOWED_ACTIVATION_MODES.includes(skill.activation_mode)) {
    throw new Error(
      `${registryPath}: skill entry ${skillIndex} field "activation_mode" must be one of ${ALLOWED_ACTIVATION_MODES.join(
        ", ",
      )}.`,
    );
  }
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

export function loadSkillSources(repoRoot) {
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
      entry: rawCatalogMetadata,
    });

    return {
      id: skillId,
      displayName: metadata.name,
      description: metadata.description,
      tags: catalogMetadata.tags,
      triggers: catalogMetadata.triggers,
      antiTriggers: catalogMetadata.anti_triggers,
      routingWeight: catalogMetadata.routing_weight,
      dailyDriver: catalogMetadata.daily_driver,
      agentBenefit: catalogMetadata.agent_benefit,
      catalogGroup: catalogMetadata.catalog_group,
      activationMode: catalogMetadata.activation_mode,
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
// reliably. Routing metadata and catalog-policy metadata both belong here:
// routing helps decide whether a skill is relevant, while catalog policy helps
// later tooling decide how prominent that relevant skill should be.
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
    daily_driver: skill.dailyDriver,
    agent_benefit: skill.agentBenefit,
    catalog_group: skill.catalogGroup,
    activation_mode: skill.activationMode,
  }));

  return {
    version: REGISTRY_VERSION,
    skills,
  };
}

export function serializeSkillRegistry(registry) {
  return `${JSON.stringify(registry, null, 2)}\n`;
}

export function loadGeneratedSkillRegistry(repoRoot) {
  const registryPath = getRegistryPath(repoRoot);
  if (!fs.existsSync(registryPath)) {
    throw new Error(
      `Missing generated skill registry: ${path.relative(
        repoRoot,
        registryPath,
      )}. Rebuild with \`node scripts/skills.mjs registry\`.`,
    );
  }

  let registry;
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
  return registry;
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
  return (
    currentContents === serializeSkillRegistry(buildSkillRegistry(repoRoot))
  );
}
