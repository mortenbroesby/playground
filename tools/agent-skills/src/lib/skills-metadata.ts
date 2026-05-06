const SUPPORTED_SKILL_METADATA_FIELDS: string[] = [
  "tags",
  "triggers",
  "anti_triggers",
  "routing_weight",
  "daily_driver",
  "agent_benefit",
  "catalog_group",
  "activation_mode",
];

const ALLOWED_TOP_LEVEL_FRONTMATTER_FIELDS: string[] = [
  "name",
  "description",
];

const DEFAULT_ROUTING_WEIGHT = 1;
const DEFAULT_DAILY_DRIVER = false;
const MIN_AGENT_BENEFIT = 1;
const DEFAULT_AGENT_BENEFIT = 3;
const MAX_AGENT_BENEFIT = 5;
const DEFAULT_CATALOG_GROUP = "support";
const DEFAULT_ACTIVATION_MODE = "default";

const ALLOWED_CATALOG_GROUPS: string[] = [
  "workflow",
  "support",
  "specialist",
  "imported",
];

const ALLOWED_ACTIVATION_MODES: string[] = [
  "default",
  "high-priority-when-relevant",
  "quiet-until-strong-match",
  "explicit-only",
];

export type CatalogMetadataEntry = {
  [key: string]: unknown;
};

export type FrontmatterValue = string | undefined;

export type FrontmatterEntries = Map<string, { inlineValue: FrontmatterValue; blockLines: string[] }>;

export interface SkillFrontmatter {
  name: string;
  description: string;
}

export interface ParsedCatalogMetadata {
  tags: string[];
  triggers: string[];
  anti_triggers: string[];
  routing_weight: number;
  daily_driver: boolean;
  agent_benefit: number;
  catalog_group: string;
  activation_mode: string;
}

export {
  ALLOWED_CATALOG_GROUPS,
  ALLOWED_TOP_LEVEL_FRONTMATTER_FIELDS,
  ALLOWED_ACTIVATION_MODES,
  DEFAULT_ACTIVATION_MODE,
  DEFAULT_AGENT_BENEFIT,
  DEFAULT_CATALOG_GROUP,
  DEFAULT_DAILY_DRIVER,
  DEFAULT_ROUTING_WEIGHT,
  MAX_AGENT_BENEFIT,
  MIN_AGENT_BENEFIT,
  SUPPORTED_SKILL_METADATA_FIELDS,
};

// Frontmatter parsing is intentionally narrow. It is not a general YAML parser;
// it accepts only the minimal shape we need for skill identity.
function countIndent(line: string): number {
  const match = line.match(/^ */);
  return match ? match[0].length : 0;
}

function stripQuotes(value: string): string {
  return value.replace(/^["']|["']$/g, "");
}

function dedentBlock(lines: string[]): string[] {
  const nonEmptyLines = lines.filter((line) => line.trim() !== "");
  if (nonEmptyLines.length === 0) {
    return [];
  }

  const minIndent = Math.min(...nonEmptyLines.map(countIndent));
  return lines.map((line) => line.slice(Math.min(minIndent, line.length)));
}

function foldBlockScalar(lines: string[]): string {
  const paragraphs: string[] = [];
  let currentParagraph: string[] = [];

  for (const line of lines) {
    if (line.trim() === "") {
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(" ").trim());
        currentParagraph = [];
      }
      continue;
    }

    currentParagraph.push(line.trim());
  }

  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join(" ").trim());
  }

  return paragraphs.join("\n\n").trim();
}

function getFirstMeaningfulBlockLine(blockLines: string[]): string | null {
  return blockLines.find((line) => line.trim() !== "") ?? null;
}

function assertNoUnexpectedBlockLines({
  inlineValue,
  blockLines,
  filePath,
  field,
  source = "frontmatter",
}: {
  inlineValue: FrontmatterValue;
  blockLines: string[];
  filePath: string;
  field: string;
  source?: string;
}): void {
  if (!inlineValue) {
    return;
  }

  const unexpectedLine = getFirstMeaningfulBlockLine(blockLines);
  if (!unexpectedLine) {
    return;
  }

  throw new Error(
    `${filePath}: ${source} field "${field}" has an unexpected indented continuation line "${unexpectedLine}". Inline values cannot include additional indented lines.`,
  );
}

// Descriptions in checked-in skills use plain scalars and block scalars.
function parseScalarValue({
  inlineValue,
  blockLines,
  filePath,
  field,
  source = "frontmatter",
}: {
  inlineValue: FrontmatterValue;
  blockLines: string[];
  filePath: string;
  field: string;
  source?: string;
}): string {
  if (inlineValue === ">" || inlineValue === "|") {
    const lines = dedentBlock(blockLines);
    return inlineValue === ">" ? foldBlockScalar(lines) : lines.join("\n").trim();
  }

  assertNoUnexpectedBlockLines({
    inlineValue,
    blockLines,
    filePath,
    field,
    source,
  });

  if (!inlineValue) {
    const lines = dedentBlock(blockLines);
    const value = foldBlockScalar(lines);
    if (!value) {
      throw new Error(
        `${filePath}: ${source} field "${field}" must be a non-empty string.`,
      );
    }
    return value;
  }

  return stripQuotes(inlineValue.trim());
}

