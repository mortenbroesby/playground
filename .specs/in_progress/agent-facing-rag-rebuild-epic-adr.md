# Agent-Facing Specification and ADR: Rebuild Repository RAG as a Typed, Self-Cleaning Memory System

**Repository:** `mortenbroesby/playground`
**Target package:** `tools/obsidian-memory`
**Primary source of truth:** `vault/`
**Generated retrieval output:** `.rag/`
**Document type:** Overarching agent implementation spec + epic + ADR
**Status:** Proposed
**Owner:** Morten + repo agents
**Created:** 2026-04-30
**Development model:** Spec-driven development + TDD

---

## 0. How agents must use this document

This document is written for implementation agents. Treat it as the controlling spec for rebuilding the repo RAG.

Agents must follow these rules:

1. **Do not start by coding the whole system.** Start with the smallest story, write tests, watch them fail, then implement.
2. **Do not add embeddings first.** Schema, identity, validation, and registry must exist before hybrid retrieval.
3. **Do not delete source vault notes automatically.** Cleanup must be dry-run-first and reviewable.
4. **Do not bury durable decisions inside session notes.** If a session creates a decision, create or propose an ADR.
5. **Do not treat `.rag/` as source of truth.** `.rag/` is generated and must be safely disposable.
6. **Do not trust mtime alone.** Use content hashes for deterministic indexing.
7. **Do not let archived or superseded notes outrank active/accepted notes by default.** Historical notes require explicit opt-in.
8. **Do not write memory without classification and dedupe.** Every memory write must run through the write decision tree.
9. **Do not create vague notes.** Every durable note needs a specific title, summary, type, status, and reason to exist.
10. **Do not accept retrieval changes without golden-query tests.** Retrieval quality must be testable.

The implementation should proceed story-by-story. Every story includes acceptance criteria and expected tests. Agents should record work in session notes and update specs/ADRs only when durable state changes.

---

# Part 1: ADR

## ADR-0001: Rebuild repo RAG as a typed, self-cleaning agent memory system

### Status

Proposed.

### Context

The repository already has a local memory foundation:

- `vault/` stores durable Markdown notes.
- `.rag/` stores generated retrieval output.
- `tools/obsidian-memory` provides RAG commands such as initialization, indexing, querying, verification, MCP serving, and retrieval tests.
- Current retrieval is primarily lexical. It scores token matches across chunk text, headings, paths, tags, keywords, summaries, and note type.
- The current model is useful but flat: Markdown files are chunked and searched, but memory is not yet governed as a typed, linked, lifecycle-aware system.

The desired direction is larger than “make retrieval faster.” The desired system should let agents reason about repository memory as structured state:

- Is this a durable architecture decision?
- Is this a future implementation spec?
- Is this a temporary session note?
- Is this a small actionable todo?
- Is this stale and ready to summarize, archive, or dedupe?
- Which notes should be retrieved first for an architecture question?
- Which historical notes should be ignored unless explicitly requested?

The current system lacks:

- strict note schema
- stable note identity
- typed note registry
- query classification
- write classification
- hybrid retrieval
- graph links
- lifecycle and cleanup policies
- retrieval evaluation fixtures
- dry-run cleanup reports
- agent-safe memory write APIs

Without these, the RAG risks becoming a growing pile of loosely related Markdown notes. Retrieval may appear to work initially but degrade as sessions, todos, specs, and decisions accumulate.

### Decision

Rebuild the repository RAG as a **typed, self-cleaning, local-first agent memory system**.

The new architecture will retain:

- Obsidian-compatible Markdown as the human-editable source of truth.
- The `vault/` and `.rag/` split.
- Repo-owned tooling under `tools/obsidian-memory`.
- CLI commands that agents can invoke.
- MCP integration for agent access.

The new architecture will add:

1. **Strict note schema** with required frontmatter.
2. **Stable note IDs** independent of file path and heading.
3. **Typed memory**: repo home, architecture records, specs, sessions, todos, investigations, references, and glossary entries.
4. **Note registry** as the generated note-level index.
5. **Chunk index** as a generated retrieval layer below notes.
6. **Hybrid retrieval** combining exact lookup, lexical/BM25, vector search, metadata filters, graph expansion, status boosts, recency boosts, and reranking.
7. **Query planning** before retrieval.
8. **Write classification** before memory writes.
9. **Graph index** based on frontmatter links, Markdown links, and Obsidian wikilinks.
10. **Self-cleaning** via dry-run cleanup reports.
11. **TDD evaluation** with golden retrieval fixtures.
12. **Agent operating rules** that require RAG reads/writes at the right time.

### Rationale

A repository RAG is not only a retrieval feature. It is a memory governance system.

A simple text index can answer “where is this word mentioned?” but a repo agent needs higher-order answers:

- “What is the accepted decision?”
- “Which spec is active?”
- “Which session notes are disposable?”
- “What is the latest actionable todo?”
- “Which old note is superseded?”
- “What context should I trust before changing code?”

Those questions require note type, lifecycle state, relationships, and retrieval policy.

The design therefore prioritizes schema and lifecycle before embeddings. Embeddings can improve recall, but they cannot fix ambiguous memory. Hybrid retrieval should be introduced only after memory records are valid, typed, and linkable.

### Alternatives considered

#### Alternative A: Keep current lexical RAG and tune scoring

This would be simple and low-risk.

Rejected because:

- it does not solve memory growth
- it does not create ADR/spec/session/todo routing
- it does not prevent stale notes from outranking accepted notes
- it does not support graph traversal
- it does not create a write governance model

#### Alternative B: Replace the local system with a hosted vector database

This may improve semantic retrieval quickly.

Rejected for the default workflow because:

- the repo benefits from local-first tooling
- hosted infrastructure introduces operational overhead
- vector-only retrieval is bad for exact filenames, commands, package names, and repo jargon
- hosted vector search does not solve schema, lifecycle, or write decisions by itself

#### Alternative C: Use Obsidian only and rely on manual note hygiene

This is simple and human-friendly.

Rejected because:

- agents need deterministic validation and retrieval
- manual hygiene does not scale across repeated agent sessions
- cleanup needs reports, tests, and policies
- future agents need explicit operating rules

#### Alternative D: Build a full knowledge graph first

This is attractive but too large as a first step.

Rejected as the initial implementation because:

- graph quality depends on valid note identity and links
- retrieval and cleanup can improve before a full graph is complete
- a staged build is easier to test

### Consequences

Positive consequences:

- Agents can retrieve more trustworthy context.
- Specs can live inside RAG and be executable by future agents.
- Durable decisions become discoverable and protected.
- Temporary session notes can be summarized or archived.
- Memory growth becomes manageable.
- Retrieval quality becomes testable.
- `.rag/` can be deleted and regenerated safely.

Negative consequences:

- More structure is required in notes.
- Some existing vault notes may need migration.
- Initial implementation is larger than a scoring tweak.
- Agents must respect workflow rules.
- The codebase will need more tests and fixtures.

### Final ADR statement

The repository will treat RAG as a **memory operating system** with four layers:

~~~text
1. Source memory
   vault Markdown notes

2. Memory governance
   schema, IDs, types, statuses, links, retention

3. Retrieval
   exact lookup, lexical, vector, graph, rerank, context assembly

4. Agent operations
   classify, write, verify, clean, summarize, archive
~~~

---

# Part 2: Epic

## Epic: Rebuild the repo RAG into a typed, self-cleaning agent memory system

### Epic summary

Rebuild `tools/obsidian-memory` so repository agents can use the vault as a durable, typed, query-routed, self-cleaning memory system.

The epic is complete when agents can:

1. Validate all memory notes against a strict schema.
2. Generate a note registry and retrieval indexes.
3. Classify user/agent requests before retrieval.
4. Retrieve context using hybrid search and graph relationships.
5. Decide whether new information should become an ADR, spec, session, todo, investigation, reference, glossary entry, repo-home update, or no write.
6. Write valid memory from templates.
7. Run cleanup dry-runs that identify stale, duplicate, orphaned, oversized, completed, and superseded notes.
8. Run retrieval tests that prove the right notes are retrieved for realistic repo questions.

### Epic non-goals

This epic does not require:

- hosted infrastructure
- cloud vector database
- automatic deletion of source vault notes
- replacing Obsidian
- rewriting unrelated app code
- perfect semantic search in the first PR
- a UI for memory management
- storing chat transcripts wholesale
- storing secrets or credentials

### Epic success criteria

The epic is done when the following command sequence succeeds:

~~~bash
pnpm --filter @playground/obsidian-memory rag:doctor
pnpm --filter @playground/obsidian-memory rag:index
pnpm --filter @playground/obsidian-memory rag:query --query "What is the current RAG architecture?" --explain
pnpm --filter @playground/obsidian-memory rag:classify --input "We decided to use hybrid retrieval for repo memory"
pnpm --filter @playground/obsidian-memory rag:clean --dry-run
pnpm --filter @playground/obsidian-memory test:retrieval
~~~

And when:

- invalid frontmatter fails validation
- duplicate note IDs fail validation
- stale todos are reported
- old sessions are reported for summarization
- archived notes are excluded from default retrieval
- accepted ADRs outrank stale session notes for architecture queries
- active specs are retrievable and executable by agents
- `.rag/` can be deleted and regenerated without losing source memory

---

# Part 3: System principles

## Principle 1: Source notes are durable, indexes are disposable

`vault/` is source of truth. `.rag/` is generated.

Agents may delete and regenerate `.rag/`. Agents must not delete vault notes automatically.

## Principle 2: Note identity must survive movement

A memory note needs a stable `id` in frontmatter. Links must refer to IDs, not fragile paths.

Bad:

~~~yaml
related: ["vault/00 Repositories/playground/sessions/last-session.md"]
~~~

Good:

~~~yaml
related: ["mem-20260430-rag-schema-registry"]
~~~

## Principle 3: Retrieval must prefer trusted durable memory

For architecture questions, an accepted ADR should beat an old session note even if the session has more lexical overlap.

Default priority:

1. exact note ID/path match
2. accepted architecture records
3. active specs
4. repo-home sections
5. recent sessions
6. active todos
7. investigations
8. references
9. archived/superseded notes only when requested

## Principle 4: Memory writes require classification

