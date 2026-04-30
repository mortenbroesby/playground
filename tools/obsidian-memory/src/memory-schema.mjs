import YAML from "yaml";

const MEMORY_TYPES = new Set([
  "repo-home",
  "architecture-record",
  "spec",
  "session",
  "todo",
  "investigation",
  "reference",
  "glossary",
]);

const MEMORY_OWNERS = new Set(["morten", "agent", "human"]);

const ALLOWED_STATUSES_BY_TYPE = {
  "repo-home": new Set(["active"]),
  "architecture-record": new Set([
    "proposed",
    "accepted",
    "archived",
    "superseded",
  ]),
  spec: new Set(["proposed", "active", "done", "archived", "superseded"]),
  session: new Set(["active", "done", "archived"]),
  todo: new Set(["active", "done", "archived"]),
  investigation: new Set(["proposed", "active", "archived"]),
  reference: new Set(["active", "archived", "superseded"]),
  glossary: new Set(["active", "archived"]),
};

const LINK_KEYS = [
  "parents",
  "children",
  "related",
  "supersedes",
  "superseded_by",
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function buildError({ code, message, path = undefined, noteId = undefined, hint = undefined }) {
  return {
    code,
    message,
    path,
    noteId,
    hint,
  };
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalized = [];
  const seen = new Set();

  for (const entry of value) {
    if (typeof entry !== "string") {
      return null;
    }

    const trimmed = entry.trim();

    if (!trimmed || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
}

function validateDate(value, field, errors) {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
    errors.push(
      buildError({
        code: "frontmatter.invalid_date",
        message: `Field '${field}' must use YYYY-MM-DD format.`,
      }),
    );
    return null;
  }

  return value;
}

function validateOptionalDate(value, field, errors) {
  if (value === null) {
    return null;
  }

  return validateDate(value, field, errors);
}

function validateLinks(value, errors) {
  if (!isPlainObject(value)) {
    errors.push(
      buildError({
        code: "frontmatter.invalid_links",
        message: "Field 'links' must be an object with note-id arrays.",
      }),
    );
    return null;
  }

  const normalized = {};

  for (const key of LINK_KEYS) {
    const entries = normalizeStringArray(value[key]);

    if (entries === null) {
      errors.push(
        buildError({
          code: "frontmatter.invalid_links",
          message: `Field 'links.${key}' must be an array of strings.`,
        }),
      );
      continue;
    }

    normalized[key] = entries;
  }

  return errors.some((error) => error.code === "frontmatter.invalid_links")
    ? null
    : normalized;
}

function validateRetention(value, errors) {
  if (!isPlainObject(value)) {
    errors.push(
      buildError({
        code: "frontmatter.invalid_retention",
        message: "Field 'retention' must be an object.",
      }),
    );
    return null;
  }

  const keep = value.keep;

  if (typeof keep !== "boolean") {
    errors.push(
      buildError({
        code: "frontmatter.invalid_retention",
        message: "Field 'retention.keep' must be a boolean.",
      }),
    );
  }

  return errors.some((error) => error.code === "frontmatter.invalid_retention")
    ? null
    : {
        review_after: validateOptionalDate(
          value.review_after ?? null,
          "retention.review_after",
          errors,
        ),
        expires_after: validateOptionalDate(
          value.expires_after ?? null,
          "retention.expires_after",
          errors,
        ),
        keep,
      };
}

function extractFrontmatterBlock(content) {
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

export function parseMemoryMarkdown({ path, content }) {
  const block = extractFrontmatterBlock(content);

  if (!block) {
    return {
      ok: false,
      error: buildError({
        code: "frontmatter.missing_block",
        message: "Memory notes must start with a YAML frontmatter block.",
        path,
      }),
    };
  }

  const document = YAML.parseDocument(block.rawFrontmatter, {
    prettyErrors: false,
    strict: true,
  });

  if (document.errors.length > 0) {
    const [firstError] = document.errors;

    return {
      ok: false,
      error: buildError({
        code: "frontmatter.invalid_yaml",
        message: firstError.message,
        path,
      }),
    };
  }

  const frontmatter = document.toJS();

  if (!isPlainObject(frontmatter)) {
    return {
      ok: false,
      error: buildError({
        code: "frontmatter.invalid_yaml",
        message: "Frontmatter root must be a YAML mapping object.",
        path,
      }),
    };
  }

  return {
    ok: true,
    frontmatter,
    body: block.body,
  };
}

export function validateFrontmatter(input) {
  const errors = [];

  if (!isPlainObject(input)) {
    return {
      ok: false,
      errors: [
        buildError({
          code: "frontmatter.invalid_root",
          message: "Frontmatter must be an object.",
        }),
      ],
    };
  }

  const id = typeof input.id === "string" && input.id.trim()
    ? input.id.trim()
    : null;

  if (!id) {
    errors.push(
      buildError({
        code: "frontmatter.missing_id",
        message: "Memory notes must define a stable frontmatter id.",
      }),
    );
  }

  const type = typeof input.type === "string" ? input.type.trim() : null;

  if (!type || !MEMORY_TYPES.has(type)) {
    errors.push(
      buildError({
        code: "frontmatter.invalid_type",
        message: `Unsupported memory type '${input.type ?? ""}'.`,
      }),
    );
  }

  const status = typeof input.status === "string" ? input.status.trim() : null;

  if (!status) {
    errors.push(
      buildError({
        code: "frontmatter.invalid_status",
        message: "Memory notes must define a status.",
      }),
    );
  } else if (type && MEMORY_TYPES.has(type) && !ALLOWED_STATUSES_BY_TYPE[type].has(status)) {
    errors.push(
      buildError({
        code: "frontmatter.invalid_status_for_type",
        message: `Status '${status}' is not valid for type '${type}'.`,
      }),
    );
  }

  const repoSlug = typeof input.repo_slug === "string" && input.repo_slug.trim()
    ? input.repo_slug.trim()
    : null;

  if (!repoSlug) {
    errors.push(
      buildError({
        code: "frontmatter.missing_repo_slug",
        message: "Memory notes must define repo_slug.",
      }),
    );
  }

  const title = typeof input.title === "string" && input.title.trim()
    ? input.title.trim()
    : null;

  if (!title) {
    errors.push(
      buildError({
        code: "frontmatter.empty_title",
        message: "Memory notes must define a non-empty title.",
      }),
    );
  }

  const owner = typeof input.owner === "string" ? input.owner.trim() : null;

  if (!owner || !MEMORY_OWNERS.has(owner)) {
    errors.push(
      buildError({
        code: "frontmatter.invalid_owner",
        message: "Owner must be one of: morten, agent, human.",
      }),
    );
  }

  const summary = typeof input.summary === "string" && input.summary.trim()
    ? input.summary.trim()
    : null;

  if (!summary) {
    errors.push(
      buildError({
        code: "frontmatter.empty_summary",
        message: "Memory notes must define a non-empty summary.",
      }),
    );
  }

  const tags = normalizeStringArray(input.tags);

  if (tags === null) {
    errors.push(
      buildError({
        code: "frontmatter.invalid_tags",
        message: "Field 'tags' must be an array of strings.",
      }),
    );
  }

  const keywords = normalizeStringArray(input.keywords);

  if (keywords === null) {
    errors.push(
      buildError({
        code: "frontmatter.invalid_keywords",
        message: "Field 'keywords' must be an array of strings.",
      }),
    );
  }

  const links = validateLinks(input.links, errors);
  const retention = validateRetention(input.retention, errors);
  const created = validateDate(input.created, "created", errors);
  const updated = validateDate(input.updated, "updated", errors);

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    value: {
      id,
      type,
      repo_slug: repoSlug,
      title,
      status,
      created,
      updated,
      owner,
      summary,
      tags,
      keywords,
      links,
      retention,
    },
  };
}