function parseBooleanValue({
  inlineValue,
  blockLines,
  filePath,
  field,
  source = "frontmatter",
}: {
  inlineValue: FrontmatterValue;
  blockLines: string[];
  filePath: string;
  field: string;
  source?: string;
}): boolean {
  assertNoUnexpectedBlockLines({
    inlineValue,
    blockLines,
    filePath,
    field,
    source,
  });

  const rawValue = String(inlineValue || "").trim();
  if (!rawValue) {
    throw new Error(
      `${filePath}: ${source} field "${field}" must be true or false.`,
    );
  }

  if (rawValue === "true") {
    return true;
  }
  if (rawValue === "false") {
    return false;
  }

  throw new Error(
    `${filePath}: ${source} field "${field}" must be true or false.`,
  );
}

// Catalog benefit is intentionally narrow and bounded.
function parseIntegerInRange({
  inlineValue,
  blockLines,
  filePath,
  field,
  min,
  max,
  source = "frontmatter",
}: {
  inlineValue: FrontmatterValue;
  blockLines: string[];
  filePath: string;
  field: string;
  min: number;
  max: number;
  source?: string;
}): number {
  assertNoUnexpectedBlockLines({
    inlineValue,
    blockLines,
    filePath,
    field,
    source,
  });

  const rawValue = String(inlineValue || "").trim();
  if (!rawValue) {
    throw new Error(
      `${filePath}: ${source} field "${field}" must be an integer from ${min} to ${max}.`,
    );
  }

  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(
      `${filePath}: ${source} field "${field}" must be an integer from ${min} to ${max}.`,
    );
  }

  return parsed;
}

function parseEnumValue({
  inlineValue,
  blockLines,
  filePath,
  field,
  allowedValues,
  source = "frontmatter",
}: {
  inlineValue: FrontmatterValue;
  blockLines: string[];
  filePath: string;
  field: string;
  allowedValues: readonly string[];
  source?: string;
}): string {
  assertNoUnexpectedBlockLines({
    inlineValue,
    blockLines,
    filePath,
    field,
    source,
  });

  const rawValue = String(inlineValue || "").trim();
  if (!rawValue) {
    throw new Error(
      `${filePath}: ${source} field "${field}" must be one of ${allowedValues.join(
        ", ",
      )}.`,
    );
  }

  const value = stripQuotes(rawValue);
  if (!allowedValues.includes(value)) {
    throw new Error(
      `${filePath}: ${source} field "${field}" must be one of ${allowedValues.join(
        ", ",
      )}.`,
    );
  }

  return value;
}

// The frontmatter collector is deliberately simple: read top-level fields and
// preserve their attached block lines. Validation happens later.
function collectFrontmatterEntries(rawFrontmatter: string): FrontmatterEntries {
  const lines = rawFrontmatter.split(/\r?\n/);
  const entries = new Map<string, { inlineValue: FrontmatterValue; blockLines: string[] }>();

  for (let index = 0; index < lines.length; ) {
    const line = lines[index] ?? "";
    const match = line.match(/^([A-Za-z0-9_-]+):(.*)$/);

    if (!match) {
      // A non-empty line at column zero is malformed top-level frontmatter.
      if (line.trim() !== "" && countIndent(line) === 0) {
        throw new Error(
          `Malformed frontmatter line ${index + 1}: expected "<key>: <value>" but found "${line}".`,
        );
      }
      index += 1;
      continue;
    }

    const [, key = "", rest = ""] = match;
    const blockLines: string[] = [];
    index += 1;

    while (index < lines.length) {
      const nextLine = lines[index] ?? "";

      if (nextLine.trim() === "") {
        blockLines.push(nextLine);
        index += 1;
        continue;
      }

      if (/^[A-Za-z0-9_-]+:(.*)$/.test(nextLine)) {
        break;
      }

      blockLines.push(nextLine);
      index += 1;
    }

    if (entries.has(key)) {
      throw new Error(`Duplicate frontmatter field "${key}".`);
    }

    entries.set(key, {
      inlineValue: rest.trim(),
      blockLines,
    });
  }

  return entries;
}

export interface FrontmatterBlock {
  rawFrontmatter: string;
  body: string;
}

export function extractFrontmatterBlock(content: string): FrontmatterBlock | null {
  if (!content.startsWith("---\n") && !content.startsWith("---\r\n")) {
    return null;
  }

  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return null;
  }

  return {
    rawFrontmatter: match[1] ?? "",
    body: content.slice((match[0] ?? "").length),
  };
}

