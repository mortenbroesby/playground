# RAG Rebuild Spec: typed, self-cleaning repository memory

**Repository:** `mortenbroesby/playground`  
**Spec status:** proposed  
**Target owner:** repo agent + Morten  
**Created:** 2026-04-29  
**Primary goal:** replace the current lightweight Obsidian RAG with a typed, governed, query-routed, self-cleaning agent memory system.

---

## 1. Executive summary

Rebuild the repository RAG as a local-first memory system, not just a text search tool.

The new RAG should:

1. Keep the existing repo-local `vault/` and `.rag/` split.
2. Make all durable memory typed: architecture records, specs, sessions, todos, investigations, references, glossary entries, and repo home notes.
3. Route every query through an intent classifier before retrieval.
4. Use hybrid retrieval: lexical/BM25, vector search, metadata filters, graph expansion, recency/status boosts, and reranking.
5. Let specs live inside the RAG so future agents can retrieve and execute implementation plans.
6. Add a write decision tree so agents know when to create an ADR, spec, session note, todo, or nothing.
7. Add self-cleaning so the memory does not grow forever.
8. Validate, dedupe, summarize, archive, and regenerate memory indexes deterministically.

The result should be a repository brain that is small enough to maintain, structured enough for agents, and strict enough to avoid becoming a junk drawer.

---

## 2. Current repo context

The repo already has a solid foundation:

- `vault/` stores durable repo notes.
- `.rag/` stores generated retrieval output.
- `tools/obsidian-memory` contains repo-local memory tooling.
- Existing commands include:
  - `rag:init`
  - `rag:index`
  - `rag:query`
  - `rag:verify`
  - `mcp`
  - `test:retrieval`
- Current indexing is Markdown-based and chunks notes by headings.
- Current retrieval scores lexical matches across text, headings, paths, tags, keywords, summaries, and note types.
- Current filters include `repoSlug` and `noteType`.

The rebuild should preserve what is good:

- local-first workflow
- Obsidian-compatible authoring
- generated `.rag/` indexes
- MCP-facing retrieval
- repo-owned tooling

But the rebuild should replace the weak parts:

- lexical-only retrieval
- loose memory types
- no durable write decision policy
- no graph of related notes
- no strict schema
- no cleanup lifecycle
- no retrieval quality evaluation beyond simple tests
- no agent-safe memory write workflow

---

## 3. External RAG patterns to adopt

This spec adopts the following production RAG patterns:

1. **Hybrid retrieval**
   - Combine keyword/full-text search with vector search.
   - Merge independent rankings using Reciprocal Rank Fusion or an equivalent rank-fusion strategy.
   - Keep keyword search because exact names, package names, filenames, commands, and repo jargon often beat pure embeddings.

2. **Query rewriting**
   - Rewrite vague user requests into retrieval-friendly queries.
   - Generate expected note types, keywords, filters, and expanded query variants.
   - Use query rewriting before retrieval, not after.

3. **Reranking**
   - Retrieve a wider candidate set first.
   - Rerank a smaller set with richer metadata and semantic similarity.
   - Prefer accepted durable records over stale work logs for architecture questions.

4. **Graph RAG**
   - Treat memory as linked notes, not isolated chunks.
   - Traverse edges between specs, ADRs, sessions, todos, and references.
   - Use graph distance as part of ranking.

5. **Lifecycle-aware memory**
   - Temporary memory should expire, summarize, or archive.
   - Durable decisions should remain stable and discoverable.
   - Generated indexes should be disposable and reproducible.

---

## 4. Target architecture

~~~text
User or agent request
  ↓
Intent classifier
  ↓
Memory router
  ↓
Retrieval planner
  ↓
Hybrid retriever
  ├─ exact lookup
  ├─ lexical/BM25 retrieval
  ├─ vector retrieval
  ├─ metadata filters
  ├─ graph expansion
  └─ recency/status boosts
  ↓
Reranker
  ↓
Context assembler
  ↓
Answer/action agent
  ↓
Memory write classifier
  ↓
Memory writer
  ↓
Validation + dedupe + retention policy
  ↓
Vault source notes
  ↓
Generated .rag indexes
  ↓
Verification + cleanup
~~~

---

## 5. Design principles

### 5.1 Source notes are authoritative

The `vault/` is the source of truth. `.rag/` is generated output.

Rules:

- Never manually edit generated `.rag/` files.
- Never delete source notes automatically.
- Deleting generated indexes must always be safe.
- Rebuilding indexes must be deterministic.

### 5.2 Memory must be typed

Every durable note must have exactly one type. Type controls:

- retrieval priority
- retention policy
- validation rules
- write decision logic
- cleanup behavior
- graph edge expectations

### 5.3 Retrieval must be explainable

Every retrieval result must include:

- source note ID
- file path
- heading
- note type
- status
- score
- match reasons
- graph distance if applicable
- token estimate
- whether it was selected or omitted

### 5.4 Agents must not write junk