An agent must not decide ad hoc where to write memory. Use the write decision tree.

## Principle 5: Cleanup is advisory by default

Self-cleaning means the system identifies cleanup actions. It does not mean it silently deletes source notes.

Allowed automatic cleanup:

- deleting generated `.rag/` output
- regenerating indexes
- removing temporary generated files

Not allowed without human or explicit agent approval:

- deleting vault notes
- archiving source notes
- merging notes
- rewriting ADRs
- marking todos done

## Principle 6: Tests define the expected memory behavior

Every meaningful behavior needs tests:

- schema tests
- registry tests
- index tests
- retrieval tests
- planner tests
- writer tests
- cleaner tests
- doctor tests

---

# Part 4: Memory domain model

## 4.1 Memory note

A memory note is a human-editable Markdown file in `vault/` with required frontmatter and a typed body.

A note is the durable unit of memory.

A note may generate one or more chunks.

## 4.2 Chunk

A chunk is a generated retrieval unit derived from a note.

A chunk is not durable. It can be regenerated.

Chunk IDs should be stable enough for traceability during one index generation, but note IDs are the durable reference.

Recommended chunk ID:

~~~text
chunk:${note_id}:${chunk_index}:${content_hash_prefix}
~~~

Example:

~~~text
chunk:mem-20260430-rag-rebuild-spec:0003:a82f0b1c
~~~

## 4.3 Registry entry

A registry entry is one generated row per source note.

It captures:

- note ID
- type
- path
- title
- status
- summary
- dates
- links
- content hash
- chunk IDs
- validation status

## 4.4 Graph edge

A graph edge is a typed relationship between two memory notes.

Examples:

- spec implements ADR
- session spawned todo
- investigation informed ADR
- ADR supersedes ADR
- todo implements spec
- repo-home links active spec

## 4.5 Query plan

A query plan is the retrieval strategy generated from a user or agent request.

It decides:

- intent
- preferred note types
- excluded statuses
- metadata filters
- expanded queries
- exact lookups
- whether graph expansion is useful
- whether archived notes should be included

## 4.6 Context bundle

A context bundle is the final selected memory sent to an agent/model.

It must include:

- selected chunks
- source note IDs
- source paths
- note types
- statuses
- scores
- match reasons
- graph distance
- token estimates
- omitted candidates
- retrieval trace

## 4.7 Cleanup report

A cleanup report is a dry-run output that identifies memory maintenance tasks.

It must include:

- duplicate notes
- stale todos
- sessions to summarize
- orphan notes
- oversized notes
- completed specs to archive
- superseded ADRs
- invalid frontmatter
- generated files safe to delete

---

# Part 5: Memory types

Every durable note must have exactly one `type`.

## 5.1 `repo-home`

Canonical high-level repository overview.

Use when the note describes:

- what the repo is
- current architecture map
- important packages and apps
- active tracks
- major conventions
- important links into other memory

Expected location:

~~~text
vault/00 Repositories/playground/00 Repo Home.md
~~~

Retention:

- permanent
- updated frequently
- should not expire

Example use:

A user asks: “What is this repo?” Retrieval should include `repo-home` first.

## 5.2 `architecture-record`

A durable architecture decision or design record.

Use when information affects:

- architecture
- package boundaries
- data flow
- tooling
- workflows
- conventions
- long-lived tradeoffs
- dependency choices
- source-of-truth decisions

Do not use for:

- random observations
- temporary work logs
- tiny tasks
- future implementation plans without a decision

Retention:

- permanent unless superseded
- superseded records remain discoverable but excluded from default retrieval

Example:

~~~text
Decision: Use Obsidian-compatible Markdown as the source of truth and `.rag/` as generated retrieval output.
Type: architecture-record
Reason: This affects the entire memory architecture and future agents must understand it.
~~~

## 5.3 `spec`

A future implementation plan with acceptance criteria.

Use when:

- multiple steps are required
- the work needs sequencing
- an agent should be able to execute it later
- there are acceptance criteria
- tests are needed
- APIs or architecture need to be designed before implementation

Retention:

- active until implemented
- archive or mark done when complete
- link to resulting ADRs, sessions, and todos

Example:

~~~text
User request: "Rebuild our RAG from the ground up."
Type: spec
Reason: The work is multi-step, architectural, and requires implementation stories.
~~~

## 5.4 `session`

A time-bounded work log.

Use when:

- an agent or human worked on the repo
- files changed
- commands ran
- findings emerged
- next handoff matters

Do not use as the only place for durable decisions.

Retention:

- summarize after 14 days
- archive after 60 days
- delete/compress only after review unless linked as durable evidence

Example:

~~~text
Session: Implemented strict frontmatter validation and added failing schema tests.
Type: session
Reason: This captures what happened during a bounded implementation session.
~~~

## 5.5 `todo`

A small actionable task.

Use when:

- one concrete action is needed
- the item is independently completable
- no full spec is required

Do not use when:

- the work has multiple phases
- there are architectural tradeoffs
- acceptance criteria span several modules

Retention:

- review after 30 days if still active
- mark done when complete
- archive or summarize done todos

Example:

~~~text
Todo: Add fixture for archived ADR exclusion in retrieval tests.
Type: todo
Reason: Small concrete testing task.
~~~

## 5.6 `investigation`

Research, exploration, or comparison without a final decision.

Use when:

- evaluating alternatives
- recording experiments
- comparing libraries
- documenting uncertainty

Retention:

- merge into ADR/spec if it becomes decision-grade
- review after 90 days

Example:

~~~text
Investigation: Compare local embedding model options for TypeScript CLI usage.
Type: investigation
Reason: Research is not yet a decision.
~~~

## 5.7 `reference`

Stable support material.

Use for:

- command references
- workflow references
- API notes
- recurring conventions
- stable external documentation summaries

Retention:

- review every 180 days

Example:

~~~text
Reference: RAG CLI command reference.
Type: reference
Reason: Stable operational support material.
~~~

## 5.8 `glossary`

Canonical definitions of repo-specific terms.

Use for:

- terms agents repeatedly confuse
- project-specific vocabulary
- abbreviations

Retention:

- permanent
- reviewed occasionally

Example:

~~~text
Glossary: "memory note", "chunk", "registry", "graph edge", "session".
Type: glossary
Reason: Definitions improve classification and retrieval consistency.
~~~

---

# Part 6: Required frontmatter schema

## 6.1 Required schema

Every memory note must include this frontmatter:

~~~yaml
---
id: "mem-YYYYMMDD-short-slug"
type: "repo-home | architecture-record | spec | session | todo | investigation | reference | glossary"
repo_slug: "playground"
title: "Human-readable title"
status: "proposed | active | accepted | done | archived | superseded"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
owner: "morten | agent | human"
summary: "One sentence summary."
tags: []
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: null
  expires_after: null
  keep: false
---
~~~

## 6.2 Status meanings

### `proposed`

The note is drafted but not yet accepted or active.

Allowed for:

- `architecture-record`
- `spec`
- `investigation`

### `active`

The note is currently relevant and should participate in default retrieval.

Allowed for:

- `repo-home`
- `spec`
- `session`
- `todo`
- `investigation`
- `reference`
- `glossary`

### `accepted`

A decision is accepted and should be trusted for architecture questions.

Allowed for:

- `architecture-record`

### `done`

The work is complete.

Allowed for:

- `spec`
- `todo`
- `session`

### `archived`

The note is no longer normally retrieved but remains available for historical lookup.

Allowed for all types except `repo-home` unless explicitly approved.

### `superseded`

The note has been replaced by a newer note.

Allowed primarily for:

- `architecture-record`
- `spec`
- `reference`

## 6.3 Invalid schema examples

### Missing ID

~~~yaml
---
type: "spec"
repo_slug: "playground"
title: "RAG rebuild"
---
~~~

Expected validation error:

~~~json
{
  "path": "vault/00 Repositories/playground/specs/rag-rebuild.md",
  "code": "frontmatter.missing_id",
  "message": "Memory notes must define a stable frontmatter id."
}
~~~

### Invalid type

~~~yaml
---
id: "mem-20260430-rag"
type: "note"
repo_slug: "playground"
title: "RAG"
---
~~~

Expected validation error:

~~~json
{
  "code": "frontmatter.invalid_type",
  "message": "Unsupported memory type 'note'."
}
~~~

### Broken link

~~~yaml
links:
  related: ["mem-DOES-NOT-EXIST"]
~~~

Expected validation error:

~~~json
{
  "code": "links.target_missing",
  "message": "Link target mem-DOES-NOT-EXIST was not found in the note registry."
}
~~~

---

# Part 7: Decision tree for memory writes

Agents must use this exact decision order.

~~~text
1. Is the information useful beyond this immediate answer?
   no  → no durable write
   yes → continue

2. Does it change architecture, boundaries, conventions, tooling, workflows, dependencies, or data flow?
   yes → architecture-record
   no  → continue

3. Does it describe future implementation work with multiple steps, acceptance criteria, or API/design implications?
   yes → spec
   no  → continue

4. Is it a small, independently completable action?
   yes → todo
   no  → continue

5. Is it a log of what happened during a bounded work period?
   yes → session
   no  → continue

6. Is it research, comparison, or exploration without a final decision?
   yes → investigation
   no  → continue

7. Is it stable support material, command reference, or workflow reference?
   yes → reference
   no  → continue

8. Is it a canonical definition of repo-specific vocabulary?
   yes → glossary
   no  → no durable write
~~~

## 7.1 Write classification examples

### Example A: Architecture decision

Input:

~~~text
We decided that `.rag/` should always be generated and never the source of truth.
~~~

Expected classification:

~~~json
{
  "should_write": true,
  "type": "architecture-record",
  "confidence": 0.95,
  "reason": "This is a durable source-of-truth decision affecting memory architecture.",
  "status": "accepted",
  "dedupe_query": "generated .rag source of truth vault architecture decision"
}
~~~

### Example B: Spec

Input:

~~~text
Build a self-cleaning cleanup command that reports stale todos, duplicate notes, old sessions, and orphan notes.
~~~

Expected classification:

~~~json
{
  "should_write": true,
  "type": "spec",
  "confidence": 0.89,
  "reason": "This describes multi-step future implementation with acceptance criteria.",
  "status": "active",
  "dedupe_query": "self cleaning cleanup command stale todos duplicate notes sessions orphan notes"
}
~~~

