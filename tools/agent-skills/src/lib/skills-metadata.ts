const SUPPORTED_SKILL_METADATA_FIELDS: string[] = [
  "tags",
  "triggers",
  "anti_triggers",
  "group",
  "tier",
];

const ALLOWED_TOP_LEVEL_FRONTMATTER_FIELDS: string[] = [
  "name",
  "description",
];

const DEFAULT_GROUP = "support";
const DEFAULT_TIER = "normal";

const ALLOWED_GROUPS: string[] = [
  "workflow",
  "support",
  "specialist",
  "imported",
];

const ALLOWED_TIERS: string[] = [
  "daily",
  "normal",
  "quiet",
  "explicit",
];

export type SkillGroup = (typeof ALLOWED_GROUPS)[number];
export type SkillTier = (typeof ALLOWED_TIERS)[number];

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
  group: SkillGroup;
  tier: SkillTier;
}

export {
  ALLOWED_GROUPS,
  ALLOWED_TOP_LEVEL_FRONTMATTER_FIELDS,
  ALLOWED_TIERS,
  DEFAULT_GROUP,
  DEFAULT_TIER,
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
  const group =
    raw.group === undefined
      ? DEFAULT_GROUP
      : (parseEnumValue({
          inlineValue: String(raw.group),
          blockLines: [],
          filePath,
          field: "group",
          source,
          allowedValues: ALLOWED_GROUPS,
        }) as SkillGroup);

  const tier =
    raw.tier === undefined
      ? DEFAULT_TIER
      : (parseEnumValue({
          inlineValue: String(raw.tier),
          blockLines: [],
          filePath,
          field: "tier",
          source,
          allowedValues: ALLOWED_TIERS,
        }) as SkillTier);

  return {
    tags,
    triggers,
    anti_triggers: antiTriggers,
    group,
    tier,
  };
}