Agents must classify memory writes before writing. They must not create a new note just because something happened.

A write is allowed only if it has durable value, action value, or handoff value.

### 5.5 Self-cleaning is review-first

Cleanup should automatically handle generated files, but source note cleanup must be review-first.

The cleaner may:

- regenerate indexes
- delete stale generated files
- report duplicate notes
- report stale todos
- report sessions to summarize
- report specs to archive
- report orphan notes

The cleaner must not silently delete human-authored memory.

---

## 6. Memory taxonomy

Every note must use one of these types.

### 6.1 `repo-home`

Canonical high-level repo overview.

Use for:

- current repo purpose
- workspace map
- active architecture summary
- stable package relationships
- important commands
- links to active specs, ADRs, todos, and sessions

Retention:

- permanent
- updated in place
- should not have duplicates

Retrieval priority:

- high for broad repo questions
- medium for specific implementation questions

---

### 6.2 `architecture-record`

Durable architecture decision or system design record.

Use when:

- a decision affects boundaries, architecture, tools, conventions, dependencies, data flow, or agent workflow
- alternatives were considered
- future maintainers need to know why something exists
- a session created a decision that should not remain buried in a work log

Examples:

- “Use Obsidian vault as source of truth for repo memory.”
- “Use hybrid retrieval instead of lexical-only retrieval.”
- “Separate session notes from durable architecture records.”
- “Keep generated RAG indexes outside source memory.”

Retention:

- permanent unless superseded
- superseded records remain retrievable but deprioritized

Retrieval priority:

- highest for “why”, “decision”, “architecture”, “tradeoff”, and “should we” queries

---

### 6.3 `spec`

Executable product or engineering specification.

Use when:

- there is a desired future state
- multiple implementation steps are required
- acceptance criteria are needed
- an agent needs instructions to build or rebuild something
- the work is bigger than a single todo

Examples:

- “Rebuild RAG memory system.”
- “Implement self-cleaning memory.”
- “Add graph links between ADRs, specs, sessions, and todos.”

Retention:

- active until implemented
- then marked `done` or `archived`
- must link to resulting sessions, ADRs, and todos

Retrieval priority:

- highest for “build”, “implement”, “plan”, “spec”, and “rebuild” queries

---

### 6.4 `session`

Time-bounded work log.

Use when:

- an agent or human worked on the repo
- concrete actions, findings, changed files, commands, or blockers were produced
- context is useful for handoff but not necessarily permanent
- recent history matters

Examples:

- “2026-04-29 RAG redesign session.”
- “Host route cleanup session.”
- “Todo remote integration debugging session.”

Retention:

- summarize after 14 days
- archive after 60 days
- compress or delete after 180 days unless linked from a durable note

Retrieval priority:

- high for recent “what happened” queries
- medium for implementation continuity
- low for durable architecture decisions

---

### 6.5 `todo`

Small actionable task.

Use when:

- the task is independently completable
- there is a clear done condition
- it does not need a full spec
- it can be owned, closed, or deferred

Examples:

- “Add `rag:doctor` command.”
- “Add retrieval fixture for RAG command queries.”
- “Archive stale sessions older than 180 days.”

Retention:

- delete or archive when done
- stale open todos require review after 30 days

Retrieval priority:

- high for “what remains”, “next action”, “todo”, and “open task” queries

---

### 6.6 `investigation`

Research note or exploratory finding.

Use when:

- options are being compared
- the result is not yet a decision
- experiments, benchmarks, or external research are collected
- uncertainty remains

Examples:

- “Compare local embedding libraries.”
- “Investigate BM25 implementation options.”
- “Evaluate graph retrieval scoring.”

Retention:

- merge into ADR or spec if it becomes decision-grade
- archive after 90 days if unused

Retrieval priority:

- high for “research”, “compare”, “options”, and “investigate” queries
- medium for architecture queries

---

### 6.7 `reference`

Stable external or internal reference.

Use when:

- documenting a library, API, command, convention, or recurring workflow
- the note supports work but does not itself decide or prescribe

Examples:

- “RAG command reference.”
- “Obsidian frontmatter schema reference.”
- “MCP memory tool reference.”

Retention:

- review every 180 days

Retrieval priority:

- high for “how”, “command”, “API”, and “reference” queries

---

### 6.8 `glossary`

Canonical repo-specific definitions.

Use when:

- agents repeatedly confuse a term
- the repo has local jargon
- a term needs one stable definition

Examples:

- “RAG”
- “session node”
- “architecture record”
- “remote seam”
- “repo memory”

Retention:

- permanent
- reviewed occasionally

Retrieval priority:

- high for definition queries
- low for implementation queries

---

## 7. Required frontmatter schema

Every source note must include this frontmatter.