### Example C: Todo

Input:

~~~text
Add a test fixture proving archived ADRs are excluded by default.
~~~

Expected classification:

~~~json
{
  "should_write": true,
  "type": "todo",
  "confidence": 0.92,
  "reason": "This is a small independently completable action.",
  "status": "active",
  "dedupe_query": "test fixture archived ADRs excluded default retrieval"
}
~~~

### Example D: Session

Input:

~~~text
Today I added schema tests, implemented YAML parsing, and found that nested retention metadata needs a real parser.
~~~

Expected classification:

~~~json
{
  "should_write": true,
  "type": "session",
  "confidence": 0.88,
  "reason": "This is a bounded work log with actions and findings.",
  "status": "active",
  "dedupe_query": "schema tests YAML parsing nested retention metadata session"
}
~~~

### Example E: No write

Input:

~~~text
What command runs the tests?
~~~

Expected classification:

~~~json
{
  "should_write": false,
  "type": null,
  "confidence": 0.99,
  "reason": "This is a transient question and does not introduce durable memory."
}
~~~

---

# Part 8: Request handling state machine

## 8.1 Main state machine

~~~text
START
  ↓
CLASSIFY_REQUEST
  ↓
PLAN_RETRIEVAL
  ↓
RETRIEVE_CONTEXT
  ↓
ASSEMBLE_CONTEXT
  ↓
ANSWER_OR_ACT
  ↓
CLASSIFY_MEMORY_WRITE
  ↓
WRITE_OR_SKIP
  ↓
VALIDATE_MEMORY
  ↓
INDEX_MEMORY
  ↓
VERIFY_RETRIEVAL
  ↓
CLEANUP_DRY_RUN_IF_NEEDED
  ↓
DONE
~~~

## 8.2 State: `CLASSIFY_REQUEST`

Input:

~~~json
{
  "input": "Why did we choose Obsidian for memory?",
  "repo_slug": "playground"
}
~~~

Output:

~~~json
{
  "intent": "architecture_question",
  "needs_rag": true,
  "needs_code_search": false,
  "needs_external_research": false,
  "preferred_note_types": ["architecture-record", "repo-home", "spec", "session"],
  "excluded_statuses": ["archived", "superseded"],
  "include_historical": false,
  "expected_memory_write": null
}
~~~

## 8.3 State: `PLAN_RETRIEVAL`

Input:

~~~json
{
  "intent": "architecture_question",
  "query": "Why did we choose Obsidian for memory?"
}
~~~

Output:

~~~json
{
  "original_query": "Why did we choose Obsidian for memory?",
  "normalized_query": "obsidian memory architecture decision source of truth",
  "expanded_queries": [
    "Obsidian memory architecture decision",
    "vault source of truth .rag generated",
    "repo memory ADR Obsidian"
  ],
  "preferred_note_types": ["architecture-record", "repo-home"],
  "metadata_filters": {
    "repo_slug": "playground",
    "status_not_in": ["archived", "superseded"]
  },
  "use_graph_expansion": true,
  "use_vector": true,
  "use_lexical": true
}
~~~

## 8.4 State: `RETRIEVE_CONTEXT`

Retrieval order:

1. exact ID/path lookup
2. metadata-filtered lexical search
3. vector search
4. graph expansion
5. status/recency scoring
6. rank fusion
7. rerank
8. context assembly

## 8.5 State: `CLASSIFY_MEMORY_WRITE`

Only run after an answer/action if something durable may have changed.

Example output:

~~~json
{
  "should_write": true,
  "type": "session",
  "reason": "The agent completed implementation work and needs a handoff note.",
  "dedupe_query": "implemented note registry schema validation rag memory",
  "candidate_existing_notes": [],
  "retention": {
    "review_after_days": 14,
    "expires_after_days": 180,
    "keep": false
  }
}
~~~

---

# Part 9: Proposed file tree

## 9.1 Source vault

~~~text
vault/
  00 Repositories/
    playground/
      00 Repo Home.md
      architecture/
        mem-YYYYMMDD-title.md
      specs/
        mem-YYYYMMDD-title.md
      sessions/
        YYYY-MM-DD-session-title.md
      todos/
        mem-YYYYMMDD-title.md
      investigations/
        mem-YYYYMMDD-title.md
      references/
        mem-YYYYMMDD-title.md
      glossary/
        mem-YYYYMMDD-title.md
  90 Templates/
    architecture-record.md
    spec.md
    session.md
    todo.md
    investigation.md
    reference.md
    glossary.md
  91 Scripts/
~~~

## 9.2 Generated RAG output

~~~text
.rag/
  manifest.json
  note-registry.json
  chunks.json
  lexical-index.json
  vector-index.json
  graph-index.json
  diagnostics.json
  cleanup-report.latest.json
~~~

## 9.3 Package source layout

~~~text
tools/obsidian-memory/
  src/
    cli/
      classify.ts
      clean.ts
      doctor.ts
      index.ts
      query.ts
      verify.ts
      write.ts
    core/
      content-hash.ts
      dates.ts
      errors.ts
      paths.ts
      tokens.ts
    schema/
      frontmatter-schema.ts
      memory-types.ts
      validate-frontmatter.ts
    registry/
      build-note-registry.ts
      note-registry-types.ts
    index/
      build-chunks.ts
      build-lexical-index.ts
      build-vector-index.ts
      build-graph-index.ts
      index-manifest.ts
    retrieval/
      classify-query.ts
      plan-retrieval.ts
      lexical-search.ts
      vector-search.ts
      graph-expand.ts
      rank-fusion.ts
      rerank.ts
      assemble-context.ts
      retrieve.ts
    write/
      classify-write.ts
      dedupe-memory.ts
      render-template.ts
      write-note.ts
    clean/
      detect-duplicates.ts
      detect-stale-todos.ts
      detect-old-sessions.ts
      detect-orphans.ts
      detect-oversized-notes.ts
      cleanup-report.ts
    mcp/
      rag-mcp-server.ts
  tests/
    fixtures/
      vault-valid/
      vault-invalid/
      golden-queries/
    schema.test.ts
    registry.test.ts
    index.test.ts
    query-planner.test.ts
    retrieval.test.ts
    writer.test.ts
    cleaner.test.ts
    doctor.test.ts
~~~

---

# Part 10: TypeScript API design

## 10.1 Memory type and status

~~~ts
export type MemoryType =
  | "repo-home"
  | "architecture-record"
  | "spec"
  | "session"
  | "todo"
  | "investigation"
  | "reference"
  | "glossary";

export type MemoryStatus =
  | "proposed"
  | "active"
  | "accepted"
  | "done"
  | "archived"
  | "superseded";
~~~

## 10.2 Frontmatter

~~~ts
export type MemoryLinks = {
  parents: string[];
  children: string[];
  related: string[];
  supersedes: string[];
  superseded_by: string[];
};

export type MemoryRetention = {
  review_after: string | null;
  expires_after: string | null;
  keep: boolean;
};

export type MemoryFrontmatter = {
  id: string;
  type: MemoryType;
  repo_slug: string;
  title: string;
  status: MemoryStatus;
  created: string;
  updated: string;
  owner: "morten" | "agent" | "human";
  summary: string;
  tags: string[];
  keywords: string[];
  links: MemoryLinks;
  retention: MemoryRetention;
};
~~~

## 10.3 Parsed note

~~~ts
export type ParsedMemoryNote = {
  frontmatter: MemoryFrontmatter;
  body: string;
  absolutePath: string;
  relativePath: string;
  contentHash: string;
  mtimeMs: number;
  headings: MemoryHeading[];
  markdownLinks: MemoryLink[];
  wikilinks: MemoryLink[];
};

export type MemoryHeading = {
  level: number;
  title: string;
  lineStart: number;
  lineEnd: number;
};

export type MemoryLink = {
  kind: "frontmatter" | "markdown" | "wikilink";
  sourceId: string;
  target: string;
  raw: string;
  relation?: string;
};
~~~

## 10.4 Registry

~~~ts
export type NoteRegistryEntry = {
  id: string;
  type: MemoryType;
  repoSlug: string;
  path: string;
  title: string;
  status: MemoryStatus;
  created: string;
  updated: string;
  owner: string;
  summary: string;
  tags: string[];
  keywords: string[];
  retention: MemoryRetention;
  outboundLinks: string[];
  inboundLinks: string[];
  contentHash: string;
  mtimeMs: number;
  chunkIds: string[];
  validation: {
    valid: boolean;
    errors: ValidationError[];
  };
};

export type NoteRegistry = {
  schemaVersion: 1;
  generatedAt: string;
  repoRoot: string;
  vaultRoot: string;
  notes: NoteRegistryEntry[];
};
~~~

## 10.5 Chunk

~~~ts
export type MemoryChunk = {
  id: string;
  noteId: string;
  noteType: MemoryType;
  repoSlug: string;
  sourceFile: string;
  heading: string;
  headingLevel: number;
  chunkIndex: number;
  text: string;
  summary: string | null;
  tags: string[];
  keywords: string[];
  status: MemoryStatus;
  contentHash: string;
  estimatedTokens: number;
};
~~~

## 10.6 Query classification

~~~ts
export type QueryIntent =
  | "repo_overview"
  | "architecture_question"
  | "implementation_question"
  | "task_lookup"
  | "session_lookup"
  | "decision_lookup"
  | "spec_lookup"
  | "cleanup_request"
  | "write_memory"
  | "unknown";

export type QueryClassification = {
  intent: QueryIntent;
  confidence: number;
  needsRag: boolean;
  needsCodeSearch: boolean;
  needsExternalResearch: boolean;
  preferredTypes: MemoryType[];
  excludedStatuses: MemoryStatus[];
  includeHistorical: boolean;
  reason: string;
};
~~~

## 10.7 Retrieval plan

~~~ts
export type RetrievalPlan = {
  originalQuery: string;
  normalizedQuery: string;
  expandedQueries: string[];
  exactLookups: string[];
  preferredTypes: MemoryType[];
  metadataFilters: {
    repoSlug?: string;
    typeIn?: MemoryType[];
    statusIn?: MemoryStatus[];
    statusNotIn?: MemoryStatus[];
    tagsAny?: string[];
    keywordsAny?: string[];
  };
  useLexical: boolean;
  useVector: boolean;
  useGraphExpansion: boolean;
  maxCandidates: number;
  maxContextTokens: number;
};
~~~

