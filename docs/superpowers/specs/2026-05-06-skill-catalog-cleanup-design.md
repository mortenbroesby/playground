# Skill Catalog Cleanup Design

**Date:** 2026-05-06
**Status:** Draft for review

## Goal

Refactor the repo-owned skill catalog so agents see a smaller, higher-signal
default skill surface while preserving the broader checked-in catalog for
semi-regular and one-off use.

The main problem is no longer discovery plumbing. The generated registry exists
now. The remaining problem is catalog policy: which skills should be prominent,
which should stay quiet until strongly relevant, and how recency should affect
suggestions without becoming the source of truth.

## Scope

This design covers:

1. catalog-layer metadata for repo-owned skills
2. agent-first ranking and listing behavior
3. a lightweight local usage cache
4. command-surface changes for `pnpm skills:*`
5. cleanup of docs that describe the skill catalog contract

This design does not:

- rewrite every skill body in one pass
- remove checked-in specialist skills
- replace the generated registry
- treat recency as the canonical source of skill priority

## Current Problems

- `pnpm skills:list` exposes a long flat mixed catalog.
- Many skills still have minimal metadata, so the catalog cannot distinguish
  “used constantly” from “valuable but occasional” from “quiet specialist”.
- Agents need a strong default surface for task selection, but the registry only
  knows about triggers, exclusions, and routing weight today.
- Imported-but-checked-in skills such as `claude-api` are valid catalog entries,
  but they should not be as prominent as repo-core daily-driver skills.
- The repo now has a registry-first discovery model, but it does not yet have a
  catalog policy model.

## External Patterns

Useful comparisons:

- Claude Code subagents are selected from metadata about purpose and when to use
  them, rather than from one flat always-equal list:
  https://docs.anthropic.com/en/docs/claude-code/sub-agents
- OpenHands splits microagents into always-loaded repository guidance and
  keyword-triggered agents, which is a clean “always on vs on demand” split:
  https://docs.all-hands.dev/usage/prompting/microagents-overview
  https://docs.all-hands.dev/modules/usage/prompting/microagents-keyword
- Cursor separates reusable guidance into `Always`, `Auto Attached`, and
  `Agent Requested`, plus memories as a dynamic layer:
  https://docs.cursor.com/context/rules
  https://docs.cursor.com/context/memories

The useful shared idea is explicit activation policy. Good systems do not treat
every reusable prompt or rule as equally prominent.

## Desired Outcome

After this refactor:

- the repo still keeps one checked-in `.skills/` tree
- the generated registry still remains the machine-readable source of truth
- agents get a curated high-salience default catalog
- broader catalog skills remain available, but quieter by default
- ranking uses a combination of durable editorial metadata and a small adaptive
  recency signal
- recency improves tie-breaking without overwhelming task relevance

## Design Principles

- Task evidence comes first.
- Curated importance should be explicit, not inferred from prose length.
- The catalog should reflect how often a skill helps agents in practice.
- Recency should warm a skill, not redefine the catalog.
- Default command output should be agent-first, not exhaustive.

## Catalog Model Options

### Option A: Curated daily-driver list only

Add one frontmatter flag such as `daily_driver: true`.

Pros:

- simple
- easy to explain
- easy to review

Cons:

- too binary
- does not distinguish highly useful occasional skills from low-value long-tail
  skills
- gets stale unless curated constantly

### Option B: Curated list plus editorial benefit score

Add:

- `daily_driver: true|false`
- `agent_benefit: 1-5`

Pros:

- stable and understandable
- allows gradation
- no runtime state needed

Cons:

- misses useful adaptive behavior
- cannot reflect what is warm in the current project phase

### Option C: Curated list plus benefit score plus lightweight recency

Add:

- `daily_driver: true|false`
- `agent_benefit: 1-5`
- `catalog_group`
- local usage cache

Pros:

- best balance of editorial control and adaptation
- lets “used constantly” and “high-value when relevant” coexist cleanly
- keeps long-tail skills available without letting them dominate

Cons:

- more implementation work
- requires a small non-canonical local state surface