~~~yaml
---
id: "mem-YYYYMMDD-slug"
type: "architecture-record | spec | session | todo | investigation | reference | glossary | repo-home"
repo_slug: "playground"
title: "Human-readable title"
status: "active | proposed | accepted | superseded | done | archived"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
owner: "human | agent | morten"
summary: "One sentence summary"
tags: []
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "YYYY-MM-DD | null"
  expires_after: "YYYY-MM-DD | null"
  keep: false
---
~~~

### 7.1 Allowed statuses

| Status | Meaning |
|---|---|
| `proposed` | Draft, candidate, or not yet accepted. |
| `active` | Current work item or live spec. |
| `accepted` | Durable decision or canonical reference. |
| `superseded` | Replaced by a newer note. |
| `done` | Completed task or implemented spec. |
| `archived` | Kept for history but not active. |

### 7.2 Status rules by type

| Type | Allowed statuses |
|---|---|
| `repo-home` | `active`, `archived` |
| `architecture-record` | `proposed`, `accepted`, `superseded`, `archived` |
| `spec` | `proposed`, `active`, `done`, `archived`, `superseded` |
| `session` | `active`, `done`, `archived` |
| `todo` | `active`, `done`, `archived` |
| `investigation` | `active`, `done`, `archived` |
| `reference` | `active`, `accepted`, `archived`, `superseded` |
| `glossary` | `active`, `accepted`, `archived` |

---

## 8. Vault structure

Use this layout.

~~~text
vault/
  00 Repositories/
    playground/
      00 Repo Home.md
      architecture/
      specs/
      sessions/
      todos/
      investigations/
      references/
      glossary/
  90 Templates/
  91 Scripts/
~~~

Rules:

- `00 Repo Home.md` must be the only `repo-home` note for `playground`.
- Source notes live under the matching folder for their type.
- Templates are not indexed.
- Scripts are not indexed.
- `.obsidian/` is not indexed.
- `.trash/` is not indexed.
- `.rag/` is not source memory.

---

## 9. Generated index structure

Replace the single corpus with a multi-index generated structure.

~~~text
.rag/
  manifest.json
  note-registry.json
  lexical-index.json
  vector-index.json
  graph-index.json
  chunk-index.json
  diagnostics.json
  cleanup-report.json
~~~

### 9.1 `manifest.json`

~~~json
{
  "schema_version": 2,
  "repo_slug": "playground",
  "generated_at": "2026-04-29T00:00:00.000Z",
  "generator": "@playground/obsidian-memory",
  "source_root": "vault",
  "index_root": ".rag",
  "notes": 0,
  "chunks": 0,
  "content_hash": "sha256..."
}
~~~

### 9.2 `note-registry.json`

One row per source note.

~~~json
{
  "id": "mem-20260429-rag-rebuild",
  "type": "spec",
  "path": "vault/00 Repositories/playground/specs/rag-rebuild.md",
  "title": "Rebuild repo RAG as typed self-cleaning memory",
  "status": "active",
  "created": "2026-04-29",
  "updated": "2026-04-29",
  "summary": "Spec for rebuilding the repo RAG as a typed, hybrid, self-cleaning agent memory system.",
  "tags": ["rag", "memory", "agents"],
  "keywords": ["RAG", "hybrid retrieval", "self-cleaning", "ADR", "spec"],
  "outbound_links": [],
  "inbound_links": [],
  "content_hash": "sha256...",
  "mtime_ms": 0
}
~~~

### 9.3 `chunk-index.json`

One row per retrievable chunk.

~~~json
{
  "chunk_id": "chunk-...",
  "note_id": "mem-20260429-rag-rebuild",
  "source_path": "vault/00 Repositories/playground/specs/rag-rebuild.md",
  "heading": "Implementation plan",
  "heading_level": 2,
  "text": "Chunk text...",
  "summary": "Chunk summary...",
  "tokens_estimated": 120,
  "content_hash": "sha256..."
}
~~~

### 9.4 `graph-index.json`

Typed memory edges.

~~~json
{
  "nodes": [
    {
      "id": "mem-20260429-rag-rebuild",
      "type": "spec",
      "status": "active"
    }
  ],
  "edges": [
    {
      "from": "mem-20260429-rag-rebuild",
      "to": "mem-20260429-rag-hybrid-retrieval",
      "type": "requires"
    }
  ]
}
~~~

Allowed edge types:

- `relates_to`
- `implements`
- `requires`
- `spawned`
- `resolved_by`
- `summarizes`
- `supersedes`
- `superseded_by`
- `explains`
- `references`

---

## 10. Agent request state machine

~~~mermaid
stateDiagram-v2
  [*] --> CLASSIFY_REQUEST
  CLASSIFY_REQUEST --> RETRIEVE_CONTEXT
  RETRIEVE_CONTEXT --> PLAN_ACTION
  PLAN_ACTION --> EXECUTE_ACTION
  EXECUTE_ACTION --> CLASSIFY_MEMORY_WRITE
  CLASSIFY_MEMORY_WRITE --> WRITE_OR_SKIP
  WRITE_OR_SKIP --> VALIDATE_MEMORY
  VALIDATE_MEMORY --> INDEX_MEMORY
  INDEX_MEMORY --> VERIFY_RETRIEVAL
  VERIFY_RETRIEVAL --> CLEAN_MEMORY
  CLEAN_MEMORY --> [*]