## 10.8 Retrieval candidate and score

~~~ts
export type RetrievalScore = {
  exact: number;
  lexical: number;
  vector: number;
  metadata: number;
  graph: number;
  recency: number;
  status: number;
  rerank: number | null;
  final: number;
};

export type RetrievalCandidate = {
  chunkId: string;
  noteId: string;
  sourceFile: string;
  heading: string;
  noteType: MemoryType;
  status: MemoryStatus;
  score: RetrievalScore;
  matchReasons: string[];
  graphDistance: number | null;
  text: string;
  estimatedTokens: number;
};
~~~

## 10.9 Context bundle

~~~ts
export type ContextBundle = {
  query: string;
  plan: RetrievalPlan;
  selected: RetrievalCandidate[];
  omitted: RetrievalCandidate[];
  references: ContextReference[];
  estimatedTokens: number;
  tokenBudget: number;
  truncated: boolean;
  trace: RetrievalTrace;
};

export type ContextReference = {
  noteId: string;
  chunkId: string;
  sourceFile: string;
  heading: string;
  noteType: MemoryType;
  status: MemoryStatus;
  finalScore: number;
};

export type RetrievalTrace = {
  exactMatches: number;
  lexicalCandidates: number;
  vectorCandidates: number;
  graphExpandedCandidates: number;
  fusedCandidates: number;
  rerankedCandidates: number;
  selectedCandidates: number;
  warnings: string[];
};
~~~

## 10.10 Write decision

~~~ts
export type WriteDecision = {
  shouldWrite: boolean;
  type: MemoryType | null;
  confidence: number;
  titleSuggestion: string | null;
  statusSuggestion: MemoryStatus | null;
  reason: string;
  dedupeQuery: string | null;
  retention: MemoryRetention | null;
  requiredTemplate: string | null;
  candidateDuplicates: DedupeCandidate[];
};

export type DedupeCandidate = {
  noteId: string;
  path: string;
  title: string;
  type: MemoryType;
  status: MemoryStatus;
  similarity: number;
  reason: string;
};
~~~

## 10.11 Cleanup report

~~~ts
export type CleanupReport = {
  generatedAt: string;
  duplicateNotes: DuplicateNoteFinding[];
  staleTodos: StaleTodoFinding[];
  sessionsToSummarize: SessionSummaryFinding[];
  orphanNotes: OrphanNoteFinding[];
  oversizedNotes: OversizedNoteFinding[];
  completedSpecsToArchive: CompletedSpecFinding[];
  supersededArchitectureRecords: SupersededAdrFinding[];
  invalidFrontmatter: ValidationError[];
  generatedFilesToDelete: string[];
  sourceMutationsProposed: ProposedSourceMutation[];
};
~~~

---

# Part 11: CLI API design

## 11.1 `rag:doctor`

Purpose:

Run all cheap health checks and report whether memory is usable.

Command:

~~~bash
pnpm --filter @playground/obsidian-memory rag:doctor
~~~

Output:

~~~json
{
  "ok": true,
  "vaultExists": true,
  "ragDirExists": true,
  "noteCount": 42,
  "validNoteCount": 42,
  "invalidNoteCount": 0,
  "duplicateIds": [],
  "brokenLinks": [],
  "warnings": []
}
~~~

Acceptance:

- exits `0` when healthy
- exits non-zero when invalid frontmatter or duplicate IDs exist
- does not require vector index to exist
- gives actionable fix hints

## 11.2 `rag:index`

Purpose:

Build generated indexes from `vault/`.

Command:

~~~bash
pnpm --filter @playground/obsidian-memory rag:index --json
~~~

Output:

~~~json
{
  "ok": true,
  "notes": 42,
  "chunks": 127,
  "updatedNotes": 3,
  "skippedNotes": 39,
  "indexes": {
    "manifest": ".rag/manifest.json",
    "registry": ".rag/note-registry.json",
    "chunks": ".rag/chunks.json",
    "lexical": ".rag/lexical-index.json",
    "vector": ".rag/vector-index.json",
    "graph": ".rag/graph-index.json",
    "diagnostics": ".rag/diagnostics.json"
  }
}
~~~

Acceptance:

- produces deterministic indexes
- preserves source notes
- validates before writing indexes unless `--allow-invalid` is explicitly used
- uses content hash, not only mtime, to detect changes

## 11.3 `rag:query`

Purpose:

Retrieve context for a user/agent query.

Command:

~~~bash
pnpm --filter @playground/obsidian-memory rag:query \
  --query "Why is .rag generated instead of source of truth?" \
  --explain \
  --budget 1200
~~~

Output:

~~~json
{
  "query": "Why is .rag generated instead of source of truth?",
  "classification": {
    "intent": "architecture_question",
    "preferredTypes": ["architecture-record", "repo-home", "spec"],
    "excludedStatuses": ["archived", "superseded"]
  },
  "plan": {
    "normalizedQuery": "rag generated source of truth vault architecture decision",
    "expandedQueries": [".rag generated output", "vault source of truth", "RAG architecture decision"]
  },
  "context": {
    "selectedCount": 3,
    "estimatedTokens": 942,
    "references": []
  },
  "trace": {
    "lexicalCandidates": 12,
    "vectorCandidates": 10,
    "graphExpandedCandidates": 4,
    "rerankedCandidates": 8
  }
}
~~~

Acceptance:

- supports `--repo-slug`
- supports `--type`
- supports `--status`
- supports `--include-archived`
- supports `--explain`
- excludes archived/superseded by default
- returns match reasons

## 11.4 `rag:classify`

Purpose:

Classify a request and decide retrieval/write strategy.

Command:

~~~bash
pnpm --filter @playground/obsidian-memory rag:classify \
  --input "We decided to use hybrid retrieval instead of lexical-only search"
~~~

Output:

~~~json
{
  "request": {
    "intent": "write_memory",
    "needsRag": true,
    "preferredTypes": ["architecture-record"]
  },
  "write": {
    "shouldWrite": true,
    "type": "architecture-record",
    "confidence": 0.94,
    "reason": "This is a durable tooling and architecture decision.",
    "dedupeQuery": "hybrid retrieval lexical-only search architecture decision"
  }
}
~~~

Acceptance:

- returns request classification
- returns write decision when appropriate
- includes reason and confidence
- never writes files

## 11.5 `rag:write`

Purpose:

Create a valid memory note from a classified write.

Command:

~~~bash
pnpm --filter @playground/obsidian-memory rag:write \
  --type architecture-record \
  --title "Use hybrid retrieval for repo memory" \
  --status accepted \
  --body ./tmp/adr-body.md
~~~

Output:

~~~json
{
  "ok": true,
  "noteId": "mem-20260430-hybrid-retrieval-repo-memory",
  "path": "vault/00 Repositories/playground/architecture/mem-20260430-hybrid-retrieval-repo-memory.md",
  "validated": true,
  "duplicates": []
}
~~~

Acceptance:

- validates required frontmatter
- refuses duplicate IDs
- warns on likely duplicates
- renders from correct template
- updates `updated` date
- does not index automatically unless `--index` is passed

## 11.6 `rag:clean --dry-run`

Purpose:

Report cleanup candidates.

Command:

~~~bash
pnpm --filter @playground/obsidian-memory rag:clean --dry-run
~~~

Output:

~~~json
{
  "duplicateNotes": [],
  "staleTodos": [
    {
      "noteId": "mem-20260401-add-retrieval-test",
      "path": "vault/00 Repositories/playground/todos/mem-20260401-add-retrieval-test.md",
      "ageDays": 29,
      "reviewAfter": "2026-04-15",
      "suggestedAction": "review-or-mark-done"
    }
  ],
  "sessionsToSummarize": [],
  "orphanNotes": [],
  "oversizedNotes": [],
  "completedSpecsToArchive": [],
  "generatedFilesToDelete": []
}
~~~

Acceptance:

- never mutates source notes
- can delete generated files only with `--apply-generated`
- outputs JSON by default or with `--json`
- provides suggested action for every finding

## 11.7 `rag:verify`

Purpose:

Verify memory integrity and retrieval behavior.

Command:

~~~bash
pnpm --filter @playground/obsidian-memory rag:verify
~~~

Acceptance:

- validates frontmatter
- validates links
- validates generated indexes exist
- runs golden retrieval fixtures
- fails when retrieval regressions occur

## 11.8 `test:retrieval`

Purpose:

Run focused retrieval quality tests.

Command:

~~~bash
pnpm --filter @playground/obsidian-memory test:retrieval
~~~

Acceptance:

- golden queries pass
- expected note types appear
- expected top results appear
- archived/superseded notes are excluded unless requested
- retrieval trace includes match reasons

---

# Part 12: MCP API design

The MCP server should expose agent-safe tools.

## 12.1 `memory.query`

Input:

~~~json
{
  "query": "What is the current RAG architecture?",
  "repoSlug": "playground",
  "limit": 8,
  "budget": 1200,
  "includeArchived": false,
  "explain": true
}
~~~

Output:

~~~json
{
  "context": {},
  "references": [],
  "trace": {}
}
~~~

## 12.2 `memory.classify`

Input:

~~~json
{
  "input": "We decided specs should live in RAG."
}
~~~

Output:

~~~json
{
  "request": {},
  "write": {}
}
~~~

## 12.3 `memory.propose_write`

Creates a proposed note body and frontmatter but does not commit automatically unless explicitly allowed.

Input:

~~~json
{
  "type": "architecture-record",
  "title": "Specs live inside RAG",
  "body": "...",
  "status": "accepted",
  "dryRun": true
}
~~~

Output:

~~~json
{
  "wouldWrite": true,
  "path": "vault/00 Repositories/playground/architecture/mem-20260430-specs-live-inside-rag.md",
  "content": "---\nid: ...\n---\n...",
  "validation": { "valid": true, "errors": [] },
  "duplicates": []
}
~~~

## 12.4 `memory.clean_dry_run`

Input:

~~~json
{
  "repoSlug": "playground"
}
~~~

Output:

~~~json
{
  "report": {}
}
~~~

---

