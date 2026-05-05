# Agent Workflow Consolidation Design

**Date:** 2026-05-05
**Status:** Approved for implementation

## Goal

Run a focused refactor that makes the repo's shared agent workflow easier to
follow by consolidating duplicated guidance, normalizing remaining Astrograph
era naming drift, and simplifying small pieces of agent infrastructure only
when that simplification is justified by the earlier consolidation work.

## Scope

This design covers three ordered phases:

1. Docs and workflow consolidation
2. Naming and artifact cleanup
3. Minimal agent/runtime simplification

The work is intentionally policy-first. It should improve clarity and reduce
maintenance overhead without changing the intended runtime behavior of the
shared `.agents` surface.

## Current Problems

- Workflow policy is repeated across `AGENTS.md`,
  `.agents/rules/repo-workflow.md`, `.skills/engineering-workflow/SKILL.md`,
  and vault architecture notes.
- Some durable filenames and titles still reflect transition-era framing even
  though the repo is now Astrograph-first.
- Small infrastructure helper surfaces still carry wording or structure that
  made sense during the migration but no longer earns its keep.

## Desired Outcome

After the refactor:

- `AGENTS.md` stays a thin bootstrap and points clearly at the canonical policy
  files.
- `.agents/rules/repo-workflow.md` becomes the primary always-on workflow
  contract for shared agent behavior in this repo.
- `.skills/engineering-workflow/SKILL.md` stays lifecycle-oriented and stops
  repeating large policy sections that belong in shared rules.
- Vault architecture and decision notes use current Astrograph-first naming and
  avoid stale transition framing in active durable notes.
- Runtime/helper simplifications are limited to cases where the first two
  phases exposed obvious redundancy.

## Approach Options

### Option A: Full content rewrite across all agent docs

Rewrite every overlapping file aggressively so each document is freshly
re-authored.

Pros:

- Maximum consistency
- Easy to remove all drift in one pass

Cons:

- High churn
- Higher risk of losing useful distinctions between bootstrap, rules, skills,
  and architecture notes

### Option B: Canonical-source consolidation with targeted cleanup

Keep each document's role, but rewrite overlaps so one source owns each kind of
guidance and the others point to it.

Pros:

- Clear ownership boundaries
- Lower risk than a full rewrite
- Produces durable, useful outcomes without gratuitous churn

Cons:

- Some duplication may remain where a short summary is appropriate

### Option C: Naming-only cleanup

Avoid structural changes and only rename stale files or terms.

Pros:

- Very low risk

Cons:

- Leaves the current policy overlap in place
- Misses the more valuable outcome

## Chosen Approach

Choose Option B.

This gives the repo a smaller set of canonical workflow documents while still
cleaning up stale naming and only simplifying infrastructure where the value is
obvious.

## Design

### Phase 1: Docs and workflow consolidation

- Keep `AGENTS.md` as a short bootstrap.
- Make `.agents/rules/repo-workflow.md` the canonical shared workflow and code
  navigation contract.
- Narrow `.skills/engineering-workflow/SKILL.md` to lifecycle guidance and repo
  adaptation, with less repeated policy text.
- Update the vault architecture note for agent rules so it explains the
  ownership model cleanly and matches the current repo state.

### Phase 2: Naming and artifact cleanup

- Rename stale active vault filenames whose names still encode old
  transition-era framing even though their content is now Astrograph-first.
- Update titles, ids, summaries, and related wording where needed so active
  durable notes and tasks use one vocabulary.
- Keep historical archived notes untouched unless they still present
  current-state guidance.

### Phase 3: Minimal agent/runtime simplification

- Only simplify helper files that are directly implicated by phases 1 or 2.
- Avoid broad runtime refactors.
- Prefer comment or wording cleanup over behavioral rewrites unless the earlier
  consolidation revealed dead complexity.

## File Ownership

- `AGENTS.md`: thin entrypoint and index
- `.agents/rules/repo-workflow.md`: canonical always-on workflow policy
- `.skills/engineering-workflow/SKILL.md`: lifecycle shape and repo adaptation
- `vault/00 Repositories/playground/01 Architecture/Agent Rules.md`:
  architecture rationale and ownership map
- selected active vault task and decision notes: current durable naming
- `.agents/hooks/lib/astrograph-code-navigation.mjs` and related helper files:
  only minimal cleanup if still justified after docs changes

## Non-Goals

- No broad rewrite of the entire vault
- No generated-file edits
- No behavior change to Astrograph or obsidian-memory tooling
- No speculative hook/runtime restructuring

## Verification

- `pnpm agents:check`
- `pnpm lint:md` if the markdown tooling is available and useful for touched
  docs
- targeted grep checks for stale active naming

## Risks And Mitigations

- Risk: over-consolidation erases useful distinctions between file roles
  Mitigation: keep bootstrap, rule, skill, and architecture layers distinct.

- Risk: renaming vault files breaks links
  Mitigation: search and update references as part of the rename step.

- Risk: infrastructure cleanup expands beyond the useful slice
  Mitigation: phase 3 is explicitly optional and minimal.
