const SUPPORTED_SKILL_METADATA_FIELDS = Object.freeze([
  "name",
  "description",
  "tags",
  "triggers",
  "anti_triggers",
  "routing_weight",
]);
const ALLOWED_TOP_LEVEL_FRONTMATTER_FIELDS = Object.freeze([
  ...SUPPORTED_SKILL_METADATA_FIELDS,
  "license",
  "metadata",
  "model",
]);

const DEFAULT_ROUTING_WEIGHT = 1;

export {
  ALLOWED_TOP_LEVEL_FRONTMATTER_FIELDS,
  DEFAULT_ROUTING_WEIGHT,
  SUPPORTED_SKILL_METADATA_FIELDS,
};

// This parser is intentionally narrow. It is not trying to be a general YAML
// implementation; it only supports the subset of frontmatter shapes we want to
// accept as the canonical machine-readable skill contract.
function countIndent(line) {
  const match = line.match(/^ */);
  return match ? match[0].length : 0;
}

function stripQuotes(value) {
  return value.replace(/^['"]|['"]$/g, "");
}

function dedentBlock(lines) {
  const nonEmptyLines = lines.filter((line) => line.trim() !== "");
  if (nonEmptyLines.length === 0) {
    return [];
  }

  const minIndent = Math.min(...nonEmptyLines.map(countIndent));
  return lines.map((line) => line.slice(Math.min(minIndent, line.length)));
}

function foldBlockScalar(lines) {
  const paragraphs = [];
  let currentParagraph = [];

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

// Inline arrays are part of the supported contract, but they must remain safe
// for natural trigger strings like "compare A, B options". Tokenize with quote
// awareness so commas inside quoted entries stay intact.
function parseInlineArray(value) {
  const inner = value.slice(1, -1).trim();
  if (!inner) {
    return [];
  }

  const entries = [];
  let current = "";
  let quote = null;
  let escaped = false;

  for (const character of inner) {
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }

    if (character === "\\") {
      escaped = true;
      current += character;
      continue;
    }

    if (quote) {
      current += character;
      if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      current += character;
      continue;
    }

    if (character === ",") {
      const entry = stripQuotes(current.trim());
      if (entry) {
        entries.push(entry);
      }
      current = "";
      continue;
    }

    current += character;
  }

  if (quote) {
    throw new Error("Inline array contains an unterminated quoted string.");
  }

  if (escaped) {
    throw new Error("Inline array ends with an incomplete escape sequence.");
  }

  const finalEntry = stripQuotes(current.trim());
  if (finalEntry) {
    entries.push(finalEntry);
  }

  return entries;
}

function parseArrayValue({ inlineValue, blockLines, filePath, field }) {
  if (!inlineValue) {
    const lines = dedentBlock(blockLines).filter((line) => line.trim() !== "");

    if (lines.length === 0) {
      return [];
    }

    const values = lines.map((line) => {
      const match = line.match(/^-\s+(.+)$/);
      if (!match) {
        throw new Error(
          `${filePath}: frontmatter field "${field}" must be a YAML list of strings.`,
        );
      }

      return stripQuotes(match[1].trim());
    });

    return [...new Set(values.filter(Boolean))];
  }

  if (inlineValue.startsWith("[")) {
    if (!inlineValue.endsWith("]")) {
      throw new Error(
        `${filePath}: frontmatter field "${field}" must use a closed inline array.`,
      );
    }

    try {
      return [...new Set(parseInlineArray(inlineValue))];
    } catch (error) {
      throw new Error(
        `${filePath}: frontmatter field "${field}" has invalid inline array syntax: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  return [...new Set([stripQuotes(inlineValue.trim())].filter(Boolean))];
}

// Descriptions in checked-in skills already use both plain scalars and folded
// blocks. Keep those forms working without opening the door to a much larger
// YAML surface area.
function parseScalarValue({ inlineValue, blockLines, filePath, field }) {
  if (inlineValue === ">" || inlineValue === "|") {
    const lines = dedentBlock(blockLines);
    return inlineValue === ">" ? foldBlockScalar(lines) : lines.join("\n").trim();
  }

  if (!inlineValue) {
    const lines = dedentBlock(blockLines);
    const value = foldBlockScalar(lines);
    if (!value) {
      throw new Error(
        `${filePath}: frontmatter field "${field}" must be a non-empty string.`,
      );
    }
    return value;
  }

  return stripQuotes(inlineValue.trim());
}

function parseRoutingWeight({ inlineValue, blockLines, filePath }) {
  const rawValue = inlineValue || foldBlockScalar(dedentBlock(blockLines));
  if (!rawValue) {
    return DEFAULT_ROUTING_WEIGHT;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) {
    throw new Error(
      `${filePath}: frontmatter field "routing_weight" must be a finite number.`,
    );
  }

  return parsed;
}

// The frontmatter collector is deliberately simple: read top-level fields and
// preserve their attached block lines. Validation happens later once we know
// which fields belong to the supported contract.
function collectFrontmatterEntries(rawFrontmatter) {
  const lines = rawFrontmatter.split(/\r?\n/);
  const entries = new Map();

  for (let index = 0; index < lines.length; ) {
    const line = lines[index];
    const match = line.match(/^([A-Za-z0-9_-]+):(.*)$/);

    if (!match) {
      index += 1;
      continue;
    }

    const [, key, rest] = match;
    const blockLines = [];
    index += 1;

    while (index < lines.length) {
      const nextLine = lines[index];

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

export function extractFrontmatterBlock(content) {
  if (!content.startsWith("---\n") && !content.startsWith("---\r\n")) {
    return null;
  }

  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return null;
  }

  return {
    rawFrontmatter: match[1],
    body: content.slice(match[0].length),
  };
}

export function parseSkillMetadata({ content, filePath }) {
  const frontmatter = extractFrontmatterBlock(content);

  if (!frontmatter) {
    throw new Error(
      `${filePath}: repo-owned skills must start with a frontmatter block.`,
    );
  }

  const entries = collectFrontmatterEntries(frontmatter.rawFrontmatter);
  // Reject unknown top-level keys instead of silently ignoring them. A typo in
  // the canonical metadata surface should fail loudly, not quietly degrade
  // routing or discovery.
  const unknownFields = [...entries.keys()].filter(
    (key) => !ALLOWED_TOP_LEVEL_FRONTMATTER_FIELDS.includes(key),
  );

  if (unknownFields.length > 0) {
    throw new Error(
      `${filePath}: unknown frontmatter field "${unknownFields[0]}". Supported skill metadata fields: ${SUPPORTED_SKILL_METADATA_FIELDS.join(
        ", ",
      )}. Allowed non-registry fields: license, metadata, model.`,
    );
  }

  const nameEntry = entries.get("name");
  const descriptionEntry = entries.get("description");

  if (!nameEntry) {
    throw new Error(`${filePath}: missing required frontmatter field "name".`);
  }

  if (!descriptionEntry) {
    throw new Error(
      `${filePath}: missing required frontmatter field "description".`,
    );
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
    throw new Error(
      `${filePath}: frontmatter field "description" must be non-empty.`,
    );
  }

  const tags = entries.has("tags")
    ? parseArrayValue({
        ...entries.get("tags"),
        filePath,
        field: "tags",
      })
    : [];
  const triggers = entries.has("triggers")
    ? parseArrayValue({
        ...entries.get("triggers"),
        filePath,
        field: "triggers",
      })
    : [];
  const antiTriggers = entries.has("anti_triggers")
    ? parseArrayValue({
        ...entries.get("anti_triggers"),
        filePath,
        field: "anti_triggers",
      })
    : [];
  const routingWeight = entries.has("routing_weight")
    ? parseRoutingWeight({
        ...entries.get("routing_weight"),
        filePath,
      })
    : DEFAULT_ROUTING_WEIGHT;

  return {
    name,
    description,
    tags,
    triggers,
    anti_triggers: antiTriggers,
    routing_weight: routingWeight,
  };
}
