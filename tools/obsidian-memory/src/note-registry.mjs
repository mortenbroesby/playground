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

function buildGraphIndex(notes, edgeTypeByLinkGroup) {
  const noteIds = new Set(notes.map((note) => note.id));
  const edges = [];
  const unresolvedLinks = [];

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

        edges.push({
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
    .map(({ link_groups: _linkGroups, ...note }) => note);

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
