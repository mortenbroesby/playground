# Astrograph Code-Index-MCP Parity Spec

## Status

Proposed on 2026-04-29.

## Objective

Make `@mortenbroesby/astrograph` competitive with
[`johnhuang316/code-index-mcp`](https://github.com/johnhuang316/code-index-mcp)
for the common local-repo workflow:

1. point the tool at an unfamiliar repo
2. get useful exploration answers quickly
3. deepen into precise retrieval without switching tools

The target is practical parity, not tool-count parity. An engineer should not
need `code-index-mcp` for the normal "explore and understand this repo"
experience once Astrograph lands the scope in this spec.

## Problem

Today the two tools win on different jobs.

`code-index-mcp` is easier to choose when the user wants:

- mixed-language coverage that is useful immediately
- a shallow-first exploration path with minimal setup
- obvious file-level utilities such as file search and file summaries
- a clear "general code index MCP" mental model

Astrograph is easier to choose when the user wants:

- exact symbol and source retrieval
- bounded context assembly for agent workflows
- local freshness and health diagnostics
- graph-aware indexing and importer follow-up
- repo-owned, local-first control over retrieval behavior

The gap is not mainly retrieval quality. The gap is exploration ergonomics,
coverage breadth, and generic-repo readiness.

## Target User

- an engineer or agent operating inside an arbitrary local git repo
- often unfamiliar with the repo at session start
- needing both broad exploration and exact retrieval from one tool
- not wanting to reason about indexing internals before the tool becomes useful

## Scope Boundary

This spec covers parity for repo exploration and onboarding. It does not claim:

- full multi-language semantic parity in one slice
- hosted or remote-first Astrograph behavior
- replacement of Astrograph's exact retrieval contract with fuzzy convenience
- deprecation of `jcodemunch` as the repo default explorer in this repo
- feature-by-feature cloning of `code-index-mcp`

## Product Decision

Astrograph should become a two-layer system:

1. a stable retrieval core
2. a lightweight exploration layer built on indexed truth

The retrieval core remains responsible for indexing, exact source retrieval,
graph-aware follow-up, diagnostics, and bounded context assembly.

The exploration layer adds the affordances that make Astrograph usable in an
unfamiliar repo before a user understands its internals:

- file finding
- text search
- deterministic file summaries
- repo entry-point hints
- explicit readiness and freshness reporting

This is the core decision in the spec: Astrograph should not become a generic
search box first, but it must gain a general-purpose exploration front door.

## Comparison Baseline

This spec treats `code-index-mcp` as the baseline for these user stories:

- set up the repo and start exploring quickly
- find relevant files by name, path, or pattern
- search text across the codebase with bounded results
- summarize a file without understanding its internal symbols first
- keep exploring effectively in mixed-language repos
- trust that freshness and index readiness are visible enough to avoid stale
  guesses

The goal is to meet or beat that baseline while preserving Astrograph's current
advantages.

## Current Astrograph Strengths To Preserve

Astrograph already has important strengths documented in the standalone
repository:

- [Astrograph README](https://github.com/mortenbroesby/astrograph)
- [performance docs](https://github.com/mortenbroesby/astrograph/blob/main/docs/performance.md)

- repo-local SQLite-backed index state
- exact symbol and source retrieval
- ranked, token-budgeted context assembly
- graph-aware symbol references
- importer refresh behavior
- diagnostics and doctor flows
- local observability and privacy controls
- benchmarked performance workflow

Parity work must not materially regress those strengths.

## Practical Parity Definition

Astrograph is parity-competitive for this spec when a user in an unfamiliar
repo can:

1. initialize or confirm index readiness quickly
2. discover relevant files without symbol-aware queries
3. get deterministic summaries for both deep-supported and discovery-only files
4. understand what support tier and freshness level a result carries
5. escalate from shallow exploration into exact retrieval without switching
   tools

## Gap Analysis

### 1. Coverage Gap

Astrograph is still optimized around JS/TS-style indexed retrieval. Practical
parity requires:

- an explicit supported-language registry
- fallback discovery behavior for unsupported or partial-support file classes
- useful exploration even when exact symbol extraction is unavailable
- honest degraded behavior for non-code and config-heavy files

The requirement is not "deeply parse everything." The requirement is "make the
repo explorable across common file types without pretending unsupported files do
not exist."

### 2. Exploration Surface Gap

Astrograph's current surface is retrieval-aware. It expects the caller to think
in terms of outlines, symbols, and source assembly.

For general exploration, the caller instead wants:

- find files
- search text
- summarize this file
- show likely entry points
- tell me whether the index is fresh enough to trust

The issue is surface design, not underlying ambition.

### 3. Onboarding Gap

`code-index-mcp` offers an intuitive progression:

1. set project
2. start exploring
3. deepen only when needed

Astrograph needs the same practical progression even if the internals differ.
That requires:

- a cheap discovery-ready state
- explicit readiness reporting
- a visible escalation path from discovery to structured retrieval

### 4. Generic Repo Defaults Gap

Astrograph's repo-owned posture is a strength, but generic adoption currently
depends too much on tuned includes, supported-language assumptions, and local
docs. Practical parity requires sane default behavior in arbitrary repos before
repo-specific tuning.

### 5. Human-Friendly Output Gap

Astrograph emphasizes structured retrieval. `code-index-mcp` is easier to use
for direct exploration prompts.

Practical parity requires a deterministic explanation layer built on indexed
facts for:

- file summaries
- repo entry-point summaries
- likely hot paths
- project status output

## Capability Model

Astrograph should explicitly report three support tiers per language or file
class.

### Tier 1: Discovery

Capabilities:

- file discovery
- path and glob matching
- indexed or live text search
- repo outline and file tree inclusion
- lightweight metadata and structure summaries

Applies to:

- all supported source files
- fallback languages
- config and docs files where deep AST extraction is unnecessary or unreliable

### Tier 2: Structured Retrieval

Capabilities:

- file outline
- symbol discovery
- exact symbol source
- indexed file summary

Applies to:

- languages with reliable symbol extraction

### Tier 3: Graph-Aware Context

Capabilities:

- ranked context assembly
- importer and dependency follow-up
- graph-aware stale reporting
- bounded source bundles for agents

Applies to:

- languages whose import and symbol semantics are reliable enough for
  dependency-aware retrieval

This tiering broadens coverage without implying all languages are equal.

## Must-Have Capabilities For This Parity Proposal

The following capabilities are in scope for practical parity and should be
treated as must-haves:

1. `find_files` for path, glob, and name search
2. `search_text` for bounded indexed or live text search
3. `get_file_summary` for deterministic summaries on both deep-supported and
   discovery-only files
4. `get_project_status` for readiness, support tiers, freshness, and watcher
   health
5. a discovery-ready lifecycle distinct from deep-retrieval-ready
6. an explicit language registry with support-tier reporting
7. fallback discovery summaries for common docs and config formats

Without these, Astrograph still depends on retrieval-aware users and does not
close the exploration gap.

## Later-Phase Expansion

The following work is valuable but not required for practical parity in the
first slice:

- high-value non-JS/TS structured retrieval pilots
- richer repo entry-point ranking
- more advanced architecture summaries
- broader parser-backed fallback strategies beyond the initial common formats
- further query ergonomics improvements on top of the first-class exploration
  layer

## Required Product Changes

### A. Add A First-Class Discovery Layer

Astrograph should expose exploration-oriented entry points for:

- `find_files`
- `search_text`
- `get_file_summary`
- `get_repo_entry_points`
- `get_project_status`

Default recommendation:

- make `find_files`, `search_text`, `get_file_summary`, and
  `get_project_status` first-class MCP tools
- allow `query_code` to remain the primary structured retrieval surface
- treat `get_repo_entry_points` as either a first-class tool or a stable
  `query_code` intent, depending on whether implementation naturally depends on
  retrieval ranking logic

Decision rule:

- use a separate tool when the action is a general exploration primitive a user
  should discover without knowing Astrograph internals
- use a `query_code` intent when the action is better understood as retrieval
  policy layered on top of existing ranked context behavior

### B. Add Shallow-First Indexing

Astrograph should expose two visible readiness states:

- discovery-ready
- deep-retrieval-ready

`index_folder` should be able to deliver discovery usefulness quickly, then
deepen indexing where supported.

### C. Add A Language Registry

Astrograph should replace implicit assumptions with an explicit registry that
defines:

- language id
- file extensions
- parser backend
- support tier
- summary strategy
- import and dependency support level

This registry should drive indexing, diagnostics, tool availability, and
published support claims.

### D. Add Fallback Discovery Summaries

Fallback behavior should include:

- file metadata extraction
- path-aware categorization
- heading or section extraction where relevant
- structural previews or key snippets
- explicit discovery-only diagnostics

Examples:

- Markdown: headings and opening sections
- JSON and YAML: top-level keys and shape summary
- SQL: statement and object-name heuristics
- shell: function names or safe command-block boundaries

### E. Add Deterministic Human-Friendly Summaries

Astrograph should provide summaries generated from index facts rather than
free-form prose generation.

Minimum summary surfaces:

- file summary
- repo entry-point summary
- likely hot paths for a query
- project status summary

Output constraints:

- stable schema
- predictable limits
- explicit confidence and support indicators
- no hidden LLM dependency

### F. Add Generic Repo Bootstrap Defaults

Astrograph should work reasonably in arbitrary repos with:

- sane default include and exclude behavior
- generated-output folder detection
- project-root detection
- explicit readiness output after setup

## Recommended MCP Surface

This is the recommended public shape for parity-oriented exploration.

### First-Class Exploration Tools

1. `index_folder`
2. `find_files`
3. `search_text`
4. `get_file_summary`
5. `get_project_status`

These should be cheap to discover, easy to explain, and valid for users who do
not yet know Astrograph's retrieval model.

### Retrieval And Deepening Tools

1. `query_code`
2. `get_file_outline`
3. `get_file_tree`
4. diagnostics and doctor flows
5. `get_repo_entry_points` if it is implemented as a ranked retrieval intent

### Design Constraint

Users should not need to understand Astrograph internals before they can ask:

- what files matter here
- where should I start reading
- summarize this file
- is the index fresh enough to trust

## Architecture Requirements

### 1. Preserve The Existing Core Index

The SQLite-backed truth layer should remain the backbone for:

- supported-language symbols
- source spans
- graph edges
- diagnostics
- observability

New exploration behavior should build on this layer where possible.

### 2. Add A Lightweight Discovery Representation

Astrograph likely needs a cheap discovery layer for:

- file inventory
- file-class classification
- size and modification metadata
- fallback summary metadata
- top-level extracted hints

This layer should stay useful even before deep parse paths finish.

### 3. Track Support Tier Per File

Astrograph should track, per file:

- discovery indexed
- structured indexed
- graph-aware indexed
- stale
- unsupported
- parse failed

Without this distinction, broader coverage becomes false confidence.

### 4. Keep Output Contracts Deterministic

Exploration additions must preserve:

- predictable limits
- stable schema
- explicit confidence markers
- no network or LLM dependency for summary generation

## Phased Delivery Plan

### Phase 1: Exploration Surface And Status

Goal:

- make Astrograph immediately useful in unfamiliar repos

Scope:

- `find_files`
- `search_text`
- `get_file_summary`
- `get_project_status`
- discovery-ready diagnostics

Acceptance bar:

- a user can initialize Astrograph and answer what is here, where to start, and
  whether the index is trustworthy enough to keep exploring

### Phase 2: Support-Tier Registry And Fallback Discovery

Goal:

- make coverage explicit and mixed-language exploration useful

Scope:

- language registry
- support-tier diagnostics
- fallback summaries for common docs and config formats
- generic repo bootstrap defaults

Acceptance bar:

- unsupported or discovery-only file classes are visible, explorable, and
  honestly labeled

### Phase 3: Shallow-First Lifecycle

Goal:

- reduce startup cost and make readiness states obvious

Scope:

- discovery-ready first pass
- deep-index follow-up
- readiness reporting tied to both states

Acceptance bar:

- Astrograph becomes useful quickly on large repos and clearly reports what is
  still deepening

### Later Expansion: High-Value Structured Retrieval Beyond JS And TS

Goal:

- broaden deep retrieval where it has the highest product value

Scope:

- one or two non-JS/TS pilots
- structured outlines and symbol source
- clear tests and docs

This is explicitly after the practical-parity slice above.

## Acceptance Criteria

Astrograph is parity-competitive for this target workflow when all of these are
true:

- on an unfamiliar repo, a user can initialize Astrograph and get useful
  answers before deep indexing fully completes
- Astrograph can locate files by name, path, or glob without requiring
  symbol-aware queries
- Astrograph can search text with bounded, predictable results
- Astrograph can produce deterministic file summaries for both deep-supported
  and discovery-only file classes
- Astrograph reports readiness, freshness, and support tier clearly enough that
  users know when results are trustworthy
- mixed-language repos remain explorable instead of silently hiding unsupported
  files
- supported languages retain exact symbol and source retrieval plus graph-aware
  context quality
- exploration features do not depend on external services or hidden LLM calls

## Non-Acceptance Criteria

The work is not complete if:

- Astrograph claims support for file types it cannot explain honestly
- exploration paths bypass diagnostics or freshness reporting
- summaries devolve into vague prose rather than fact-based structure
- the new surface materially regresses `query_code` precision or performance
- unsupported files disappear from exploration results without explicit labeling

## Verification

### Spec Review Verification For This Iteration

This spec pass is complete when:

- the scope boundary clearly distinguishes practical parity from full semantic
  parity
- the document identifies must-have capabilities versus later-phase expansion
- the recommended MCP surface states a default choice for tool-versus-intent
  ambiguity
- acceptance and non-acceptance criteria are concrete enough to review
- the markdown document passes the repo markdown check for this file

### Future Implementation Verification

Product-level verification for implementation should include:

- initialize Astrograph against a mixed-file repo and confirm discovery-ready
  status appears quickly
- confirm `find_files` returns bounded and stable results
- confirm `search_text` returns bounded and stable results
- confirm `get_file_summary` works for both a deep-supported source file and a
  discovery-only config or docs file
- confirm status output distinguishes discovery-ready, deep-retrieval-ready,
  stale, unsupported, and parse-failed states
- confirm existing exact source retrieval remains correct for JS/TS paths
- confirm diagnostics and doctor still expose freshness and health state after
  the exploration layer lands

Implementation checks should eventually include at least:

- `pnpm --dir ../astrograph type-check`
- `pnpm --dir ../astrograph test`
- `pnpm --dir ../astrograph test:package-bin`

## Open Questions

1. Should `get_repo_entry_points` ship first as a standalone tool or as a
   retrieval intent layered on `query_code`?
2. Should discovery-ready state live in the existing SQLite schema or in a
   separate lightweight table family?
3. Which non-JS/TS language is the highest-value first structured-retrieval
   pilot after parity lands?
4. How much of the fallback summary layer should stay heuristic versus
   parser-backed in the first mixed-language slice?
5. Does generic client adoption require a project-init or path-selection tool,
   or are repo-root indexing defaults sufficient once bootstrap UX improves?

## Recommendation

Do this in slices, not as a parity megapatch.

The first win is not deep multi-language parsing. The first win is making
Astrograph obviously useful for unfamiliar-repo exploration while preserving
its exact-retrieval advantage.