# Part 13: TDD and spec-driven development rules

## 13.1 Required TDD loop

Every implementation story must follow:

~~~text
1. Read this spec section.
2. Write or update tests that express expected behavior.
3. Run tests and confirm they fail for the right reason.
4. Implement the smallest code change.
5. Run tests again.
6. Refactor while keeping tests green.
7. Add a session note if substantial work occurred.
8. Update ADR/spec only if durable design changed.
~~~

## 13.2 Test categories

### Schema tests

Validate frontmatter parsing, required fields, invalid fields, status/type compatibility, and nested metadata.

### Registry tests

Validate note discovery, stable IDs, duplicate detection, inbound/outbound links, and content hashes.

### Index tests

Validate chunk generation, deterministic output, generated file structure, and skipped directories.

### Query planner tests

Validate intent classification, preferred note types, status filters, expanded queries, and historical inclusion.

### Retrieval tests

Validate top results, note type priority, archived exclusion, graph expansion, score traces, and token budgets.

### Writer tests

Validate write classification, template rendering, dedupe detection, path generation, and frontmatter correctness.

### Cleaner tests

Validate stale todos, old sessions, duplicate notes, orphan notes, oversized notes, completed specs, and generated cleanup.

### Doctor tests

Validate end-to-end health checks and exit behavior.

---

# Part 14: Golden retrieval fixtures

Create fixture vault notes under:

~~~text
tools/obsidian-memory/tests/fixtures/vault-valid/
~~~

## 14.1 Fixture: repo home

~~~md
---
id: "mem-20260430-playground-home"
type: "repo-home"
repo_slug: "playground"
title: "Playground repo home"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "morten"
summary: "Canonical overview of the playground repository."
tags: ["repo", "overview"]
keywords: ["playground", "monorepo", "rag", "memory"]
links:
  parents: []
  children: ["mem-20260430-rag-rebuild-spec"]
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: null
  expires_after: null
  keep: true
---

# Playground repo home

## What this repo is

The repo is a pnpm and Turborepo monorepo with app surfaces, shared packages, and local agent tooling.

## Memory system

The repository uses a vault for durable memory and generated RAG indexes for retrieval.
~~~

## 14.2 Fixture: accepted ADR

~~~md
---
id: "mem-20260430-generated-rag-indexes"
type: "architecture-record"
repo_slug: "playground"
title: "Use generated RAG indexes"
status: "accepted"
created: "2026-04-30"
updated: "2026-04-30"
owner: "morten"
summary: "The vault is source of truth and `.rag/` is generated retrieval output."
tags: ["rag", "architecture"]
keywords: ["vault", ".rag", "generated", "source of truth"]
links:
  parents: []
  children: []
  related: ["mem-20260430-rag-rebuild-spec"]
  supersedes: []
  superseded_by: []
retention:
  review_after: null
  expires_after: null
  keep: true
---

# Use generated RAG indexes

## Context

Agents need durable memory, but generated retrieval files must be disposable.

## Decision

The vault is the source of truth. `.rag/` is generated output.

## Consequences

Agents may regenerate `.rag/` but must not treat it as durable memory.
~~~

## 14.3 Fixture: active spec

~~~md
---
id: "mem-20260430-rag-rebuild-spec"
type: "spec"
repo_slug: "playground"
title: "Rebuild RAG memory system"
status: "active"
created: "2026-04-30"
updated: "2026-04-30"
owner: "morten"
summary: "Rebuild the repository RAG as a typed, self-cleaning memory system."
tags: ["rag", "memory", "spec"]
keywords: ["hybrid retrieval", "self-cleaning", "schema", "registry"]
links:
  parents: ["mem-20260430-playground-home"]
  children: []
  related: ["mem-20260430-generated-rag-indexes"]
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-30"
  expires_after: null
  keep: true
---

# Rebuild RAG memory system

## Goal

Create a typed, governed, query-routed, self-cleaning memory system for repo agents.

## Acceptance criteria

- Notes have strict frontmatter.
- Retrieval uses hybrid search.
- Cleanup reports stale memory.
~~~

## 14.4 Fixture: stale todo

~~~md
---
id: "mem-20260401-add-archived-filter-test"
type: "todo"
repo_slug: "playground"
title: "Add archived filter retrieval test"
status: "active"
created: "2026-04-01"
updated: "2026-04-01"
owner: "agent"
summary: "Add a retrieval test proving archived notes are excluded by default."
tags: ["test", "retrieval"]
keywords: ["archived", "filter", "retrieval"]
links:
  parents: ["mem-20260430-rag-rebuild-spec"]
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-04-15"
  expires_after: null
  keep: false
---

# Add archived filter retrieval test

## Task

Add a test fixture proving archived notes do not appear in default retrieval.

## Done when

The retrieval test fails before implementation and passes after archived status filtering is added.
~~~

## 14.5 Golden query examples

~~~yaml
- name: "architecture question prefers accepted ADR"
  query: "Why is .rag generated instead of source of truth?"
  expectedTopNoteId: "mem-20260430-generated-rag-indexes"
  expectedTypes: ["architecture-record", "repo-home", "spec"]
  excludedStatuses: ["archived", "superseded"]

- name: "spec lookup finds active RAG rebuild spec"
  query: "Find the spec for rebuilding RAG"
  expectedTopNoteId: "mem-20260430-rag-rebuild-spec"
  expectedTypes: ["spec"]

- name: "task lookup finds active todo"
  query: "What retrieval tests still need doing?"
  expectedTypes: ["todo", "spec"]
  mustIncludeNoteIds: ["mem-20260401-add-archived-filter-test"]

- name: "overview includes repo home"
  query: "What is this repo memory system?"
  expectedTypes: ["repo-home", "architecture-record", "spec"]
  mustIncludeNoteIds: ["mem-20260430-playground-home"]
~~~

---

# Part 15: Stories, acceptance criteria, and tests

## Story 0: Establish fixture vaults and test harness

### User story

As an implementation agent, I need stable test fixtures so I can prove memory behavior before changing the production vault.

### Acceptance criteria

- Given a valid fixture vault, tests can index it without touching the real repo vault.
- Given an invalid fixture vault, tests can assert expected validation errors.
- Given golden query fixtures, retrieval tests can compare expected note IDs and types.
- Tests run through Node test or the existing package test approach.

### Tests to write first

~~~text
schema fixtures load successfully
invalid fixtures produce known validation errors
golden query fixture parser loads expected cases
fixture vault path can override default vault path
~~~

### Implementation notes

Add fixture helpers that accept `vaultPath` and `outputDir`. Never require tests to write into the real `.rag/` directory.

---

## Story 1: Replace custom frontmatter parsing with real YAML parsing

### User story

As an agent, I need nested frontmatter to parse correctly so links and retention metadata can be structured.

### Acceptance criteria

- Given nested `links` and `retention`, parser returns nested objects.
- Given scalar fields, parser returns strings/booleans/arrays consistently.
- Given malformed YAML, parser returns a validation error with file path.
- Given missing frontmatter, parser reports required frontmatter missing.

### Tests to write first

~~~text
parse nested links object
parse nested retention object
parse array tags and keywords
reject malformed YAML
reject missing frontmatter
~~~

### API

~~~ts
export function parseMemoryMarkdown(input: {
  path: string;
  content: string;
}): ParsedMemoryNote | ParseError;
~~~

### Real example

Input frontmatter:

~~~yaml
links:
  parents: ["mem-20260430-playground-home"]
  children: []
  related: ["mem-20260430-generated-rag-indexes"]
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-30"
  expires_after: null
  keep: true
~~~

Expected parsed value:

~~~json
{
  "links": {
    "parents": ["mem-20260430-playground-home"],
    "children": [],
    "related": ["mem-20260430-generated-rag-indexes"],
    "supersedes": [],
    "superseded_by": []
  },
  "retention": {
    "review_after": "2026-05-30",
    "expires_after": null,
    "keep": true
  }
}
~~~

---

## Story 2: Add strict frontmatter schema validation

### User story

As an agent, I need invalid memory notes to fail fast so retrieval does not depend on ambiguous metadata.

### Acceptance criteria

- Missing required fields fail validation.
- Invalid `type` fails validation.
- Invalid `status` fails validation.
- Invalid status/type combination fails validation.
- Invalid date format fails validation.
- Empty title or summary fails validation.
- Duplicate tags/keywords are normalized or rejected.

### Tests to write first

~~~text
valid spec note passes
missing id fails
invalid type fails
invalid status fails
accepted todo fails
empty summary fails
invalid created date fails
~~~

### API

~~~ts
export function validateFrontmatter(input: unknown): ValidationResult<MemoryFrontmatter>;
~~~

### Real example

Invalid note:

~~~yaml
id: "mem-20260430-example"
type: "todo"
status: "accepted"
~~~

Expected error:

~~~json
{
  "code": "frontmatter.invalid_status_for_type",
  "message": "Status 'accepted' is only valid for architecture-record notes."
}
~~~

---

## Story 3: Build note registry

### User story

As an agent, I need a note-level registry so memory can be reasoned about before chunk retrieval.

### Acceptance criteria

- Registry contains one entry per valid note.
- Registry includes ID, type, status, title, summary, dates, path, content hash, links, and chunk IDs.
- Duplicate note IDs fail registry generation.
- Broken frontmatter links are reported.
- Inbound links are computed from outbound links.
- Registry output is deterministic.

### Tests to write first

~~~text
build registry from valid fixture vault
registry includes one entry per note
duplicate ids fail
broken frontmatter links fail
inbound links are computed
registry is deterministic across runs
~~~

### API

~~~ts
export function buildNoteRegistry(input: {
  vaultPath: string;
  repoSlug?: string;
}): Promise<NoteRegistryBuildResult>;
~~~

### Real example

For note A:

~~~yaml
id: "mem-a"
links:
  related: ["mem-b"]
~~~

And note B:

~~~yaml
id: "mem-b"
links:
  related: []
~~~

Expected registry:

~~~json
{
  "notes": [
    {
      "id": "mem-a",
      "outboundLinks": ["mem-b"],
      "inboundLinks": []
    },
    {
      "id": "mem-b",
      "outboundLinks": [],
      "inboundLinks": ["mem-a"]
    }
  ]
}
~~~

---