~~~

### 10.1 `CLASSIFY_REQUEST`

Classify the user request.

Allowed intents:

- `answer_question`
- `change_code`
- `write_spec`
- `make_decision`
- `investigate`
- `summarise_session`
- `create_todo`
- `cleanup_memory`

Output:

~~~json
{
  "intent": "write_spec",
  "needs_rag": true,
  "needs_code_search": true,
  "needs_external_research": false,
  "expected_memory_write": "spec",
  "expected_note_types": ["repo-home", "spec", "architecture-record", "session"]
}
~~~

### 10.2 `RETRIEVE_CONTEXT`

Use retrieval tiers in this order:

1. Exact ID/path lookup.
2. Metadata-filtered lexical search.
3. Vector search.
4. Graph expansion from matched notes.
5. Recency/status boost.
6. Rerank top candidates.
7. Assemble bounded context.

Never retrieve only by raw chunk similarity when note type, status, recency, or graph links are available.

### 10.3 `PLAN_ACTION`

The agent must determine:

- task goal
- relevant memory sources
- whether code search is needed
- whether external research is needed
- whether a memory write is expected
- verification commands

### 10.4 `EXECUTE_ACTION`

Execute the requested change, answer, or investigation.

If changing code, the agent should also inspect relevant package docs and tests.

### 10.5 `CLASSIFY_MEMORY_WRITE`

Before writing memory, return:

~~~json
{
  "should_write": true,
  "type": "spec",
  "reason": "The user requested a durable rebuild plan with acceptance criteria.",
  "durability": "high",
  "dedupe_query": "rebuild rag memory system spec",
  "retention": {
    "review_after_days": 30,
    "expires_after_days": null,
    "keep": true
  }
}
~~~

### 10.6 `WRITE_OR_SKIP`

Allowed outcomes:

- write new note
- update existing note
- append to session
- create todo
- no write

### 10.7 `VALIDATE_MEMORY`

Reject a note if:

- frontmatter is missing
- `id` is missing
- `id` duplicates another note
- `type` is invalid
- `status` is invalid for the type
- `created` or `updated` is invalid
- required links point to missing notes
- title is vague
- summary is vague
- a todo is too broad and should be a spec
- a session contains durable decisions that should become ADRs
- a spec lacks acceptance criteria
- an ADR lacks alternatives or consequences

### 10.8 `INDEX_MEMORY`

Rebuild generated indexes.

### 10.9 `VERIFY_RETRIEVAL`

Run fixture tests and command checks.

### 10.10 `CLEAN_MEMORY`

Generate cleanup report and optionally remove generated stale index files.

---

## 11. Memory write decision tree

Use this exact decision tree.

~~~text
1. Is this information worth remembering beyond the current answer?
   no  → no memory write
   yes → continue

2. Does it change architecture, boundaries, conventions, tooling, dependencies, data flow, or agent workflow?
   yes → architecture-record
   no  → continue

3. Does it describe a future implementation with multiple steps and acceptance criteria?
   yes → spec
   no  → continue

4. Is it a small, independently completable action?
   yes → todo
   no  → continue

5. Is it a bounded work log or handoff from a coding/research session?
   yes → session
   no  → continue

6. Is it exploratory research without a final decision?
   yes → investigation
   no  → continue

7. Is it stable supporting material, command documentation, or API reference?
   yes → reference
   no  → continue

8. Is it a repo-specific definition?
   yes → glossary
   no  → no memory write
~~~

---

## 12. Retrieval design

### 12.1 Query rewrite output

Every query should first become a retrieval plan.

~~~json
{
  "original": "Do we need an ADR or a todo for this?",
  "normalized": "classify memory write as ADR spec session todo or no write",
  "keywords": ["ADR", "architecture-record", "spec", "session", "todo", "memory write"],
  "expected_note_types": ["architecture-record", "spec", "reference", "glossary"],
  "metadata_filters": {
    "repo_slug": "playground",
    "status": ["active", "accepted", "proposed"]
  },
  "expanded_queries": [
    "memory write decision tree",
    "when to create architecture record",
    "when to create todo session spec",
    "agent memory classifier"
  ],
  "negative_filters": ["archived", "superseded"]
}
~~~

### 12.2 Retrieval stages

1. **Exact lookup**
   - Match note IDs, paths, command names, filenames, package names, and known route names.

2. **Lexical retrieval**
   - Use BM25 or equivalent.
   - Strong for commands, filenames, symbols, package names, exact phrases, and repo jargon.

3. **Vector retrieval**
   - Use embeddings for semantic matches.
   - Strong for conceptual or poorly worded queries.

4. **Metadata filtering**
   - Filter by type, repo, status, tags, owner, and dates.