export function parseSkillMetadata({ content, filePath }: { content: string; filePath: string }): SkillFrontmatter {
  const frontmatter = extractFrontmatterBlock(content);

  if (!frontmatter) {
    throw new Error(`${filePath}: repo-owned skills must start with a frontmatter block.`);
  }

  const entries = collectFrontmatterEntries(frontmatter.rawFrontmatter);
  const unknownFields = [...entries.keys()].filter(
    (key) => !ALLOWED_TOP_LEVEL_FRONTMATTER_FIELDS.includes(key),
  );

  if (unknownFields.length > 0) {
    throw new Error(
      `${filePath}: unknown frontmatter field "${unknownFields[0]}". Supported frontmatter fields: name, description.`,
    );
  }

  const nameEntry = entries.get("name");
  const descriptionEntry = entries.get("description");
  if (!nameEntry) {
    throw new Error(`${filePath}: missing required frontmatter field "name".`);
  }

  if (!descriptionEntry) {
    throw new Error(`${filePath}: missing required frontmatter field "description".`);
  }

  const name = parseScalarValue({
    ...nameEntry,
    filePath,
    field: "name",
  }).trim();
  const description = parseScalarValue({
    ...descriptionEntry,
    filePath,
    field: "description",
  }).trim();

  if (!name) {
    throw new Error(`${filePath}: frontmatter field "name" must be non-empty.`);
  }

  if (!description) {
    throw new Error(`${filePath}: frontmatter field "description" must be non-empty.`);
  }

  return { name, description };
}

function parseStringArrayValue(value: unknown, filePath: string, field: string): string[] {
  if (value === undefined) {
    return [];
  }

  if (
    !Array.isArray(value) ||
    !value.every((entry) => typeof entry === "string")
  ) {
    throw new Error(`${filePath}: metadata field "${field}" must be an array of strings.`);
  }

  return [...new Set(value.filter((entry) => entry.trim() !== ""))];
}

function parseRoutingWeightValue(filePath: string, rawValue: unknown): number {
  if (rawValue === undefined) {
    return DEFAULT_ROUTING_WEIGHT;
  }

  if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
    throw new Error(
      `${filePath}: metadata field "routing_weight" must be a finite number.`,
    );
  }

  return rawValue;
}

export function parseCatalogMetadata({
  filePath,
  skillId,
  entry,
}: {
  filePath: string;
  skillId: string;
  entry: CatalogMetadataEntry;
}): ParsedCatalogMetadata {
  const source = `metadata for "${skillId}"`;
  const raw = entry ?? {};

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(`${filePath}: ${source} must be an object.`);
  }

  const unknownFields = Object.keys(raw).filter(
    (field) => !SUPPORTED_SKILL_METADATA_FIELDS.includes(field),
  );
  if (unknownFields.length > 0) {
    throw new Error(
      `${filePath}: ${source} has unknown field "${unknownFields[0]}". Supported fields: ${SUPPORTED_SKILL_METADATA_FIELDS.join(
        ", ",
      )}.`,
    );
  }

  const tags = parseStringArrayValue(raw.tags, filePath, "tags");
  const triggers = parseStringArrayValue(raw.triggers, filePath, "triggers");
  const antiTriggers = parseStringArrayValue(
    raw.anti_triggers,
    filePath,
    "anti_triggers",
  );
  const routingWeight = parseRoutingWeightValue(filePath, raw.routing_weight);

  const daily_driver =
    raw.daily_driver === undefined
      ? DEFAULT_DAILY_DRIVER
      : parseBooleanValue({
          inlineValue: String(raw.daily_driver),
          blockLines: [],
          filePath,
          field: "daily_driver",
          source,
        });

  const agentBenefit =
    raw.agent_benefit === undefined
      ? DEFAULT_AGENT_BENEFIT
      : parseIntegerInRange({
          inlineValue: String(raw.agent_benefit),
          blockLines: [],
          filePath,
          field: "agent_benefit",
          source,
          min: MIN_AGENT_BENEFIT,
          max: MAX_AGENT_BENEFIT,
        });

  const catalogGroup =
    raw.catalog_group === undefined
      ? DEFAULT_CATALOG_GROUP
      : (parseEnumValue({
          inlineValue: String(raw.catalog_group),
          blockLines: [],
          filePath,
          field: "catalog_group",
          source,
          allowedValues: ALLOWED_CATALOG_GROUPS,
        }) as (typeof ALLOWED_CATALOG_GROUPS)[number]);

  const activationMode =
    raw.activation_mode === undefined
      ? DEFAULT_ACTIVATION_MODE
      : (parseEnumValue({
          inlineValue: String(raw.activation_mode),
          blockLines: [],
          filePath,
          field: "activation_mode",
          source,
          allowedValues: ALLOWED_ACTIVATION_MODES,
        }) as (typeof ALLOWED_ACTIVATION_MODES)[number]);

  return {
    tags,
    triggers,
    anti_triggers: antiTriggers,
    routing_weight: routingWeight,
    daily_driver,
    agent_benefit: agentBenefit,
    catalog_group: catalogGroup,
    activation_mode: activationMode,
  };
}