## Story 4: Generate chunks from validated notes

### User story

As an agent, I need deterministic retrieval chunks derived from valid notes.

### Acceptance criteria

- Notes chunk by headings.
- Chunk text includes essential metadata.
- Chunk IDs include note ID, chunk index, and content hash prefix.
- Empty chunks are skipped.
- Oversized sections are split without losing headings.
- Chunk output is deterministic.

### Tests to write first

~~~text
single note creates overview chunk
h2 sections create separate chunks
empty sections are skipped
chunk id includes note id
oversized section splits safely
chunk output is deterministic
~~~

### API

~~~ts
export function buildChunks(input: {
  notes: ParsedMemoryNote[];
  maxChunkTokens?: number;
}): MemoryChunk[];
~~~

---

## Story 5: Split generated indexes

### User story

As an agent, I need separate generated indexes so each layer can be inspected, rebuilt, and tested independently.

### Acceptance criteria

- `rag:index` writes `manifest.json`.
- `rag:index` writes `note-registry.json`.
- `rag:index` writes `chunks.json`.
- `rag:index` writes `lexical-index.json`.
- `rag:index` writes `graph-index.json`.
- `rag:index` writes `diagnostics.json`.
- Vector index can be disabled initially with a clear placeholder.

### Tests to write first

~~~text
index writes expected files
index refuses invalid vault by default
index can write to custom output dir
manifest lists generated files
rag dir can be deleted and rebuilt
~~~

### API

~~~ts
export async function buildMemoryIndexes(input: {
  vaultPath: string;
  outputDir: string;
  repoSlug?: string;
  force?: boolean;
  includeVector?: boolean;
}): Promise<IndexBuildSummary>;
~~~

---

## Story 6: Implement query classifier

### User story

As an agent, I need queries classified before retrieval so the right memory types are searched first.

### Acceptance criteria

- Architecture questions prefer `architecture-record`, `repo-home`, and `spec`.
- Spec questions prefer `spec` and related ADRs.
- Task questions prefer `todo` and active specs.
- Session questions prefer recent `session` notes.
- Cleanup questions prefer registry/cleanup path and do not need normal retrieval first.
- Historical questions include archived/superseded notes.

### Tests to write first

~~~text
classify architecture question
classify spec lookup
classify todo lookup
classify session lookup
classify cleanup request
classify historical request includes archived
~~~

### API

~~~ts
export function classifyQuery(input: {
  query: string;
  repoSlug?: string;
}): QueryClassification;
~~~

### Real examples

Input:

~~~text
Why do specs live in the RAG?
~~~

Expected:

~~~json
{
  "intent": "architecture_question",
  "preferredTypes": ["architecture-record", "repo-home", "spec"],
  "excludedStatuses": ["archived", "superseded"]
}
~~~

Input:

~~~text
What did the last session do?
~~~

Expected:

~~~json
{
  "intent": "session_lookup",
  "preferredTypes": ["session"],
  "excludedStatuses": ["archived", "superseded"]
}
~~~

---

## Story 7: Implement retrieval planner and query rewriting

### User story

As an agent, I need a retrieval plan that turns natural language into search strategy.

### Acceptance criteria

- Planner receives query classification.
- Planner creates normalized query.
- Planner creates expanded query variants.
- Planner sets metadata filters.
- Planner decides whether graph expansion is needed.
- Planner decides whether archived/superseded notes are excluded.

### Tests to write first

~~~text
planner expands architecture query
planner filters by preferred types
planner excludes archived by default
planner includes archived for history query
planner uses graph expansion for architecture and spec queries
~~~

### API

~~~ts
export function planRetrieval(input: {
  query: string;
  classification: QueryClassification;
  options?: RetrievalOptions;
}): RetrievalPlan;
~~~

---

## Story 8: Improve lexical retrieval

### User story

As an agent, I need reliable lexical retrieval for exact repo terms, filenames, commands, and note metadata.

### Acceptance criteria

- Lexical retrieval uses deduped query tokens.
- Exact phrase matches get a boost.
- Path/title/keyword/tag matches get separate scores.
- Archived/superseded notes are excluded by filter before scoring unless requested.
- Lexical search returns score components and reasons.

### Tests to write first

~~~text
exact title match scores highly
keyword match adds reason
path match adds reason
archived note excluded by default
superseded note excluded by default
repeated query tokens do not inflate score
~~~

### API

~~~ts
export function lexicalSearch(input: {
  query: string;
  chunks: MemoryChunk[];
  plan: RetrievalPlan;
}): RetrievalCandidate[];
~~~

---

## Story 9: Add vector retrieval placeholder, then implementation

### User story

As an agent, I need semantic retrieval for concepts that do not share exact vocabulary.

### Acceptance criteria for placeholder

- Vector retrieval can be disabled.
- Query output explains when vector search is unavailable.
- Tests can run without model downloads.

### Acceptance criteria for implementation

- Embeddings are generated for chunks.
- Vector index is stored under `.rag/vector-index.json` or equivalent local generated file.
- Query embeddings are compared to chunk embeddings.
- Vector candidates include score and reasons.
- Vector retrieval can be skipped in CI if necessary.

### Tests to write first

~~~text
vector disabled returns empty candidates with warning
vector index shape is valid
vector candidates merge with lexical candidates
~~~

### API

~~~ts
export interface EmbeddingProvider {
  embedText(input: string): Promise<number[]>;
  embedBatch(inputs: string[]): Promise<number[][]>;
}

export function vectorSearch(input: {
  query: string;
  vectorIndex: VectorIndex;
  provider: EmbeddingProvider;
  plan: RetrievalPlan;
}): Promise<RetrievalCandidate[]>;
~~~

---

## Story 10: Implement graph index and expansion

### User story

As an agent, I need related notes to be found through links, not only text similarity.

### Acceptance criteria

- Graph index contains nodes for all registry notes.
- Graph index contains edges for frontmatter links.
- Markdown links and Obsidian wikilinks are parsed where possible.
- Graph expansion adds related notes after initial retrieval.
- Graph distance is included in retrieval candidates.
- Orphan notes are detectable.

### Tests to write first

~~~text
graph has node per registry note
frontmatter related creates edge
parent child links create edges
supersedes creates edge
inbound links are reflected
graph expansion adds related spec to ADR result
orphan notes are detected
~~~

### API

~~~ts
export function buildGraphIndex(input: {
  registry: NoteRegistry;
  notes: ParsedMemoryNote[];
}): GraphIndex;

export function expandCandidatesByGraph(input: {
  candidates: RetrievalCandidate[];
  graph: GraphIndex;
  chunks: MemoryChunk[];
  maxDistance: number;
}): RetrievalCandidate[];
~~~

---

## Story 11: Implement rank fusion

### User story

As an agent, I need lexical, vector, and graph candidates merged without over-trusting one scorer.

### Acceptance criteria

- Candidates from multiple retrieval methods are merged by chunk or note ID.
- Rank fusion rewards candidates that appear in multiple lists.
- Score components are preserved.
- Final ranking is deterministic.

### Tests to write first

~~~text
candidate appearing in lexical and vector outranks lexical-only candidate
fusion preserves match reasons
fusion deterministic with ties
fusion dedupes same chunk id
~~~

### API

~~~ts
export function fuseRanks(input: {
  lexical: RetrievalCandidate[];
  vector: RetrievalCandidate[];
  graph: RetrievalCandidate[];
  k?: number;
}): RetrievalCandidate[];
~~~

---

## Story 12: Implement reranking

### User story

As an agent, I need final candidates reranked by note type, status, recency, and semantic relevance.

### Acceptance criteria

- Accepted ADRs receive status boost for architecture queries.
- Active specs receive boost for implementation queries.
- Recent sessions receive boost for session queries.
- Done todos are lower than active todos.
- Archived/superseded notes are penalized unless explicitly requested.
- Rerank reasons are included.

### Tests to write first

~~~text
accepted ADR outranks session for architecture query
active todo outranks done todo for task query
recent session outranks old session for session query
archived note penalized when included
rerank reasons are emitted
~~~

### API

~~~ts
export function rerankCandidates(input: {
  candidates: RetrievalCandidate[];
  plan: RetrievalPlan;
  now: Date;
}): RetrievalCandidate[];
~~~

---

## Story 13: Implement context assembly

### User story

As an agent, I need selected context to fit a token budget and preserve source attribution.

### Acceptance criteria

- Context bundle respects token budget.
- First item does not exceed budget without warning.
- References include note ID, path, heading, type, status, score.
- Omitted candidates are reported when relevant.
- Source diversity prevents one long note from crowding out all others.

### Tests to write first

~~~text
context fits token budget
oversized first chunk is truncated or warned
references include source attribution
omitted candidates are reported
source diversity limits repeated note chunks
~~~

### API

~~~ts
export function assembleContext(input: {
  query: string;
  plan: RetrievalPlan;
  candidates: RetrievalCandidate[];
  tokenBudget: number;
  maxChunksPerNote?: number;
}): ContextBundle;
~~~

---

## Story 14: Implement write classifier

### User story

As an agent, I need a deterministic decision about whether information should become an ADR, spec, session, todo, investigation, reference, glossary entry, repo-home update, or no write.

### Acceptance criteria

- Durable architecture decisions classify as `architecture-record`.
- Multi-step future work classifies as `spec`.
- Small actions classify as `todo`.
- Bounded work logs classify as `session`.
- Research without decision classifies as `investigation`.
- Stable support material classifies as `reference`.
- Definitions classify as `glossary`.
- Transient questions classify as no write.

### Tests to write first

~~~text
classify architecture decision write
classify spec write
classify todo write
classify session write
classify investigation write
classify reference write
classify glossary write
classify transient question as no write
~~~

### API

~~~ts
export function classifyMemoryWrite(input: {
  text: string;
  queryContext?: ContextBundle;
  repoSlug?: string;
}): WriteDecision;
~~~

---

## Story 15: Implement dedupe before write

### User story

As an agent, I need likely duplicate notes reported before creating new memory.

### Acceptance criteria

- Dedupe searches by title similarity.
- Dedupe searches by summary similarity.
- Dedupe searches by keywords/tags.
- Dedupe can use vector similarity when available.
- Dedupe blocks exact duplicate IDs.
- Dedupe warns, not blocks, likely duplicates unless exact identity conflict.