### Option D: Usage-adaptive only

Let LRU-style history dominate prominence.

Pros:

- automatically adapts

Cons:

- unstable
- easily overfits to yesterday’s work
- hides infrequent but correct specialist skills

## Chosen Approach

Choose Option C.

The catalog needs three signals, not one:

1. `daily_driver`
   Explicit curated “used all the time” signal.
2. `agent_benefit`
   Durable editorial judgment about how much a skill helps when relevant.
3. `recent_usage`
   Lightweight adaptive signal for warming, not for truth.

This best matches the desired model:

- a clear curated daily-driver set
- a broader checked-in catalog for semi-regular and one-off use
- adaptive ranking that stays subordinate to task evidence

## Metadata Contract

Extend repo-owned skill metadata with:

- `daily_driver`
  - type: boolean
  - default: `false`
- `agent_benefit`
  - type: integer
  - range: `1..5`
  - default: `3`
- `catalog_group`
  - type: enum
  - allowed values:
    - `workflow`
    - `support`
    - `specialist`
    - `imported`
  - default:
    - inferred where safe
    - otherwise required during migration
- `activation_mode`
  - type: enum
  - allowed values:
    - `default`
    - `high-priority-when-relevant`
    - `quiet-until-strong-match`
    - `explicit-only`
  - default: `default`

Keep existing routing-oriented metadata:

- `name`
- `description`
- `tags`
- `triggers`
- `anti_triggers`
- `routing_weight`

### Meaning of the new fields

- `daily_driver`
  means “agents should see this as part of the high-salience default surface”
- `agent_benefit`
  means “this skill tends to materially help agents when it is relevant”
- `catalog_group`
  gives the registry a durable structural grouping
- `activation_mode`
  expresses desired prominence behavior more clearly than numeric weights alone

## Usage Cache

Add a lightweight local cache outside the checked-in skill files.

Suggested shape:

- location:
  `./.skills/usage-cache.json` or another repo-local generated path
- contents:
  - skill id
  - last used at timestamp
  - decayed usage score or bounded hit count

Constraints:

- not committed
- safe to delete
- optional at runtime
- should degrade gracefully if missing

The cache should be updated only from actual skill resolution paths such as:

- `skills:read`
- explicit router-selected loads
- possibly explicit runtime skill-load hooks later

It should not be updated by passive list or search commands.

## Ranking Model

### Core rule

Task evidence must dominate.

Recency only affects ranking after relevance has already established a candidate
set.

### Candidate Formula A: Balanced weighted score

For `skills:route`:

`route_score = evidence * 100 + routing_weight * 8 + benefit * 6 + daily_driver_boost + recency_boost + activation_adjustment`

Where:

- `evidence` comes from trigger, description, tag, and anti-trigger scoring
- `daily_driver_boost` is modest
- `recency_boost` is smaller than `daily_driver_boost`
- `activation_adjustment` can penalize `quiet-until-strong-match` and
  `explicit-only` unless evidence is strong

Pros:

- easy to reason about
- preserves task evidence dominance

Cons:

- numeric tuning can drift into guesswork

### Candidate Formula B: Two-stage ranking

1. build a relevance-qualified candidate set from evidence
2. rank that candidate set by:
   - `daily_driver`
   - `agent_benefit`
   - `recent_usage`
   - `catalog_group`

Pros:

- easier to explain
- prevents recency from surfacing irrelevant skills

Cons:

- threshold tuning matters more

### Candidate Formula C: Activation-mode first

1. score evidence
2. classify candidates by activation mode
3. order within each activation bucket by benefit and recency

Pros:

- conceptually clean
- clearer than only numeric weighting

Cons:

- more categorical policy to maintain

## Recommended Ranking Strategy

Use Formula B with activation-mode adjustments from Formula C.

This keeps the system understandable:

1. qualify by relevance
2. apply activation policy
3. break ties with curated importance and warm recency

Recommended precedence:

1. evidence score
2. activation mode
3. `daily_driver`
4. `agent_benefit`
5. `recent_usage`

## Command Contract Changes

