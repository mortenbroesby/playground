# Generated Skill Registry Design

**Date:** 2026-05-06
**Status:** Approved for implementation

## Goal

Refactor the repo-owned skill surface so discovery and routing use a generated
registry instead of re-deriving intent from filesystem layout and free-form
skill prose every time.

The canonical authoring source should remain the skill files under `.skills/`,
but the machine-readable source for listing, searching, and routing should
become a generated registry derived from lightweight metadata conventions.

## Scope

This design covers:

1. skill metadata conventions
2. generated registry creation
3. `pnpm skills:*` contract changes
4. cleanup of duplicated skill-loading and routing guidance

This design does not attempt to redesign the content of every existing skill in
one pass beyond what the new metadata shape requires.

## Current Problems

- `scripts/skills.mjs` currently owns listing, searching, reading, and routing
  in one implementation surface, but it has to infer too much from directory
  structure and prose.
- Routing quality is constrained because trigger signals and exclusions are not
  represented explicitly enough.
- The repo contains repeated explanations of how skills are discovered and when
  they should load.
- The top-level `.skills/` surface mixes authoring content with discovery and
  routing concerns.

## External Reference

OpenHarness is a useful comparison because it separates `loader` and `registry`
concerns in its skills system rather than letting the skill content files act as
the only runtime structure.

The relevant idea is the separation of concerns, not the Python package layout:
https://github.com/HKUDS/OpenHarness/tree/main/src/openharness/skills

## Desired Outcome

After the refactor:

- `.skills/<skill>/SKILL.md` remains the authoring home.
- A generated registry becomes the canonical machine-readable view of repo-owned
  skills.
- `pnpm skills:list`, `skills:search`, and `skills:route` consume the generated
  registry instead of inferring as much ad hoc structure from raw markdown.
- Routing becomes more explicit through metadata such as tags, trigger hints,
  exclusions, and optional routing weight hints.
- Duplicated guidance about skill discovery and routing is reduced because the
  registry model becomes the source of truth.

## Approach Options

### Option A: Folder cleanup only

Reorganize `.skills/` folders and names without changing discovery architecture.

Pros:

- Lower implementation cost
- Minimal churn to tooling

Cons:

- Does not materially improve routing quality
- Leaves discovery logic implicit

### Option B: Generated registry from skill metadata

Keep authoring in `.skills/`, add lightweight metadata conventions, and generate
the registry consumed by the CLI.

Pros:

- Clear separation between content and runtime discovery
- Better routing quality
- Keeps human-authored skill content as the canonical source

Cons:

- Requires migration of existing skills to the new metadata shape
- Introduces a generation step

### Option C: Hand-authored central registry

Maintain a separate registry file manually in the repo.

Pros:

- Explicit and easy for tooling to consume

Cons:

- Creates a second canonical editing surface
- Easy to let content and registry drift

## Chosen Approach

Choose Option B.

The repo should keep one human-authored source of truth for skills while still
providing a cleaner and more explicit machine-readable registry for discovery
and routing.

## Design

### Skill authoring source

- Repo-owned skills remain under `.skills/<skill>/SKILL.md`.
- Each skill gains lightweight structured metadata, preferably in frontmatter.
- Metadata should stay narrow and routing-oriented rather than turning skills
  into large config files.

Suggested metadata shape:

- `name`
- `description`
- `tags`
- `triggers`
- `anti_triggers`
- `routing_weight`
- `allowed-tools` if already used by the skill ecosystem

### Generated registry

- Add a generated registry artifact derived from skill files.
- The registry should include:
  - canonical skill id
  - display name
  - description
  - source path
  - tags
  - trigger hints
  - anti-trigger hints
  - routing weight or priority hints
- The generated file should be deterministic and cheap to rebuild.

### CLI refactor

`scripts/skills.mjs` should stop acting like a mostly filesystem-first explorer
and become a thin consumer of the registry.

Expected direction:

- `skills:list`: list registry entries
- `skills:search`: search metadata first, then optionally fall back to content
- `skills:route`: use explicit routing metadata and simple scoring over the
  registry
- `skills:read`: still resolves and prints the selected source skill files

Breaking changes are acceptable in this round if they simplify the contract.

### Routing behavior

- Route selection should become more explicit and less heuristic-only.
- Favor a small deterministic scorer rather than a giant hard-coded taxonomy.
- Use anti-triggers to avoid obvious false positives.
- Keep the output easy to read and explain.

### Documentation cleanup

- Reduce repeated skill-loading explanations across `AGENTS.md`,
  `.agents/rules/skill-routing.md`, runtime references, and architecture notes.
- Point those surfaces back to the registry-driven model once it exists.

## Non-Goals

- No attempt to perfectly solve semantic routing in one pass
- No migration to a runtime-specific skill installation model
- No second manual registry as a parallel source of truth
- No rewrite of every skill body beyond what the metadata migration needs

## Verification

- targeted checks for generated registry correctness
- `pnpm agents:check`
- `pnpm lint:md`
- command-level verification of `pnpm skills:list`, `skills:search`,
  `skills:route`, and `skills:read`

## Risks And Mitigations

- Risk: metadata becomes too verbose and duplicates the skill body
  Mitigation: keep metadata narrow and routing-oriented.

- Risk: the generated registry becomes stale
  Mitigation: make generation deterministic and cheap; ensure the CLI rebuilds
  or validates when needed.

- Risk: routing gets more complex without becoming better
  Mitigation: prefer a small explicit scorer and use anti-triggers to reduce the
  worst false positives first.