### Tests to write first

~~~text
exact duplicate id blocks write
similar title warns
similar summary warns
same parent spec and same task warns
unrelated note does not warn
~~~

### API

~~~ts
export function findDuplicateMemory(input: {
  proposed: ProposedMemoryNote;
  registry: NoteRegistry;
  chunks: MemoryChunk[];
}): DedupeCandidate[];
~~~

---

## Story 16: Implement memory writer and templates

### User story

As an agent, I need to create valid memory notes from templates.

### Acceptance criteria

- `rag:write` creates notes in the correct folder.
- Generated IDs are slugged and date-prefixed.
- Templates include required sections.
- Created notes pass validation.
- Writer refuses invalid type/status combinations.
- Writer supports dry run.

### Tests to write first

~~~text
write spec note from template
write ADR note from template
write todo note from template
write session note from template
invalid type fails
invalid status for type fails
dry run does not write file
~~~

### API

~~~ts
export function writeMemoryNote(input: {
  type: MemoryType;
  title: string;
  status?: MemoryStatus;
  body: string;
  repoSlug: string;
  dryRun?: boolean;
}): Promise<WriteMemoryResult>;
~~~

---

## Story 17: Implement self-cleaning dry run

### User story

As an agent, I need cleanup findings so memory does not grow endlessly.

### Acceptance criteria

- Stale active todos are reported after `review_after`.
- Sessions older than threshold are reported for summarization.
- Duplicate notes are reported.
- Orphan notes are reported.
- Oversized notes are reported.
- Done specs are reported for archiving.
- Superseded ADRs are reported.
- No source note is mutated.

### Tests to write first

~~~text
stale todo detected
fresh todo not detected
old session detected for summarization
linked session not deleted automatically
duplicate notes detected
orphan note detected
oversized note detected
done spec suggested for archive
superseded ADR reported
~~~

### API

~~~ts
export function buildCleanupReport(input: {
  registry: NoteRegistry;
  chunks: MemoryChunk[];
  graph: GraphIndex;
  now: Date;
  options?: CleanupOptions;
}): CleanupReport;
~~~

---

## Story 18: Implement generated cleanup apply mode

### User story

As an agent, I need to safely delete generated `.rag/` files and rebuild them.

### Acceptance criteria

- `rag:clean --apply-generated` deletes only generated files listed in manifest.
- Source vault files are never deleted.
- After generated cleanup, `rag:index` can rebuild everything.
- Command requires explicit flag.

### Tests to write first

~~~text
apply-generated deletes manifest-listed generated files
apply-generated refuses to delete vault files
apply-generated followed by index succeeds
~~~

---

## Story 19: Implement `rag:doctor`

### User story

As an agent, I need one health check command before and after memory changes.

### Acceptance criteria

- Checks vault existence.
- Checks required folders.
- Checks frontmatter validity.
- Checks duplicate IDs.
- Checks broken links.
- Checks generated indexes if present.
- Checks retrieval fixtures if requested.
- Returns non-zero exit on critical failure.

### Tests to write first

~~~text
doctor passes valid fixture vault
doctor fails missing vault
doctor fails duplicate ids
doctor fails broken links
doctor warns missing generated indexes
doctor JSON output is stable
~~~

---

## Story 20: Update MCP server

### User story

As an external agent, I need safe MCP tools for query, classification, write proposal, and cleanup dry run.

### Acceptance criteria

- MCP exposes `memory.query`.
- MCP exposes `memory.classify`.
- MCP exposes `memory.propose_write`.
- MCP exposes `memory.clean_dry_run`.
- MCP tools do not mutate source notes unless explicitly designed and approved.
- MCP output includes source references.

### Tests to write first

~~~text
mcp query returns context bundle
mcp classify returns write decision
mcp propose_write dry run returns valid content
mcp clean_dry_run returns report
~~~

---

## Story 21: Migrate existing vault notes

### User story

As a repo maintainer, I need existing memory notes to conform to the new schema without losing information.

### Acceptance criteria

- Migration dry-run reports notes missing required fields.
- Migration suggests IDs based on date/title/path.
- Migration suggests types based on path and content.
- Migration does not overwrite files without explicit flag.
- Migrated notes pass `rag:doctor`.

### Tests to write first

~~~text
migration dry run suggests missing ids
migration infers type from architecture folder
migration infers session from sessions folder
migration does not mutate without apply
migrated fixture passes validation
~~~

---

## Story 22: Update agent documentation

### User story

As a future agent, I need explicit operating instructions for when to read and write memory.

### Acceptance criteria

- `AGENTS.md` or equivalent includes RAG read rules.
- Agent docs include memory write decision tree.
- Agent docs include examples for ADR/spec/session/todo.
- Agent docs include cleanup guidance.
- Agent docs include required commands after memory changes.

### Required agent doc section

~~~md
## Repo memory rules

Before changing architecture, tooling, workflows, package boundaries, or conventions, query repo memory.

After substantial repo work, write a session note.

When a durable architecture decision is made, write or update an architecture record.

When future implementation requires multiple steps, write or update a spec.

When a small concrete action remains, write or update a todo.

Run `pnpm --filter @playground/obsidian-memory rag:verify` after memory changes.
~~~

---

# Part 16: Retrieval scoring design

## 16.1 Score components

Every candidate should expose separate score components.

~~~text
final_score =
  exact_score
  + lexical_score
  + vector_score
  + metadata_score
  + graph_score
  + recency_score
  + status_score
  + rerank_score
  - stale_penalty
  - duplicate_penalty
~~~

## 16.2 Default status scoring

~~~json
{
  "accepted": 12,
  "active": 8,
  "proposed": 2,
  "done": -1,
  "archived": -12,
  "superseded": -16
}
~~~

## 16.3 Default type boost by intent

### Architecture question

~~~json
{
  "architecture-record": 14,
  "repo-home": 8,
  "spec": 6,
  "session": 2,
  "todo": -2,
  "investigation": 3,
  "reference": 2,
  "glossary": 1
}
~~~

### Implementation question

~~~json
{
  "spec": 12,
  "architecture-record": 8,
  "session": 5,
  "todo": 4,
  "reference": 3,
  "repo-home": 3,
  "investigation": 2,
  "glossary": 1
}
~~~

### Task lookup

~~~json
{
  "todo": 14,
  "spec": 6,
  "session": 3,
  "architecture-record": 1,
  "repo-home": 1,
  "reference": 1,
  "investigation": 1,
  "glossary": 0
}
~~~

## 16.4 Recency scoring

Recency should depend on type.

- Sessions: strong recency boost.
- Todos: moderate recency boost, but stale active todos should be flagged for cleanup.
- ADRs: weak recency boost because accepted durable decisions should remain stable.
- Specs: active specs get status boost more than recency boost.
- References: weak recency boost, stronger stale review warnings.

---

# Part 17: Cleanup policy

## 17.1 Stale todo policy

A todo is stale when:

- `type = todo`
- `status = active`
- `retention.review_after` is before today

Suggested actions:

- mark done
- update review date
- convert to spec if too large
- archive if obsolete

## 17.2 Old session policy

A session should be summarized when:

- `type = session`
- older than 14 days
- not marked `keep = true`
- not already summarized

A session may be archived when:

- older than 60 days
- durable decisions have been extracted
- todos have been linked or closed

## 17.3 Duplicate policy

Potential duplicates are detected by:

- exact same title
- same normalized title
- similar summaries
- same parent links plus similar keywords
- vector similarity when available

Exact duplicate IDs fail validation.

Likely duplicate content creates cleanup finding.

## 17.4 Orphan policy

A note is orphaned when:

- it is not `repo-home`
- it has no inbound links
- it has no outbound links
- it is older than 7 days
- it is not tagged `keep`

Orphans are not automatically bad. They are review candidates.

## 17.5 Oversized note policy

A note is oversized when:

- estimated tokens exceed configured threshold
- it has multiple unrelated sections
- retrieval frequently selects only one section

Suggested action:

- split by memory type
- create child notes
- link from parent

## 17.6 Completed spec policy

A spec should be archived or marked done when:

- `type = spec`
- all acceptance criteria are met
- linked todos are done
- final session exists

## 17.7 Superseded ADR policy

An ADR should be marked superseded when:

- a newer accepted ADR lists it in `links.supersedes`
- it lists the newer ADR in `links.superseded_by`

Default retrieval excludes superseded ADRs unless the query asks for history.

---

# Part 18: Example end-to-end flows

## 18.1 Flow: user asks architecture question

User:

~~~text
Why is `.rag/` generated instead of the source of truth?
~~~

Agent flow:

1. Classify query as `architecture_question`.
2. Prefer `architecture-record`, `repo-home`, `spec`.
3. Exclude `archived` and `superseded`.
4. Plan expanded queries:
   - `.rag generated output`
   - `vault source of truth`
   - `RAG architecture decision`
5. Retrieve accepted ADR.
6. Expand graph to related spec and repo home.
7. Assemble context.
8. Answer with sources.
9. No memory write unless the answer reveals a missing durable decision.

Expected top result:

~~~text
mem-20260430-generated-rag-indexes
~~~

## 18.2 Flow: user requests new work

User:

~~~text
Build cleanup so memory does not grow forever.
~~~

Agent flow:

1. Classify request as `implementation_question` and potential `write_memory`.
2. Query existing specs and cleanup todos.
3. If no active spec exists, classify write as `spec`.
4. Dedupe against registry.
5. Create proposed spec with acceptance criteria.
6. Do not start coding until spec is accepted or user asked for implementation directly.

Expected write decision:

~~~json
{
  "shouldWrite": true,
  "type": "spec",
  "reason": "The request describes multi-step future implementation."
}
~~~

## 18.3 Flow: agent completes substantial implementation work

Agent completed:

- added schema validation
- added note registry
- added tests
- found migration issue

Agent flow:

1. Classify write as `session`.
2. Create session note.
3. If migration issue is small, create todo.
4. If migration issue is large, update spec or create new spec.
5. Run `rag:verify`.
6. Run `rag:index`.

Expected session sections:

~~~md
## Goal

## Actions taken

## Files touched

## Tests run

## Findings

## Decisions that need ADRs

## Todos created

## Next handoff
~~~

## 18.4 Flow: cleanup dry run

