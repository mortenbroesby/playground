# Astrograph Code-Index-MCP Parity Spec

## Status

Proposed on 2026-04-29.

This spec defines what it would take for `@astrograph/astrograph` to cover the
main use cases currently served by
[`johnhuang316/code-index-mcp`](https://github.com/johnhuang316/code-index-mcp)
without giving up Astrograph's stronger retrieval, diagnostics, and
repo-owned-local-first posture.

## Objective

Make Astrograph capable of serving both of these roles well:

1. a precise retrieval substrate for agent workflows
2. a more general-purpose code indexing and exploration MCP for arbitrary repos

The goal is not superficial feature-count parity. The goal is practical parity:
an engineer choosing between the two tools should no longer need
`code-index-mcp` for the common "explore and understand this repo" path.

## Problem

Today the tools are optimized for different jobs.

`code-index-mcp` is easier to choose when the user wants:

- broad mixed-language support
- shallow-first exploration with minimal setup
- explicit utility tools such as file finding and file summaries
- a more obvious "general code index MCP" mental model

Astrograph is easier to choose when the user wants:

- exact symbol and source retrieval
- bounded context assembly for agent use
- local freshness and health diagnostics
- graph-aware indexing and importer follow-up
- repo-owned control over retrieval behavior

So the current gap is not mainly retrieval quality. The gap is breadth,
exploration ergonomics, and generic-repo readiness.

## Target User

- an engineer or agent running inside an arbitrary local git repo
- often unfamiliar with the repo at the start of the session
- wanting the MCP to answer both broad exploration questions and precise source
  retrieval questions
- not wanting to think about whether they first need "shallow" or "deep"
  indexing knowledge before the tool is useful

## Non-Goals

- copying `code-index-mcp` tool-for-tool without adapting the design to
  Astrograph's existing architecture
- replacing Astrograph's exact retrieval contract with fuzzy convenience-first
  behavior
- attempting full multi-language semantic parity in one slice
- turning Astrograph into a hosted service
- deprecating `jcodemunch` as the repo's current default explorer in the same
  change set

## Product Decision

Astrograph should not try to become a generic search box first.

It should become a two-layer system:

1. a stable core retrieval engine:
   - indexing
   - symbol/source retrieval
   - graph-aware follow-up
   - diagnostics
   - bounded assembly
2. an exploration layer on top:
   - shallow-first onboarding
   - file-finding
   - file summaries
   - repo entry-point summaries
   - clearer generic-repo defaults

This preserves Astrograph's core advantage while closing the practical adoption
gap.

## Short Answer

For Astrograph to cover what `code-index-mcp` does, it needs five concrete
capability additions:

1. broader language and fallback coverage
2. simpler exploration-oriented MCP tools
3. a lighter shallow-first startup path
4. stronger zero-config behavior in arbitrary repos
5. higher-level human-friendly summaries built on indexed truth

## Comparison Baseline

This spec uses `code-index-mcp` as the comparison baseline for these user
stories:

- "set this project and let me start exploring"
- "find relevant files fast"
- "search this codebase by string or pattern"
- "summarize this file"
- "work across mixed-language repos reasonably well"
- "keep the index current enough that exploration stays useful"

This spec does not require Astrograph to copy every internal implementation
detail from `code-index-mcp`.

## Current Astrograph Strengths To Preserve

Astrograph already has important advantages documented in
[tools/ai-context-engine/README.md](/Users/macbook/personal/playground/tools/ai-context-engine/README.md)
and
[tools/ai-context-engine/docs/performance.md](/Users/macbook/personal/playground/tools/ai-context-engine/docs/performance.md):

- repo-local SQLite-backed index state
- exact symbol and source retrieval
- ranked, token-budgeted context assembly
- graph-aware symbol references
- importer refresh behavior
- diagnostics and doctor flows
- local observability and privacy controls
- benchmarked performance workflow

Parity work must not regress those strengths.

## Gap Analysis

### 1. Language And File Coverage Gap

Astrograph is still optimized around JS/TS-style indexed retrieval.

To match `code-index-mcp` in practical adoption, Astrograph needs:

- a clearly defined supported-language registry
- fallback indexing behavior for unsupported or partially supported languages
- useful repo/file exploration even when exact symbol extraction is unavailable
- graceful degraded behavior for non-code and config-heavy files

The real requirement is not "parse everything deeply." It is:

- index enough file types to make repo exploration useful
- expose support tiers honestly
- preserve high confidence on the languages Astrograph knows best

### 2. Exploration Tooling Gap

Astrograph's current shape is optimized for retrieval contracts such as
`query_code`, outlines, and source assembly.

To feel like a general exploration MCP, it needs more direct tools or intents
for:

- locating files by glob/path/name
- summarizing one file for a human or agent
- surfacing likely entry points in a repo
- showing a project setup/status view with fewer assumptions

The issue is not capability absence in principle. The issue is that the current
surface expects a more retrieval-aware user.

### 3. Onboarding And Mental Model Gap

`code-index-mcp` presents a simple progression:

1. set project
2. start exploring
3. build deeper index when needed

Astrograph is stronger under the hood, but less obviously staged for unfamiliar
repos.

To close that gap, Astrograph needs:

- a cheap initial scan mode
- explicit index readiness/status reporting
- clear escalation from overview to retrieval to deep assembly
- less dependence on repo-specific MCP habits

### 4. Generic Repo Defaults Gap

Astrograph is repo-owned and intentionally optimized for local control.

That is a strength, but it currently means generic adoption depends more on:

- tuned include/exclude settings
- supported-language expectations
- understanding local docs or local policies

Parity requires Astrograph to behave well enough in arbitrary repos with sane
defaults before any repo-specific tuning.

### 5. Human-Friendly Output Gap

`code-index-mcp` leans into direct prompts like:

- analyze this file
- show main components
- summarize structure

Astrograph currently emphasizes structured retrieval over explanatory summaries.

Parity requires a thin explanation layer on top of indexed truth, especially
for:

- file summaries
- repo entry points
- architecture overview hints
- "what should I read first?" guidance

## Proposed Capability Model

Astrograph should explicitly support three retrieval tiers per language or file
class.

### Tier 1: Discovery

Capabilities:

- file discovery
- path/glob matching
- indexed or live text search
- repo outline and file tree inclusion
- lightweight metadata summary

Applicable to:

- all supported source and support file classes
- fallback languages
- config and docs files where deep AST extraction is not worth doing

### Tier 2: Structured Retrieval

Capabilities:

- file outline
- symbol discovery
- exact symbol source
- indexed file summary

Applicable to:

- languages with reliable symbol extraction

### Tier 3: Graph-Aware Context

Capabilities:

- ranked context assembly
- importer/dependency follow-up
- graph-aware stale reporting
- bounded source bundles for agents

Applicable to:

- languages where import and symbol semantics are trustworthy enough to support
  dependency-aware retrieval

This model lets Astrograph broaden coverage without pretending every language is
equal.

## Required Product Changes

### A. Add A First-Class Discovery Layer

Astrograph should expose exploration-oriented tools or first-class `query_code`
intents for:

- `find_files`
- `search_text`
- `get_file_summary`
- `get_repo_entry_points`
- `get_project_status`

These can be implemented either as new MCP tools or as well-scoped `query_code`
intents, but the public UX must be obvious.

Recommended principle:

- keep exact retrieval and assembly in the current core path
- add exploration tools as stable, cheap front doors

### B. Add Shallow-First Indexing

Astrograph should support two explicit index states:

- discovery-ready
- deep-retrieval-ready

`index_folder` should be able to produce a fast discovery-ready state first,
then expand into deep retrieval where supported.

This does not need to copy `code-index-mcp`'s exact naming. It does need to
provide the same practical user benefit:

- fast initial usefulness
- transparent escalation path
- lower startup cost on large unfamiliar repos

### C. Add Language Registry And Support Tiers

Astrograph should replace implicit language assumptions with an explicit
registry describing:

- language id
- file extensions
- parser backend
- support tier
- summary strategy
- import/dependency support level

This registry becomes the source of truth for:

- indexing
- diagnostics
- tool availability
- README support claims

### D. Add Fallback Parsing And Fallback Summaries

For many file types, Astrograph does not need deep AST parity to be useful.

Fallback behavior should include:

- file metadata extraction
- path-aware categorization
- heading/section extraction where relevant
- text snippets or structural previews
- honest diagnostics that the file is discovery-only

Examples:

- Markdown: headings and top sections
- JSON/YAML: top-level keys and shape summary
- SQL: statement/object name heuristics
- shell: function names or simple command-block boundaries when safe

The principle is:

- broad discovery usefulness first
- deep extraction only where confidence is defensible

### E. Add Human-Friendly Summaries On Indexed Truth

Astrograph should provide summaries that are generated from index facts rather
than free-form guesses.

Minimum summary surfaces:

- file summary
- repo entry-point summary
- likely hot paths for a given query
- project status summary:
  - indexed files
  - support tiers present
  - stale state
  - watcher/backend status

These summaries should remain deterministic or near-deterministic and not
depend on an LLM call.

### F. Add Generic Repo Bootstrap

Astrograph should work well enough in arbitrary repos with:

- sane default include/exclude rules
- automatic detection of common generated-output folders
- project-root detection
- explicit readiness/status output after setup

This is necessary if Astrograph is meant to compete as a general MCP, not only
as a repo-owned subsystem.

## Recommended MCP Surface

This section defines a recommended public shape, not a required implementation
detail.

### Required User-Facing Tools Or Equivalent Intents

1. `index_folder`
   - builds discovery-ready state
   - deepens indexing where supported
2. `find_files`
   - glob/path/name search
3. `search_text`
   - text or regex search with predictable limits
4. `get_file_summary`
   - deterministic file-level summary
5. `get_repo_entry_points`
   - likely app/service/module starting points
6. `get_project_status`
   - index health, support tiers, watcher state, freshness
7. existing retrieval tools:
   - `query_code`
   - `get_file_outline`
   - `get_file_tree`
   - diagnostics/doctor paths

### Design Constraint

Do not force users to understand Astrograph internals before they can ask basic
questions like:

- what files matter here?
- where should I start reading?
- summarize this file
- is the index fresh enough to trust?

## Architecture Requirements

### 1. Keep The Existing Core Index Durable

The SQLite-backed truth layer should remain the backbone for:

- supported-language symbols
- source spans
- graph edges
- diagnostics
- observability

New exploration features should build on this where possible, not bypass it
with ad hoc shell-style logic.

### 2. Add A Discovery Table Or Cache Layer

Astrograph likely needs a lighter-weight discovery representation for:

- file inventory
- file-type class
- size and modification metadata
- fallback summary metadata
- top-level extracted hints

This layer should be cheap to refresh and useful even before deep parse paths
finish.

### 3. Separate Support Tiers In Storage And Diagnostics

Astrograph should track, per file:

- discovery indexed
- structured indexed
- graph-aware indexed
- stale
- unsupported
- failed to parse

Without this distinction, expanded coverage will blur into false confidence.

### 4. Preserve Deterministic Output Contracts

If Astrograph adds more summaries and discovery affordances, outputs still need:

- predictable limits
- stable schema
- explicit confidence/support indicators
- no hidden LLM dependence

## Phased Delivery Plan

### Phase 1: Exploration Surface

Goal:

- make Astrograph feel usable for broad repo exploration without waiting for
  graph-aware parity

Scope:

- `find_files`
- deterministic `get_file_summary`
- `get_project_status`
- explicit discovery-ready diagnostics

Acceptance bar:

- a user can point Astrograph at an unfamiliar repo and immediately answer:
  - what is here?
  - where should I start?
  - summarize this file

### Phase 2: Support-Tier Registry

Goal:

- make language/file coverage explicit and honest

Scope:

- language registry
- support-tier model
- diagnostics updates
- README support matrix

Acceptance bar:

- Astrograph can report exactly what level of support each indexed file class
  has

### Phase 3: Fallback Discovery Expansion

Goal:

- make mixed-language repos more useful without requiring full deep parsing

Scope:

- fallback summaries for config/docs/common secondary languages
- broader file discovery defaults
- lightweight extraction metadata

Acceptance bar:

- a mixed-language repo remains meaningfully explorable even when only part of
  it has deep retrieval support

### Phase 4: Shallow-First Index Lifecycle

Goal:

- reduce startup cost and improve mental model clarity

Scope:

- discovery-ready first pass
- deep-index follow-up
- status surfaces exposing readiness

Acceptance bar:

- Astrograph becomes useful quickly on large repos and clearly reports what is
  and is not ready

### Phase 5: High-Value Non-JS/TS Structured Retrieval

Goal:

- broaden deep retrieval where it matters most

Scope:

- one or two carefully chosen non-JS/TS pilots
- outlines and symbol source
- no promise of full graph-aware parity in the first slice

Acceptance bar:

- at least one non-JS/TS language supports real structured retrieval with clear
  tests and docs

## Acceptance Criteria

Astrograph can be considered practically parity-competitive for the target use
case when all of these are true:

- on an unfamiliar repo, a user can initialize Astrograph and get useful
  answers before deep indexing fully completes
- Astrograph can locate files by name/path/glob without requiring symbol-aware
  queries
- Astrograph can produce deterministic file summaries for supported and
  discovery-only file classes
- Astrograph reports index readiness and freshness clearly enough that users
  know when results are trustworthy
- Astrograph can explore mixed-language repos without silently treating
  unsupported files as invisible
- supported languages retain exact symbol/source retrieval and graph-aware
  context quality
- expanded exploration features do not depend on external network services or
  LLM calls

## Explicit Non-Acceptance Criteria

The work is not complete if:

- Astrograph claims support for file types it only barely tokenizes but cannot
  explain honestly
- new exploration paths bypass diagnostics and freshness reporting
- summary outputs become vague prose instead of fact-based structure
- the new surface regresses `query_code` precision or performance materially

## Verification

Product-level verification should include:

- initialize Astrograph against a repo with mixed file types and confirm
  discovery-ready status is available quickly
- confirm `find_files` returns bounded, stable results
- confirm `get_file_summary` works for:
  - a deep-supported source file
  - a discovery-only config/doc file
- confirm status output distinguishes:
  - discovery-ready
  - deep-retrieval-ready
  - stale
  - unsupported
- confirm existing exact source retrieval remains correct for JS/TS paths
- confirm diagnostics and doctor continue to expose freshness/health state after
  the new exploration layer lands

Implementation verification should eventually include targeted package checks
such as:

- `pnpm --filter @astrograph/astrograph type-check`
- `pnpm --filter @astrograph/astrograph test`
- `pnpm --filter @astrograph/astrograph test:package-bin`
- `pnpm markdown:check .specs/in_progress/astrograph-code-index-mcp-parity-spec.md tools/ai-context-engine/README.md`

## Open Questions

1. Should `find_files` and `get_file_summary` be separate MCP tools, or
   additional `query_code` intents?
2. Should discovery-ready indexing persist in the same SQLite schema or in a
   separate lightweight cache/table family?
3. Which non-JS/TS language is the highest-value first structured-retrieval
   pilot after fallback discovery lands?
4. How much of the fallback summary layer should be heuristic versus parser
   backed?
5. Does Astrograph need a project-path/init tool for generic MCP clients, or is
   repo-root-based indexing enough once install/bootstrap flows improve?

## Recommendation

Do this in slices, not as a parity megapatch.

The most valuable first move is not multi-language deep parsing. The most
valuable first move is an exploration layer that makes Astrograph obviously
useful in arbitrary repos while preserving its existing exact-retrieval
advantage.