5. **Graph expansion**
   - Add notes linked to top candidates.
   - Include parent/child/related/superseded links.

6. **Reranking**
   - Rerank merged candidates with richer context.

7. **Context assembly**
   - Fit selected items into a token budget.
   - Preserve source references and omitted-candidate metadata.

### 12.3 Retrieval priority by query intent

| Query intent | Preferred note types |
|---|---|
| “What is this repo?” | `repo-home`, `architecture-record`, `reference` |
| “Why was this chosen?” | `architecture-record`, `investigation`, `session` |
| “What should we build?” | `spec`, `todo`, `architecture-record` |
| “What happened recently?” | `session`, `todo`, `spec` |
| “What remains?” | `todo`, `spec`, `session` |
| “How do I run this?” | `reference`, `repo-home`, `session` |
| “Define this term” | `glossary`, `reference`, `repo-home` |
| “Clean memory” | `todo`, `session`, `spec`, `architecture-record` |

---

## 13. Scoring model

Final score:

~~~text
score =
  lexical_score
  + vector_score
  + metadata_boost
  + graph_boost
  + recency_boost
  + status_boost
  + exact_match_boost
  - stale_penalty
  - duplicate_penalty
~~~

Recommended initial boosts:

~~~json
{
  "metadata_boost": {
    "repo-home": 8,
    "architecture-record": 10,
    "spec": 8,
    "session": 4,
    "todo": 5,
    "investigation": 3,
    "reference": 3,
    "glossary": 4
  },
  "status_boost": {
    "accepted": 8,
    "active": 6,
    "proposed": 2,
    "done": 1,
    "archived": -8,
    "superseded": -10
  },
  "recency_boost": {
    "session_last_7_days": 6,
    "session_last_30_days": 3,
    "todo_last_30_days": 4
  },
  "graph_boost": {
    "direct_link": 5,
    "distance_2": 2,
    "supersedes": -4,
    "superseded_by": 4
  },
  "exact_match_boost": {
    "id": 20,
    "path": 18,
    "title": 12,
    "command": 10,
    "package_name": 10
  }
}
~~~

### 13.1 Rank fusion

Use Reciprocal Rank Fusion for merging lexical and vector candidate lists.

~~~text
rrf_score(document) = Σ 1 / (k + rank_i)
~~~

Recommended `k`: `60`.

Then apply repo-specific boosts and penalties.

---

## 14. Context assembly

Context output must include:

~~~json
{
  "query": "What should we do about RAG cleanup?",
  "selected_count": 4,
  "candidate_count": 18,
  "token_budget": 1200,
  "estimated_tokens": 982,
  "items": [
    {
      "note_id": "mem-20260429-rag-rebuild",
      "chunk_id": "chunk-...",
      "source_path": "vault/00 Repositories/playground/specs/rag-rebuild.md",
      "heading": "Self-cleaning",
      "type": "spec",
      "status": "active",
      "score": 42.5,
      "match_reasons": ["type:spec", "keyword:cleanup", "graph:direct"],
      "graph_distance": 0,
      "text": "..."
    }
  ],
  "omitted": [
    {
      "note_id": "mem-...",
      "reason": "token_budget"
    }
  ]
}
~~~

Rules:

- Prefer accepted ADRs over sessions for durable decisions.
- Prefer active specs over investigations for implementation instructions.
- Prefer recent sessions only for recent work questions.
- Do not include archived notes unless explicitly requested or needed for history.
- Include superseded notes only when the user asks about history or migration.

---

## 15. Command contract

Implement or preserve these commands.

~~~bash
pnpm rag:init
pnpm rag:index
pnpm rag:query --query "..."
pnpm rag:classify --input "..."
pnpm rag:write --type spec --title "..."
pnpm rag:verify
pnpm rag:clean --dry-run
pnpm rag:clean --apply-generated
pnpm rag:doctor
pnpm rag:test
~~~

### 15.1 `rag:init`

Creates required folders and templates.

Must not overwrite existing source notes unless `--force` is passed.

### 15.2 `rag:index`

Builds all generated indexes.

Options:

~~~bash
pnpm rag:index --force
pnpm rag:index --json
pnpm rag:index --vault ./vault
pnpm rag:index --output-dir ./.rag
~~~

### 15.3 `rag:query`

Runs classification, retrieval, reranking, and context assembly.

Options:

~~~bash
pnpm rag:query --query "What RAG commands exist?"
pnpm rag:query --query "Why did we choose Obsidian memory?" --type architecture-record
pnpm rag:query --query "What remains open?" --status active --type todo
pnpm rag:query --query "Recent RAG work" --recent 30d
~~~

### 15.4 `rag:classify`

Classifies either a user query or a proposed memory write.

~~~bash
pnpm rag:classify --input "We decided to use hybrid retrieval"
~~~

Expected output:

~~~json
{
  "request_intent": "make_decision",
  "expected_note_type": "architecture-record",
  "reason": "This is a durable architecture/tooling decision.",
  "retrieval_filters": {
    "type": ["architecture-record", "investigation", "spec"]
  }
}
~~~

### 15.5 `rag:write`

Creates or updates a source note using templates and validation.

~~~bash
pnpm rag:write --type spec --title "Rebuild RAG memory"
pnpm rag:write --type todo --title "Add cleanup dry-run"
pnpm rag:write --type architecture-record --title "Use hybrid retrieval"
~~~

Rules:

- Must run dedupe check before writing.
- Must reject missing required fields.
- Must write into the correct folder.
- Must run or recommend `rag:index` after write.

### 15.6 `rag:verify`

Checks memory validity.

Must verify:

- required folders exist
- every source note has valid frontmatter
- note IDs are unique
- statuses are valid for note type
- links resolve
- templates are excluded
- generated files are not treated as source memory
- retrieval fixtures pass

### 15.7 `rag:clean --dry-run`

Produces a cleanup report without modifying source notes.

Output:

~~~json
{
  "duplicate_notes": [],
  "stale_todos": [],
  "sessions_to_summarise": [],
  "orphan_notes": [],
  "oversized_notes": [],
  "invalid_frontmatter": [],
  "archivable_specs": [],
  "superseded_decisions": [],
  "generated_files_to_delete": []
}
~~~

### 15.8 `rag:clean --apply-generated`

Only applies safe generated-file cleanup.

Allowed:

- delete stale `.rag/` generated files
- rewrite generated indexes
- rewrite diagnostics

Forbidden:

- delete vault notes
- rewrite source notes
- archive notes without explicit approval

### 15.9 `rag:doctor`

Runs a full health check:

- init check
- schema check
- link check
- index check
- retrieval fixture check
- cleanup dry-run
- git ignore check for generated files

---

## 16. Self-cleaning policy

### 16.1 Cleanup categories

| Category | Detection | Action |
|---|---|---|
| Duplicate notes | similar title, summary, embedding, or same canonical topic | report merge candidate |
| Stale todos | active for more than 30 days without update | report review candidate |
| Old sessions | older than 14 days | report summarization candidate |
| Expired sessions | older than 180 days and not linked | report archive/delete candidate |
| Superseded ADRs | `superseded_by` set | lower retrieval score |
| Orphan notes | no inbound/outbound links | report link or archive candidate |
| Oversized notes | token estimate above threshold | report split candidate |
| Done specs | `done` for more than 30 days | report archive candidate |
| Bad frontmatter | schema validation failure | block verification |
| Stale generated files | not in current manifest | safe delete |

### 16.2 Retention defaults

~~~json
{
  "repo-home": {
    "keep": true,
    "review_after_days": 90,
    "expires_after_days": null
  },
  "architecture-record": {
    "keep": true,
    "review_after_days": 180,
    "expires_after_days": null
  },
  "spec": {
    "keep": true,
    "review_after_days": 30,
    "expires_after_days": null
  },
  "session": {
    "keep": false,
    "review_after_days": 14,
    "expires_after_days": 180
  },
  "todo": {
    "keep": false,
    "review_after_days": 30,
    "expires_after_days": null
  },
  "investigation": {
    "keep": false,
    "review_after_days": 60,
    "expires_after_days": 180
  },
  "reference": {
    "keep": true,
    "review_after_days": 180,
    "expires_after_days": null
  },
  "glossary": {
    "keep": true,
    "review_after_days": 365,
    "expires_after_days": null
  }
}
~~~

---

## 17. Templates

### 17.1 Architecture record template

~~~md
---
id: "mem-YYYYMMDD-slug"
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

### 17.2 Spec template

~~~md
---
id: "mem-YYYYMMDD-slug"
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

## Implementation plan

## Acceptance criteria

## Verification

## Open questions
~~~

### 17.3 Session template

~~~md
---
id: "mem-YYYYMMDD-session-slug"
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

## Findings

## Decisions that need ADRs

## Todos created

## Next handoff
~~~

### 17.4 Todo template

~~~md
---
id: "mem-YYYYMMDD-todo-slug"
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

### 17.5 Investigation template

~~~md
---
id: "mem-YYYYMMDD-investigation-slug"
type: "investigation"
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

# Investigation title

## Question

## Findings

## Options

## Recommendation

## Uncertainty

## Sources

## Follow-up
~~~

---

## 18. Implementation plan

### Phase 1: schema and registry

Tasks:

- Add strict frontmatter parser.
- Add `note-registry.json`.
- Add folder/type validation.
- Add duplicate ID detection.
- Add allowed status validation.
- Add template generation.
- Add `rag:doctor`.

Acceptance criteria:

- invalid frontmatter fails verification
- duplicate IDs fail verification
- invalid status/type combinations fail verification
- every source note appears in the registry
- templates and scripts are excluded from the registry

---

### Phase 2: indexing

Tasks:

- Keep heading-aware Markdown chunking.
- Add stable note IDs and chunk IDs.
- Add content hashes.
- Add `chunk-index.json`.
- Add `lexical-index.json`.
- Add optional local embeddings and `vector-index.json`.
- Add deterministic manifest generation.

Acceptance criteria:

- generated indexes can be deleted and recreated
- unchanged files are skipped unless `--force` is used
- changed files update their chunks
- deleted source notes disappear from generated indexes
- generated indexes include note and chunk counts

---

### Phase 3: hybrid retrieval

Tasks:

- Implement BM25 or equivalent lexical scoring.
- Implement vector retrieval.
- Merge candidate lists with RRF.
- Add metadata filters.
- Add status/type boosts.
- Add recency boosts.
- Add exact match boosts.
- Add reranker.
- Add explainable match reasons.

Acceptance criteria:

- architecture queries return ADRs above sessions
- implementation queries return specs above references
- command queries return references or repo-home sections with exact matches
- recent-work queries return sessions above ADRs
- archived/superseded notes are suppressed unless explicitly requested

---

### Phase 4: query classifier and router

Tasks:

- Add `rag:classify`.
- Implement intent classification.
- Implement expected note type selection.
- Implement metadata filter planning.
- Implement query expansion.
- Add routing tests.

Acceptance criteria:

- “Should we document this decision?” routes to `architecture-record`
- “Make a plan to rebuild X” routes to `spec`
- “What did we do today?” routes to `session`
- “What remains?” routes to `todo`
- “Compare options” routes to `investigation`
- “What does X mean?” routes to `glossary`

---

### Phase 5: graph memory

Tasks:

- Parse frontmatter links.
- Build `graph-index.json`.
- Add inbound links.
- Add graph expansion after first-pass retrieval.
- Add graph distance to context results.
- Add orphan detection.

Acceptance criteria:

- specs can find related ADRs
- sessions can find spawned todos
- ADRs can find superseded ADRs
- orphan notes appear in cleanup report
- broken links fail verification

---

### Phase 6: self-cleaning

Tasks:

- Add `rag:clean --dry-run`.
- Add stale todo detection.
- Add old session summarization candidates.
- Add duplicate detection.
- Add oversized note detection.
- Add archivable spec detection.
- Add safe generated-file cleanup.

Acceptance criteria:

- cleanup dry-run modifies nothing
- source-note cleanup is review-only
- generated-file cleanup is automatic and safe
- stale todos are reported
- sessions older than retention thresholds are reported
- done specs are suggested for archive

---

### Phase 7: agent integration

Tasks:

- Update `AGENTS.md`.
- Add memory read/write rules.
- Add examples for each note type.
- Add MCP tools for classify/query/write/verify.
- Add local verification command to common workflow.
- Add retrieval quality fixtures.

Acceptance criteria:

- agents know when to read RAG
- agents know when to write ADR/spec/session/todo
- agents can query memory through MCP
- agents can propose memory writes safely
- invalid writes are rejected
- `pnpm rag:verify` passes

---

## 19. Retrieval quality tests

Create fixtures for these questions.

| # | Query | Expected top types |
|---|---|---|
| 1 | What is this repo? | `repo-home`, `architecture-record` |
| 2 | What RAG commands exist? | `reference`, `repo-home` |
| 3 | Why do we use Obsidian memory? | `architecture-record`, `repo-home` |
| 4 | How should agents decide between ADR/spec/session/todo? | `reference`, `spec`, `architecture-record` |
| 5 | What RAG work is currently active? | `spec`, `todo`, `session` |
| 6 | What changed recently? | `session` |
| 7 | What tasks are still open? | `todo`, `spec` |
| 8 | Find specs related to RAG. | `spec` |
| 9 | Find stale todos. | `todo` |
| 10 | Find superseded decisions. | `architecture-record` |
| 11 | What is the difference between a session and an ADR? | `glossary`, `reference`, `architecture-record` |
| 12 | What should be cleaned up? | `todo`, `session`, `spec` |

Each fixture must assert:

- expected note type appears in top results
- expected top source is present
- archived notes do not outrank active notes unless requested
- superseded notes do not outrank accepted notes unless requested
- context fits token budget
- match reasons are present
- graph distance is present when applicable

---

## 20. Agent operating rules

Add these rules to the repo agent guide.

1. Read RAG before changing architecture, workflow, tooling, conventions, or package boundaries.
2. Use `rag:classify` before writing durable memory.
3. Write an architecture record when a durable architecture decision is made.
4. Write a spec when future implementation has multiple steps or acceptance criteria.
5. Write a session note after substantial repo work.
6. Write todos only for small, concrete, independently completable actions.
7. Never bury durable decisions inside session notes only.
8. Never create duplicate memory.
9. Never delete source memory automatically.
10. Always run `pnpm rag:verify` after memory changes.
11. Run `pnpm rag:clean --dry-run` before large memory refactors.
12. Treat `.rag/` as generated output.
13. Treat `vault/` as source memory.
14. Keep specs in RAG when they define future repo behavior.