Command:

~~~bash
pnpm --filter @playground/obsidian-memory rag:clean --dry-run
~~~

Expected output:

~~~json
{
  "staleTodos": [
    {
      "noteId": "mem-20260401-add-archived-filter-test",
      "suggestedAction": "review-or-mark-done"
    }
  ],
  "sessionsToSummarize": [
    {
      "noteId": "mem-20260402-schema-work-session",
      "suggestedAction": "summarize-and-link-durable-decisions"
    }
  ],
  "sourceMutationsProposed": []
}
~~~

---

# Part 19: Templates

## 19.1 Architecture record template

~~~md
---
id: "mem-YYYYMMDD-short-slug"
type: "architecture-record"
repo_slug: "playground"
title: ""
status: "proposed"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
owner: "morten"
summary: ""
tags: []
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: null
  expires_after: null
  keep: true
---

# Title

## Context

## Decision

## Alternatives considered

## Consequences

## Follow-up actions
~~~

## 19.2 Spec template

~~~md
---
id: "mem-YYYYMMDD-short-slug"
type: "spec"
repo_slug: "playground"
title: ""
status: "active"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
owner: "morten"
summary: ""
tags: []
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "YYYY-MM-DD"
  expires_after: null
  keep: true
---

# Title

## Goal

## Non-goals

## Current state

## Proposed design

## API design

## Implementation plan

## Stories

## Acceptance criteria

## TDD plan

## Verification

## Open questions
~~~

## 19.3 Session template

~~~md
---
id: "mem-YYYYMMDD-session-short-slug"
type: "session"
repo_slug: "playground"
title: ""
status: "active"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
owner: "agent"
summary: ""
tags: []
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "YYYY-MM-DD"
  expires_after: "YYYY-MM-DD"
  keep: false
---

# Session title

## Goal

## Actions taken

## Files touched

## Tests run

## Findings

## Decisions that need ADRs

## Todos created

## Next handoff
~~~

## 19.4 Todo template

~~~md
---
id: "mem-YYYYMMDD-todo-short-slug"
type: "todo"
repo_slug: "playground"
title: ""
status: "active"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
owner: "morten"
summary: ""
tags: []
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "YYYY-MM-DD"
  expires_after: null
  keep: false
---

# Todo

## Task

## Why

## Done when

## Links
~~~

---

# Part 20: Migration plan

## 20.1 Migration phase 1: observe

Run:

~~~bash
pnpm --filter @playground/obsidian-memory rag:doctor --json
~~~

Expected result:

- report current note count
- report notes missing required fields
- report current inferred types
- no file changes

## 20.2 Migration phase 2: dry-run suggestions

Run:

~~~bash
pnpm --filter @playground/obsidian-memory rag:migrate --dry-run
~~~

Expected result:

- suggested IDs
- suggested types
- suggested statuses
- suggested paths
- suggested links if obvious

## 20.3 Migration phase 3: apply safe additions

Only after review:

- add missing IDs
- add missing required frontmatter
- preserve body content
- do not rewrite decisions
- do not archive notes automatically

## 20.4 Migration phase 4: verify

Run:

~~~bash
pnpm --filter @playground/obsidian-memory rag:doctor
pnpm --filter @playground/obsidian-memory rag:index
pnpm --filter @playground/obsidian-memory test:retrieval
~~~

---

# Part 21: Security and privacy

The RAG must not store:

- secrets
- tokens
- passwords
- private `.env` values
- personal credentials
- generated build output
- dependency caches
- private chat transcripts unless explicitly summarized and safe

The indexer must skip:

- `.obsidian/`
- `.trash/`
- templates if configured
- scripts if configured
- generated directories
- environment files
- lockfile caches if outside vault by accident

If a note appears to contain a secret, `rag:doctor` should warn.

Potential secret indicators:

- `API_KEY=`
- `SECRET=`
- `TOKEN=`
- long unbroken base64-like strings
- private key headers

---

# Part 22: Error handling

## 22.1 Error format

All commands should use a consistent error shape in JSON mode.

~~~ts
export type RagError = {
  code: string;
  message: string;
  path?: string;
  noteId?: string;
  hint?: string;
};
~~~

## 22.2 Example errors

### Duplicate ID

~~~json
{
  "code": "registry.duplicate_id",
  "message": "Duplicate memory note id 'mem-20260430-rag-rebuild-spec'.",
  "path": "vault/00 Repositories/playground/specs/duplicate.md",
  "hint": "Change one note id and update any links that point to it."
}
~~~

### Invalid status

~~~json
{
  "code": "frontmatter.invalid_status_for_type",
  "message": "Status 'accepted' is not valid for type 'todo'.",
  "hint": "Use status 'active', 'done', or 'archived' for todos."
}
~~~

### Broken link

~~~json
{
  "code": "links.target_missing",
  "message": "Note links to missing target 'mem-20260430-missing'.",
  "path": "vault/00 Repositories/playground/specs/rag.md",
  "hint": "Create the target note or remove/update the link."
}
~~~

---

# Part 23: Definition of done

This epic is complete when all of the following are true:

## Schema and registry

- Every memory note has strict frontmatter.
- Nested links and retention parse correctly.
- Duplicate note IDs fail validation.
- Broken links fail validation or are clearly reported.
- `.rag/note-registry.json` exists and is deterministic.

## Indexing

- `.rag/manifest.json` exists.
- `.rag/chunks.json` exists.
- `.rag/lexical-index.json` exists.
- `.rag/graph-index.json` exists.
- `.rag/diagnostics.json` exists.
- `.rag/` can be deleted and rebuilt.

## Retrieval

- Query classifier runs before retrieval.
- Retrieval planner emits filters and expanded queries.
- Lexical retrieval has score components and reasons.
- Vector retrieval exists or has a tested disabled path.
- Graph expansion works.
- Reranking uses type, status, and recency.
- Context assembly respects budget and source diversity.
- Archived/superseded notes are excluded by default.

## Writes

- Write classifier distinguishes ADR/spec/session/todo/investigation/reference/glossary/no-write.
- Dedupe runs before writes.
- `rag:write` creates valid notes from templates.
- Invalid writes fail fast.

## Cleanup

- `rag:clean --dry-run` reports stale todos.
- It reports old sessions to summarize.
- It reports duplicates.
- It reports orphans.
- It reports oversized notes.
- It reports completed specs to archive.
- It reports superseded ADRs.
- It does not mutate source notes.

## Tests

- Schema tests pass.
- Registry tests pass.
- Index tests pass.
- Planner tests pass.
- Retrieval tests pass.
- Writer tests pass.
- Cleaner tests pass.
- Doctor tests pass.
- Golden retrieval queries pass.

## Agent workflow

- Agent docs explain when to query memory.
- Agent docs explain when to write ADR/spec/session/todo.
- Agent docs require verification after memory changes.
- MCP exposes safe query/classify/propose/cleanup tools.

---

# Part 24: Suggested implementation sequence

Implement in this order:

1. Fixture vaults and tests.
2. Real YAML parser.
3. Strict schema validation.
4. Note registry.
5. Chunk builder.
6. Split generated indexes.
7. Doctor command.
8. Query classifier.
9. Retrieval planner.
10. Improved lexical retrieval.
11. Graph index.
12. Context assembly.
13. Rank fusion and reranking.
14. Vector retrieval placeholder.
15. Write classifier.
16. Dedupe.
17. Writer and templates.
18. Cleanup dry-run.
19. Generated cleanup apply mode.
20. MCP updates.
21. Migration dry-run.
22. Agent documentation.

Do not invert steps 2–4 with vector retrieval. Schema and registry come first.

---

# Part 25: Open questions

1. Should `rag:write` ever mutate files directly, or should it default to dry-run unless `--apply` is passed?
2. Which embedding provider should be used locally?
3. Should vector index be committed or always generated locally?
4. Should `rag:verify` run full retrieval tests or only cheap validation by default?
5. Should cleanup support automatic archive mutations after explicit confirmation?
6. Should sessions be summarized into monthly rollups?
7. Should todos be kept as Markdown notes, or also exported into a task board for the admin app?
8. Should `repo-home` be generated partly from registry state, or fully manually authored?
9. Should graph links use only note IDs, or allow Obsidian wikilinks as aliases?
10. Should specs have a separate `implemented_by` relation for PRs/commits later?

---

# Part 26: Agent handoff checklist

Before starting a story:

- [ ] Read the story acceptance criteria.
- [ ] Check existing repo memory with `rag:query` if relevant.
- [ ] Write or update tests first.
- [ ] Confirm tests fail for the expected reason.

Before committing implementation:

- [ ] Run targeted tests.
- [ ] Run `rag:doctor` if memory changed.
- [ ] Run `rag:index` if memory/index behavior changed.
- [ ] Run `test:retrieval` if retrieval behavior changed.
- [ ] Create a session note for substantial work.
- [ ] Create/update ADR only if a durable architecture decision was made.
- [ ] Create/update spec only if future implementation scope changed.
- [ ] Create/update todo only for small remaining actions.

After completing a story:

- [ ] Update the story status if tracked in memory.
- [ ] Link session note to spec.
- [ ] Link todos to parent spec.
- [ ] Run cleanup dry-run if many notes were created.

---

# Part 27: Minimal first PR recommendation

The first PR should be:

~~~text
feat(obsidian-memory): add typed memory schema and note registry
~~~

Scope:

- add fixture vaults
- add real YAML parser
- add strict frontmatter schema
- add note registry builder
- add duplicate ID detection
- add broken link detection
- add `rag:doctor`
- add tests

Out of scope for first PR:

- embeddings
- vector search
- cleanup mutations
- MCP write tools
- migration apply mode
- UI

Reason:

The memory system cannot become reliable until note identity and schema are reliable. Hybrid retrieval should build on valid memory, not compensate for invalid memory.

---

# Part 28: Final directive to implementation agents

Build this as a memory governance system first and a retrieval system second.

The correct order is:

~~~text
valid memory → registry → indexes → planning → retrieval → writing → cleanup → MCP
~~~

Not:

~~~text
embeddings → vibes → maybe cleanup later
~~~

Every new behavior must be testable. Every memory write must be typed. Every cleanup action must be reviewable. Every generated index must be disposable. Every durable decision must be discoverable.
