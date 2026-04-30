import path from "node:path";

function flattenLinkGroups(linkGroups) {
  return Array.from(
    new Set(
      [
        ...linkGroups.parents,
        ...linkGroups.children,
        ...linkGroups.related,
        ...linkGroups.supersedes,
        ...linkGroups.superseded_by,
      ]
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function normalizePathLike(value) {
  return value
    .replace(/\\/g, "/")
    .replace(/^vault\//i, "")
    .replace(/\.md$/i, "")
    .replace(/^\.\/+/, "")
    .replace(/^\/+/, "")
    .trim()
    .toLowerCase();
}

function normalizeTitleLike(value) {
  return value.trim().toLowerCase();
}

function parseMarkdownTargets(body) {
  const targets = [];
  const pattern = /\[[^\]]+\]\(([^)]+)\)/g;

  for (const match of body.matchAll(pattern)) {
    const target = match[1]?.trim();
    if (!target) {
      continue;
    }
    targets.push(target);
  }

  return targets;
}

function parseWikilinkTargets(body) {
  const targets = [];
  const pattern = /\[\[([^[\]]+)\]\]/g;

  for (const match of body.matchAll(pattern)) {
    const target = match[1]?.trim();
    if (!target) {
      continue;
    }
    targets.push(target);
  }

  return targets;
}

function buildResolutionMap(notes) {
  const noteIdMap = new Map();
  const titleMap = new Map();
  const pathMap = new Map();

  function addToMap(map, key, noteId) {
    if (!key) {
      return;
    }
    const bucket = map.get(key) ?? new Set();
    bucket.add(noteId);
    map.set(key, bucket);
  }

  for (const note of notes) {
    noteIdMap.set(note.id, note.id);
    addToMap(titleMap, normalizeTitleLike(note.title), note.id);

    const normalizedPath = normalizePathLike(note.path);
    const pathSegments = normalizedPath.split("/");
    const basename = pathSegments[pathSegments.length - 1] ?? "";

    addToMap(pathMap, normalizedPath, note.id);
    addToMap(pathMap, basename, note.id);
  }

  return {
    noteIdMap,
    titleMap,
    pathMap,
  };
}

function resolveUniqueTarget(map, key) {
  const bucket = map.get(key);
  if (!bucket || bucket.size !== 1) {
    return null;
  }

  return [...bucket][0];
}

function resolveMarkdownTarget(rawTarget, note, resolutionMap) {
  const trimmedTarget = rawTarget
    .replace(/^<|>$/g, "")
    .split("#")[0]
    .split("?")[0]
    .trim();

  if (!trimmedTarget) {
    return null;
  }

  if (
    /^[a-z]+:\/\//i.test(trimmedTarget) ||
    trimmedTarget.startsWith("mailto:") ||
    trimmedTarget.startsWith("#")
  ) {
    return null;
  }

  if (resolutionMap.noteIdMap.has(trimmedTarget)) {
    return trimmedTarget;
  }

  const noteRelativePath = normalizePathLike(note.path);
  const noteDirectory = noteRelativePath.includes("/")
    ? noteRelativePath.slice(0, noteRelativePath.lastIndexOf("/"))
    : "";
  const directKey = normalizePathLike(trimmedTarget);
  const relativeKey = normalizePathLike(
    noteDirectory
      ? path.posix.normalize(path.posix.join(noteDirectory, trimmedTarget))
      : trimmedTarget,
  );

  return (
    resolveUniqueTarget(resolutionMap.pathMap, directKey) ??
    resolveUniqueTarget(resolutionMap.pathMap, relativeKey)
  );
}

function resolveWikilinkTarget(rawTarget, resolutionMap) {
  const candidate = rawTarget.split("|")[0]?.split("#")[0]?.trim();

  if (!candidate) {
    return null;
  }

  if (resolutionMap.noteIdMap.has(candidate)) {
    return candidate;
  }

  return (
    resolveUniqueTarget(resolutionMap.pathMap, normalizePathLike(candidate)) ??
    resolveUniqueTarget(resolutionMap.titleMap, normalizeTitleLike(candidate))
  );
}

function inferBodyEdges(note, resolutionMap) {
  const inferredTargets = new Set();

  for (const markdownTarget of parseMarkdownTargets(note.body ?? "")) {
    const resolved = resolveMarkdownTarget(markdownTarget, note, resolutionMap);
    if (resolved && resolved !== note.id) {
      inferredTargets.add(resolved);
    }
  }

  for (const wikilinkTarget of parseWikilinkTargets(note.body ?? "")) {
    const resolved = resolveWikilinkTarget(wikilinkTarget, resolutionMap);
    if (resolved && resolved !== note.id) {
      inferredTargets.add(resolved);
    }
  }

  return [...inferredTargets].sort((left, right) => left.localeCompare(right));
}

function buildGraphIndex(notes, edgeTypeByLinkGroup) {
  const noteIds = new Set(notes.map((note) => note.id));
  const edges = [];
  const edgeKeys = new Set();
  const unresolvedLinks = [];
  const resolutionMap = buildResolutionMap(notes);

  function pushEdge(edge) {
    const edgeKey = `${edge.from}::${edge.to}::${edge.type}`;
    if (edgeKeys.has(edgeKey)) {
      return;
    }
    edgeKeys.add(edgeKey);
    edges.push(edge);
  }

  for (const note of notes) {
    const groupedLinks = note.link_groups;

    if (!groupedLinks) {
      continue;
    }

    const missingTargets = new Set();

    for (const [group, targets] of Object.entries(groupedLinks)) {
      for (const target of targets) {
        if (!noteIds.has(target)) {
          missingTargets.add(target);
          continue;
        }

        pushEdge({
          from: note.id,
          to: target,
          type: edgeTypeByLinkGroup[group],
        });
      }
    }

    if (missingTargets.size > 0) {
      unresolvedLinks.push({
        from: note.id,
        targets: Array.from(missingTargets).sort((left, right) =>
          left.localeCompare(right),
        ),
      });
    }

    for (const inferredTarget of inferBodyEdges(note, resolutionMap)) {
      pushEdge({
        from: note.id,
        to: inferredTarget,
        type: "references",
      });
    }
  }

  edges.sort(
    (left, right) =>
      left.from.localeCompare(right.from) ||
      left.to.localeCompare(right.to) ||
      left.type.localeCompare(right.type),
  );

  return {
    graph: {
      nodes: notes.map((note) => ({
        id: note.id,
        type: note.type,
        status: note.status,
      })),
      edges,
    },
    unresolvedLinks,
  };
}

function buildValidationIssuesForNote(note, unresolvedLinks) {
  const issues = [];

  if (note.syntheticId) {
    issues.push("missing_frontmatter_id");
  }

  if (!note.summary) {
    issues.push("missing_summary");
  }

  if (note.typeNormalized) {
    issues.push("legacy_type_normalized");
  }

  if (note.statusNormalized) {
    issues.push("legacy_status_normalized");
  }

  if (unresolvedLinks.some((entry) => entry.from === note.id)) {
    issues.push("unresolved_links");
  }

  return issues;
}

function buildValidationWarnings(noteRegistry) {
  const warnings = [];

  for (const note of noteRegistry) {
    const issues = Array.isArray(note.validation_issues) ? note.validation_issues : [];

    if (issues.includes("missing_frontmatter_id")) {
      warnings.push(`${note.path}: missing frontmatter id; generated ${note.id}`);
    }

    if (issues.includes("missing_summary")) {
      warnings.push(`${note.path}: missing summary`);
    }
  }

  return warnings;
}

export function buildNoteRegistryArtifacts({
  notes,
  chunkIndex,
  edgeTypeByLinkGroup,
}) {
  const registryWithLinks = notes.map((note) => ({
    id: note.id,
    type: note.type,
    repo_slug: note.repoSlug,
    path: note.path,
    title: note.title,
    status: note.status,
    created: note.created,
    updated: note.updated,
    summary: note.summary,
    tags: note.tags,
    keywords: note.keywords,
    outbound_links: flattenLinkGroups(note.linkGroups),
    inbound_links: [],
    content_hash: note.contentHash,
    mtime_ms: note.mtimeMs,
    owner: note.owner,
    body: note.body,
    legacy_type: note.legacyType,
    legacy_status: note.legacyStatus,
    link_groups: note.linkGroups,
  }));

  const duplicateNoteIds = registryWithLinks.reduce((accumulator, note) => {
    const bucket = accumulator.get(note.id) ?? [];
    bucket.push(note.path);
    accumulator.set(note.id, bucket);
    return accumulator;
  }, new Map());

  for (const [noteId, paths] of duplicateNoteIds.entries()) {
    if (paths.length > 1) {
      throw new Error(
        `registry.duplicate_id: Duplicate memory note id '${noteId}' in ${paths.join(", ")}`,
      );
    }
  }

  const registryNotesById = new Map(registryWithLinks.map((note) => [note.id, note]));

  for (const note of registryWithLinks) {
    for (const target of note.outbound_links) {
      if (registryNotesById.has(target)) {
        registryNotesById.get(target).inbound_links.push(note.id);
      }
    }
  }

  const { graph, unresolvedLinks } = buildGraphIndex(
    registryWithLinks,
    edgeTypeByLinkGroup,
  );
  const indexedNotesById = new Map(notes.map((note) => [note.id, note]));
  const chunkIdsByNoteId = chunkIndex.reduce((accumulator, chunk) => {
    const chunkIds = accumulator.get(chunk.note_id) ?? [];
    chunkIds.push(chunk.chunk_id);
    accumulator.set(chunk.note_id, chunkIds);
    return accumulator;
  }, new Map());

  const noteRegistry = registryWithLinks
    .map((note) => {
      const indexedNote = indexedNotesById.get(note.id);

      if (!indexedNote) {
        throw new Error(`registry.missing_note: Missing indexed note for ${note.id}`);
      }

      const validationIssues = buildValidationIssuesForNote(
        indexedNote,
        unresolvedLinks,
      );

      return {
        ...note,
        chunk_ids: chunkIdsByNoteId.get(note.id) ?? [],
        validation_status: validationIssues.length > 0 ? "warning" : "ok",
        validation_issues: validationIssues,
        inbound_links: Array.from(new Set(note.inbound_links)).sort((left, right) =>
          left.localeCompare(right),
        ),
      };
    })
    .map(({ link_groups: _linkGroups, body: _body, ...note }) => note);

  return {
    noteRegistry,
    graph,
    unresolvedLinks,
  };
}

export function buildDiagnosticsReport({
  generatedAt,
  noteRegistry,
  repoSlug,
  unresolvedLinks,
}) {
  return {
    schema_version: 2,
    generated_at: generatedAt,
    repo_slug: repoSlug,
    notes: noteRegistry.length,
    chunks: noteRegistry.reduce(
      (total, note) => total + (Array.isArray(note.chunk_ids) ? note.chunk_ids.length : 0),
      0,
    ),
    notes_by_type: noteRegistry.reduce((accumulator, note) => {
      accumulator[note.type] = (accumulator[note.type] ?? 0) + 1;
      return accumulator;
    }, {}),
    notes_by_status: noteRegistry.reduce((accumulator, note) => {
      accumulator[note.status] = (accumulator[note.status] ?? 0) + 1;
      return accumulator;
    }, {}),
    synthetic_ids: noteRegistry
      .filter((note) => (note.validation_issues ?? []).includes("missing_frontmatter_id"))
      .map((note) => note.path),
    legacy_type_normalizations: noteRegistry
      .filter(
        (note) =>
          !!note.legacy_type &&
          note.legacy_type.trim().toLowerCase() !== note.type,
      )
      .map((note) => ({
        path: note.path,
        from: note.legacy_type ?? "unknown",
        to: note.type,
      })),
    status_normalizations: noteRegistry
      .filter(
        (note) =>
          !!note.legacy_status &&
          (note.validation_issues ?? []).includes("legacy_status_normalized"),
      )
      .map((note) => ({
        path: note.path,
        from: note.legacy_status ?? "unknown",
        to: note.status,
      })),
    unresolved_links: unresolvedLinks,
    validation_warnings: buildValidationWarnings(noteRegistry),
  };
}