Breaking changes are acceptable here.

### `pnpm skills:list`

Default behavior:

- show only the high-salience agent-facing catalog
- daily drivers first
- then warm high-benefit skills

Additional views:

- `--all`
- `--group <workflow|support|specialist|imported>`
- `--daily-driver`
- `--cold`

### `pnpm skills:search <query>`

Default behavior:

- search across the full registry
- rank by match quality first
- then apply catalog policy

Output should show:

- skill id
- short description
- catalog group
- daily-driver marker when applicable
- why it ranked highly if the output remains concise

### `pnpm skills:route "<task>"`

Default behavior:

- task evidence remains primary
- use catalog policy only after relevance qualification
- quieter specialist/imported skills can still win on strong evidence

Output should explain:

- why the primary skill won
- whether a daily-driver or benefit/recency boost affected the result

### `pnpm skills:read <skill>`

- keep source-backed
- update usage cache on successful resolution

## Migration Strategy

### First migration set

Start with skills that drive most agent work:

- `engineering-workflow`
- `brainstorming`
- `planning-and-task-breakdown`
- `incremental-implementation`
- `test-driven-development`
- `code-review-and-quality`
- `debugging-and-error-recovery`
- `documentation-and-adrs`
- `using-superpowers`
- `verification-before-completion`
- `requesting-code-review`
- `writing-plans`

Likely defaults:

- these become `daily_driver: true`
- most get `catalog_group: workflow` or `support`

### Second migration set

Normalize semi-regular but high-value skills such as:

- `source-driven-development`
- `context-engineering`
- `frontend-design`
- `browser-testing-with-devtools`
- `webapp-testing`
- `using-git-worktrees`
- `gh-stack`

### Third migration set

Mark quieter or imported specialist skills explicitly, for example:

- `claude-api`
- `mcp-builder`
- `skill-creator`
- other checked-in niche skills

These likely land as:

- `catalog_group: imported` or `specialist`
- `activation_mode: quiet-until-strong-match`

## Ralph Execution Track

Recommended Ralph track:

- `STORY-1`
  Extend registry metadata and validate the new catalog fields.
- `STORY-2`
  Add usage-cache support and keep it non-canonical and optional.
- `STORY-3`
  Refactor `skills:list`, `skills:search`, and `skills:route` to use the new
  catalog policy model.
- `STORY-4`
  Migrate the first daily-driver skill set.
- `STORY-5`
  Migrate the broader support and specialist sets.
- `STORY-6`
  Clean up docs and verify the new catalog surface end to end.

Each story should keep one stable invariant:

- the registry stays the machine-readable source of truth
- the usage cache stays advisory only
- task evidence stays dominant over warm history

## Risks And Mitigations

- Risk: the catalog becomes overly editorial and hard to maintain
  Mitigation: keep the new metadata surface narrow and reviewable.

- Risk: usage history overpowers relevance
  Mitigation: apply recency only after relevance qualification and keep the
  boost small.

- Risk: daily-driver inflation makes the curated set meaningless
  Mitigation: keep the daily-driver set intentionally small and review it as a
  curated surface, not a participation trophy.

- Risk: imported skills become invisible even when correct
  Mitigation: allow strong evidence to override quiet-default placement.

- Risk: command output becomes more complex than helpful
  Mitigation: keep the default output concise and make deeper views opt-in.

## Verification

- `node scripts/skills.mjs registry --check`
- targeted tests for ranking and usage-cache behavior
- `pnpm skills:list`
- `pnpm skills:list --all`
- `pnpm skills:search <query>` with daily-driver and specialist queries
- `pnpm skills:route "<task>"` with workflow, support, and specialist prompts
- `pnpm skills:read <skill>` and confirm usage-cache update behavior
- `pnpm agents:check`
- `pnpm lint:md`

## Recommendation

Proceed with the curated-plus-benefit-plus-recency design.

This gives the repo:

- a clear daily-driver set for regular agent work
- a broader checked-in catalog for semi-regular and one-off use
- a small adaptive layer that makes good skills easier to rediscover without
  letting history overpower the task