---

## 21. Example agent prompt for a full rebuild

Use this prompt for an implementation agent.

~~~text
You are rebuilding the repository RAG system from the ground up.

Repository goals:
- Preserve the local-first Obsidian vault model.
- Preserve generated .rag indexes.
- Replace lexical-only retrieval with typed hybrid retrieval.
- Add a memory write decision tree.
- Add strict frontmatter validation.
- Add graph links between repo-home, ADRs, specs, sessions, todos, investigations, references, and glossary entries.
- Add self-cleaning dry-run reports.
- Add retrieval quality fixtures.
- Update agent docs.

Implementation order:
1. Inspect current tools/obsidian-memory implementation.
2. Add schema/types for memory notes.
3. Add note registry and validation.
4. Add generated multi-index output.
5. Add hybrid retrieval and rank fusion.
6. Add query classification and routing.
7. Add graph index and graph expansion.
8. Add cleanup dry-run and generated cleanup.
9. Add tests and fixtures.
10. Update AGENTS.md and README docs.

Constraints:
- Do not delete vault source notes automatically.
- Do not store secrets in memory.
- Do not make hosted infrastructure required.
- Keep generated files deterministic.
- Keep commands runnable through pnpm.
- Keep docs clear enough for future agents.

Verification:
- pnpm --filter @playground/obsidian-memory test:retrieval
- pnpm rag:index
- pnpm rag:verify
- pnpm rag:clean --dry-run
- pnpm turbo type-check
- pnpm turbo lint
~~~

---

## 22. Open design decisions

The implementation agent should resolve or explicitly document these:

1. Which local embedding backend should be used by default?
2. Should embeddings be optional when offline?
3. Should vector index files be committed or always generated?
4. Should `.rag/` be fully gitignored?
5. Should `rag:write` be allowed to modify existing notes automatically?
6. Should `rag:clean` create PR-ready patch suggestions?
7. Should memory writes require human approval in MCP mode?
8. Should session summarization be agent-generated or template-only?
9. Should todos be Markdown notes, frontmatter records, or both?
10. Should graph links use frontmatter IDs only, wiki links, or both?

---

## 23. Definition of done

The rebuild is complete when:

- `vault/` contains typed source memory with strict frontmatter.
- `.rag/` contains generated multi-index outputs.
- `rag:classify` routes requests to likely note types.
- `rag:query` uses hybrid retrieval, metadata filtering, graph expansion, and reranking.
- `rag:write` creates valid typed notes and rejects duplicates.
- `rag:verify` catches schema, link, duplicate, and retrieval fixture failures.
- `rag:clean --dry-run` reports stale, duplicate, orphaned, oversized, expired, and archivable notes.
- `rag:clean --apply-generated` safely cleans generated files only.
- specs live in RAG and are retrievable by implementation agents.
- durable decisions are ADRs, not buried in sessions.
- sessions can be summarized and eventually archived.
- todos do not grow forever.
- future agents have clear rules in `AGENTS.md`.
- retrieval tests prove agents can find the right memory for real repo questions.

---

## 24. First concrete implementation todo list

Create these todos or implement them directly:

1. Add memory note schema module.
2. Add note registry builder.
3. Add strict frontmatter validation.
4. Add valid type/status matrix.
5. Add graph link parser.
6. Add `graph-index.json`.
7. Add BM25 lexical scorer.
8. Add optional vector indexer.
9. Add RRF rank fusion.
10. Add query classifier.
11. Add write decision tree.
12. Add `rag:write`.
13. Add cleanup dry-run report.
14. Add generated cleanup apply mode.
15. Add retrieval fixtures.
16. Update `AGENTS.md`.
17. Update `tools/obsidian-memory/README.md`.
18. Add a repo-home refresh step.
19. Add stale session summarization candidates.
20. Add duplicate note detection.

---

## 25. Suggested first ADRs after implementation

After the rebuild starts, create ADRs for:

1. “Use typed Obsidian notes as source memory.”
2. “Use generated multi-index RAG output.”
3. “Use hybrid retrieval with rank fusion.”
4. “Use graph links for memory relationships.”
5. “Use review-first self-cleaning for source notes.”
6. “Keep specs in repo memory.”

---

## 26. Suggested first specs after implementation

Create specs for:

1. “Hybrid retrieval implementation.”
2. “Memory graph implementation.”
3. “Self-cleaning and retention implementation.”
4. “Agent memory write workflow.”
5. “Retrieval quality fixture suite.”

---

## 27. Success metric

This RAG rebuild succeeds when an agent can start with a vague request like:

> “Help me continue the RAG cleanup work.”

And correctly retrieve:

1. the active RAG rebuild spec,
2. the latest RAG session,
3. open RAG todos,
4. accepted RAG architecture records,
5. relevant implementation references,

without pulling in stale, duplicate, archived, or unrelated memory.
