# ai-code-context-engine-spec.md

## Status

Last checked against the repo on 2026-04-15.

Implemented now:
- repo-local SQLite storage in WAL mode with sidecars and persisted content blobs
- Tree-sitter parsing for `ts`, `tsx`, `js`, and `jsx`
- repo/file discovery tools, symbol/text search, exact source retrieval, context bundles, CLI, and MCP
- single-file refresh plus freshness diagnostics and stale-index reporting

Still future:
- watch mode and worktree-aware indexing
- richer relationship and impact tools
- fuzzy, centrality-aware, and semantic ranking
- optional summarization backends beyond signature fallback

## 1. Purpose

Rebuild a free, open-source, local-first alternative to jCodeMunch for AI-assisted code exploration.

The system should let an AI agent:

- index a repository once
- inspect structure before opening code
- search and rank symbols efficiently
- retrieve exact code segments without rescanning whole files
- assemble bounded context packages for reasoning tasks

This is a deterministic context engine for AI agents, not a general-purpose IDE or code search UI.

---

## 2. Product model

The product model should follow the same operating pattern jCodeMunch uses:

1. index repository or local folder
2. inspect repo/file structure
3. search symbols or text
4. retrieve exact source or bounded context
5. optionally verify freshness, inspect relationships, and estimate impact

The system should optimise for stateless context reconstruction rather than conversational memory.

---

## 3. Core principles

### 3.1 Local-first
- all indexes stored locally
- no required cloud dependency
- no paid service dependency for core functionality

### 3.2 Deterministic retrieval
- source retrieval should be based on persisted metadata and byte offsets
- summaries may help ranking, but must never replace exact source retrieval

### 3.3 Token efficiency
- prefer outlines, symbol metadata, and bounded context over full-file reads
- make it easy for agents to avoid raw file dumping

### 3.4 Exploration-first workflow
- structure and search tools should come before code retrieval tools
- the default workflow should encourage discovery, then narrowing, then retrieval

### 3.5 Incremental freshness
- indexes should support partial refresh and watch-based maintenance
- stale index state should be visible in tool responses

---

## 4. System architecture

### 4.1 High-level flow

Codebase
→ parser
→ symbol/index store
→ search/ranking layer
→ retrieval/context assembly layer
→ MCP/CLI interface for AI agents

### 4.2 Major subsystems
- parser
- storage
- summarization
- search and ranking
- retrieval
- relationship analysis
- watcher / incremental indexing
- MCP server
- CLI / diagnostics

---

## 5. Parsing layer

### 5.1 Primary parser
Use Tree-sitter as the core parser.

### 5.2 Extracted entities
The parser should extract at minimum:
- functions
- classes
- methods
- constants
- types
- imports
- file-level structural metadata

### 5.3 Symbol record requirements
Each symbol record should include:
- symbol id
- qualified name where available
- kind
- language
- file path
- signature
- summary
- start/end line
- byte offsets into cached raw source
- content hash
- exported/public signal where relevant

### 5.4 Import extraction
Support language-aware import extraction where practical.
Keep this modular so some languages can use parser-based extraction and others can use lighter heuristics when needed.

---

## 6. Storage model

### 6.1 Storage backend
Use SQLite as the primary backend.

### 6.2 Storage mode
Enable WAL mode to allow concurrent reads while incremental indexing is active.

### 6.3 Core persisted artifacts
Persist:
- per-repo SQLite database
- lightweight metadata sidecar for repo listing
- checksum sidecar for integrity verification
- cached raw source files or content blobs for exact retrieval

### 6.4 Core tables
Initial schema should include:
- meta
- symbols
- files
- imports
- raw_cache or content_blob

Optional later tables:
- symbol_embeddings
- call_edges
- relationship_metrics
- snapshots / diffs

### 6.5 Retrieval-critical property
Store byte offsets into cached raw source so exact symbol retrieval does not require reparsing or rescanning whole files.

---

## 7. Discovery layer

The system should include structure-first tools before retrieval.

### 7.1 Required discovery capabilities
- get repo outline
- get file tree
- get file outline
- suggest initial queries

### 7.2 Intent
These tools are for cold-start navigation in unfamiliar repositories and should be cheaper than full retrieval.

---

## 8. Search and ranking layer

### 8.1 Required search modes
- symbol search
- text search
- column-oriented / structured search if useful

### 8.2 Symbol search filters
Implemented now:
- symbol kind
- result count

Still future:
- language
- file pattern

### 8.3 Ranking strategy
Search is not naive substring-only matching.
Implemented now:
- lexical relevance
- metadata signals

Still future:
- fuzzy fallback
- centrality-aware ranking
- optional hybrid semantic ranking

### 8.4 Semantic search
Semantic search is optional and should be strictly additive.
Core product value must remain intact without embeddings.

### 8.5 Query suggestion
Add a helper that recommends useful follow-up queries and likely entry points when the user does not yet know symbol names.

---

## 9. Retrieval layer

### 9.1 Required retrieval capabilities
- get file content
- get symbol source
- get bounded context bundle
- get ranked context from a query

### 9.2 Symbol source retrieval
Support:
- single symbol lookup
- batch symbol lookup
- optional surrounding context lines
- optional verification via content hash

### 9.3 Context bundles
Provide a bounded contextual package around one or more symbols.

Implemented now:
- target symbol
- related imports via dependency selection
- deduplicated dependencies
- top-level budget counters (`tokenBudget`, `estimatedTokens`, `usedTokens`, `truncated`)

Still future:
- callers or richer related-symbol expansion
- a dedicated budget report object

### 9.4 Ranked context assembly
Allow query-driven context assembly under a token budget.
Ranking should combine relevance and structural importance where possible.

### 9.5 Snippet shaping
Always optimise output for agent consumption:
- include exact symbol body
- include only minimal surrounding context
- avoid unrelated file content
- avoid full files unless explicitly requested

---

## 10. Relationship and impact analysis

This should be a defined expansion path, not an afterthought.

### 10.1 Near-term additions
- find importers
- find references
- dependency graph
- related symbols
- class hierarchy
- blast radius
- symbol diff

### 10.2 Later additions
- call hierarchy
- impact preview
- hotspots
- coupling metrics
- dependency cycles
- extraction candidates
- dead code detection
- changed-symbol mapping from git diff

These belong in later phases, but the storage and symbol model should not block them.

---

## 11. Summarization layer

### 11.1 Role of summaries
Summaries improve navigation and ranking.
They are not the source of truth.

### 11.2 Fallback chain
Current implementation uses signature-derived summaries only.

Future target:
docstring → generated summary → signature fallback

### 11.3 Provider model
Allow optional summarization backends, including local-compatible backends.
The system must still work without them.

### 11.4 Performance model
If summaries are expensive, allow deferred or background summarization so indexing remains usable immediately.

---

## 12. Incremental indexing and freshness

### 12.1 Reindexing strategy
Support:
- full indexing
- single-file indexing
- incremental folder indexing

### 12.2 Freshness mechanisms
Implemented now:
- file hashes
- stale-index reporting in metadata

Still future:
- modification time shortcuts
- optional git tree SHA shortcuts

### 12.3 Watch mode
Not implemented yet.

Target state:
- watch daemon with debounce
- changed-file fast paths

### 12.4 Worktree awareness
Not implemented yet.

Target state:
- indexes can follow multi-worktree environments cleanly

---

## 13. Interface layer

### 13.1 MCP-first interface
The main interface should be an MCP server exposing capability-oriented tools.

### 13.2 CLI support
Implemented now:
- `init`
- `index folder`
- `index file`
- `diagnostics`

Still future:
- `watch`
- richer `config` commands

### 13.3 Diagnostics
Implemented now:
- storage path
- storage mode
- stale/fresh status
- indexed and current file counts
- snapshot hashes and drift reasons

Still future:
- active summarizer
- transport mode
- privacy settings
- watcher health

### 13.4 Policy support
Document an agent policy that encourages:
- outline before read
- search before file read
- retrieval before raw file scans

Do not rely on policy alone for correctness, but make the intended workflow explicit.

---

## 14. Security and safety

### 14.1 Required controls
Implemented now:
- common generated/dependency directory exclusion
- optional `.gitignore` intent in config

Still future or only partially addressed:
- explicit path traversal prevention
- symlink escape protection
- binary file exclusion
- safe encoding handling beyond UTF-8 source reads
- safe handling of configurable external endpoints
- optional source-root redaction

### 14.2 Integrity
Use checksum validation for persisted artifacts where practical.

---

## 15. Performance goals

### 15.1 Primary performance goals
- avoid reparsing during retrieval
- avoid loading full indexes unnecessarily
- avoid full result sorting when top-k ranking is enough
- reduce LLM round-trips through batch-oriented tools

### 15.2 Operational design goals
- responsive on medium and large repositories
- concurrent read/write safe during watch mode
- cheap cold-start repo listing through sidecars

---

## 16. Non-goals

- full IDE replacement
- large visual UI in v1
- enterprise permission system in v1
- graph database in v1
- mandatory embeddings in v1
- mandatory AI summaries in v1

---

## 17. Success criteria

### Functional
- agent can inspect repo structure without opening full files
- agent can search symbols and retrieve exact source by symbol id
- agent can request bounded context bundles under a token budget
- agent can refresh changed files without full rebuild

### Quality
- retrieval is deterministic and verifiable
- summaries are optional and non-authoritative
- index freshness is visible
- outputs are shaped for LLM consumption

### Performance
- retrieval avoids reparsing
- incremental refresh is materially faster than full reindex
- watch mode supports live development without blocking reads
  Current status: the first two are implemented; watch mode is still future work.

---

## 18. Implementation phases

### Phase 1
Status: implemented.

- Tree-sitter parser
- SQLite storage in WAL mode
- symbols/files/imports/raw cache tables
- index_folder / index_file
- get_file_tree / get_file_outline / get_repo_outline
- search_symbols / search_text
- get_symbol_source
- basic CLI diagnostics

### Phase 2
Status: partially implemented.

Implemented now:
- get_context_bundle
- query-driven ranked context assembly
- verification with content hash
- stale metadata
- query suggestion

Still future:
- watch mode with debounce
- optional summaries beyond signature fallback

### Phase 3
Status: not implemented yet.

- relationship and impact tools
- fuzzy and centrality-aware ranking
- optional semantic search
- worktree-aware watching
- snapshot diffs and changed symbols

---

## 19. Guiding principle

This system is not just a symbol index.

It is a local-first, deterministic retrieval and context-assembly layer for AI agents, designed to replace repeated whole-file reading with structure-first exploration and exact, budget-aware retrieval.
