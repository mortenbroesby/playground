# Skill Catalog Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the repo-owned skill catalog so agents get a smaller, higher-signal default skill surface, while keeping the broader checked-in catalog available for semi-regular and one-off use.

**Architecture:** Extend the generated skill registry with catalog-policy metadata and a lightweight usage cache, then make `scripts/skills.mjs` apply that policy consistently across `skills:list`, `skills:search`, `skills:route`, and `skills:read`. Keep task evidence as the dominant routing signal, use curated metadata as the durable ranking layer, and treat recency as an optional advisory tie-breaker.

**Tech Stack:** Node.js ESM scripts, checked-in markdown frontmatter, generated JSON registry artifact, local generated usage cache, `pnpm`, `rg`

---

### Task 1: Extend the skill metadata and registry contract for catalog policy

**Files:**
- Modify: `scripts/lib/skills-metadata.mjs`
- Modify: `scripts/lib/skills-registry.mjs`
- Modify: `.skills/README.md`
- Modify: `docs/superpowers/specs/2026-05-06-skill-catalog-cleanup-design.md` only if implementation uncovers a narrow contract correction

- [ ] **Step 1: Add catalog-policy fields to the metadata parser**

Extend the supported frontmatter contract in `scripts/lib/skills-metadata.mjs`
to include:

- `daily_driver`
- `agent_benefit`
- `catalog_group`
- `activation_mode`

Validation rules to implement:

- `daily_driver` must parse as boolean and default to `false`
- `agent_benefit` must parse as integer `1..5` and default to `3`
- `catalog_group` must be one of `workflow`, `support`, `specialist`, `imported`
- `activation_mode` must be one of
  `default`, `high-priority-when-relevant`, `quiet-until-strong-match`, `explicit-only`

- [ ] **Step 2: Extend the generated registry shape**

Update `scripts/lib/skills-registry.mjs` so `buildSkillRegistry()` emits the new
catalog fields for every skill entry alongside the existing routing metadata.

Registry entry target shape:

```json
{
  "id": "engineering-workflow",
  "display_name": "engineering-workflow",
  "description": "Use for spec, plan, build, test, review, simplify, or ship workflows.",
  "source_dir": ".skills/engineering-workflow",
  "source_skill_md_path": ".skills/engineering-workflow/SKILL.md",
  "tags": ["workflow", "implementation", "shipping"],
  "triggers": ["implement", "refactor"],
  "anti_triggers": ["review only"],
  "routing_weight": 2,
  "daily_driver": true,
  "agent_benefit": 5,
  "catalog_group": "workflow",
  "activation_mode": "default"
}
```

- [ ] **Step 3: Document the new contract**

Update `.skills/README.md` so it explains:

- the new catalog-policy fields
- the difference between routing metadata and catalog metadata
- that the generated registry remains canonical for machine-readable discovery
- that usage-cache state is local and non-canonical

### Task 2: Add a local usage-cache helper layer

**Files:**
- Create: `scripts/lib/skills-usage-cache.mjs`
- Modify: `scripts/skills.mjs`
- Modify: `scripts/skills-smoke.mjs`
- Modify: `scripts/prepush-checks.mjs` only if the cache or its validation path needs explicit handling

- [ ] **Step 1: Create a usage-cache module**

Add `scripts/lib/skills-usage-cache.mjs` with focused helpers such as:

- `getUsageCachePath(repoRoot)`
- `loadUsageCache(repoRoot)`
- `writeUsageCache(repoRoot, cache)`
- `recordSkillUsage(repoRoot, skillId, now = Date.now())`
- `getRecentUsageScore(cache, skillId, now = Date.now())`

Constraints to encode:

- missing cache returns an empty structure, not an error
- invalid cache can be ignored with a warning-level fallback or rebuilt silently
- cache writes should be deterministic enough for debugging but not checked in

- [ ] **Step 2: Make recency advisory only**

Implement a bounded or decayed recency score in the helper module. Keep the
score intentionally small so it can only warm already-relevant skills.

Working target behavior:

- a freshly used skill gets a modest positive score
- older usage decays
- repeated recent usage saturates instead of growing without bound

- [ ] **Step 3: Update usage only from actual loads**

Hook the cache into successful `skills:read` resolution in `scripts/skills.mjs`.
Do not update the cache from `skills:list` or `skills:search`.

If routing later records usage, only do so from an explicit successful load path
and not from a dry classifier query.

### Task 3: Make `pnpm skills:*` agent-first by default

**Files:**
- Modify: `scripts/skills.mjs`
- Modify: `scripts/skills-smoke.mjs`
- Modify: `package.json` only if new command aliases or flags are needed

- [ ] **Step 1: Refactor `skills:list` into policy-aware views**

Change the default `skills:list` behavior so it no longer dumps the full flat
catalog first.

Target CLI shape:

- `pnpm skills:list` -> curated agent-facing default view
- `pnpm skills:list --all` -> full catalog
- `pnpm skills:list --group workflow`
- `pnpm skills:list --daily-driver`

Default sort target:

1. daily drivers
2. higher `agent_benefit`
3. warmer recent usage
4. stable tiebreak by skill id

- [ ] **Step 2: Make `skills:search` policy-aware after relevance matching**

Keep metadata-first search, but after computing relevance:

1. apply activation mode
2. prefer daily drivers
3. prefer higher `agent_benefit`
4. use recent usage as a small tie-breaker

Output should include concise catalog hints such as:

- `[daily-driver]`
- `[group: specialist]`
- `[warm]` only if the signal materially affects ranking

- [ ] **Step 3: Make `skills:route` use catalog policy without weakening evidence**

Refactor route scoring into a two-stage model:

1. compute evidence-qualified candidates from triggers, tags, descriptions,
   anti-triggers, and routing weight
2. rank qualified candidates using activation mode, `daily_driver`,
   `agent_benefit`, and recency

Implementation rule:

- strong specialist evidence must still beat a generic workflow daily driver
- `quiet-until-strong-match` should lower default prominence but not block wins
  on strong evidence
- `explicit-only` should suppress automatic prominence unless the direct request
  names or near-names the skill

- [ ] **Step 4: Keep command output understandable**

Update route explanations so they name the winning reasons in order, for example:

- evidence match
- daily-driver boost
- benefit boost
- warm-recency tie-break

Keep JSON output stable or version the shape explicitly if it changes.

### Task 4: Migrate the daily-driver set first

**Files:**
- Modify: `.skills/engineering-workflow/SKILL.md`
- Modify: `.skills/brainstorming/SKILL.md`
- Modify: `.skills/planning-and-task-breakdown/SKILL.md`
- Modify: `.skills/incremental-implementation/SKILL.md`
- Modify: `.skills/test-driven-development/SKILL.md`
- Modify: `.skills/code-review-and-quality/SKILL.md`
- Modify: `.skills/debugging-and-error-recovery/SKILL.md`
- Modify: `.skills/documentation-and-adrs/SKILL.md`
- Modify: `.skills/using-superpowers/SKILL.md`
- Modify: `.skills/verification-before-completion/SKILL.md`
- Modify: `.skills/requesting-code-review/SKILL.md`
- Modify: `.skills/writing-plans/SKILL.md`
- Modify: `.skills/registry.generated.json`

- [ ] **Step 1: Mark the curated daily drivers**

Add frontmatter to the first-wave always-useful skills with likely defaults such
as:

- `daily_driver: true`
- `catalog_group: workflow` or `support`
- `agent_benefit: 4` or `5`
- `activation_mode: default`

- [ ] **Step 2: Preserve routing intent while adding catalog intent**

Do not overwrite the existing trigger and anti-trigger semantics that already
help routing. The new metadata should complement the current routing metadata,
not replace it with editorial ranking alone.

- [ ] **Step 3: Rebuild the registry after the first migration**

Run:

```bash
node scripts/skills.mjs registry
node scripts/skills.mjs registry --check
```

Expected:

- registry writes cleanly
- the generated file reflects the new catalog metadata

### Task 5: Migrate the broader support and specialist sets

**Files:**
- Modify: representative `.skills/*/SKILL.md` files for support and specialist skills
- Modify: `.skills/registry.generated.json`

- [ ] **Step 1: Migrate high-value support skills**

Cover semi-regular but useful support skills such as:

- `.skills/source-driven-development/SKILL.md`
- `.skills/context-engineering/SKILL.md`
- `.skills/frontend-design/SKILL.md`
- `.skills/browser-testing-with-devtools/SKILL.md`
- `.skills/webapp-testing/SKILL.md`
- `.skills/using-git-worktrees/SKILL.md`
- `.skills/gh-stack/SKILL.md`

Suggested defaults:

- `daily_driver: false`
- `agent_benefit: 3` or `4`
- `catalog_group: support` or `specialist`
- `activation_mode: high-priority-when-relevant`

- [ ] **Step 2: Migrate quiet specialist or imported skills**

Cover quieter checked-in skills such as:

- `.skills/claude-api/SKILL.md`
- `.skills/mcp-builder/SKILL.md`
- `.skills/skill-creator/SKILL.md`

Suggested defaults:

- `catalog_group: imported` or `specialist`
- `activation_mode: quiet-until-strong-match`
  or `explicit-only` if that better matches the skill’s intended use

- [ ] **Step 3: Rebuild the registry after the broader migration**

Run:

```bash
node scripts/skills.mjs registry
node scripts/skills.mjs registry --check
```

Expected:

- all migrated skills validate
- the registry remains deterministic

### Task 6: Clean up the catalog contract docs and verify end to end

**Files:**
- Modify: `AGENTS.md`
- Modify: `.agents/rules/skill-routing.md`
- Modify: `.agents/references/agent-runtimes/shared-contract.md`
- Modify: `vault/00 Repositories/playground/01 Architecture/Root Skills Architecture.md`
- Modify: `vault/00 Repositories/playground/02 Decisions/2026-04-29 Use Root Skills As Canonical Repo-Owned Skills Store.md`
- Modify: `docs/superpowers/specs/2026-05-06-skill-catalog-cleanup-design.md` only if implementation required a narrow correction
- Modify: `docs/superpowers/plans/2026-05-06-skill-catalog-cleanup.md` only for factual corrections discovered during execution

- [ ] **Step 1: Update the shared docs to describe the new catalog policy**

Make the docs explain:

- curated daily-driver skills
- broader checked-in catalog skills
- non-canonical local usage cache
- task-evidence-first routing

Keep startup-facing surfaces thin. The docs should describe the contract, not
turn into a second hand-maintained catalog.

- [ ] **Step 2: Run command-level verification**

Run:

```bash
pnpm skills:list
pnpm skills:list --all
pnpm skills:search workflow
pnpm skills:search claude api
pnpm skills:route "refactor shared agent hook logic"
pnpm skills:route "migrate a Python app from Claude 4.5 to 4.6"
pnpm skills:read engineering-workflow
pnpm skills:read claude-api
node scripts/skills.mjs registry --check
node scripts/skills-smoke.mjs
pnpm agents:check
pnpm lint:md
```

Expected:

- default list is clearly smaller and more agent-first than `--all`
- specialist search and route queries can still surface quiet catalog skills
- `skills:read` updates the usage cache without affecting committed files
- all checks pass

- [ ] **Step 3: Inspect the final diff and keep the slice focused**

Run:

```bash
git diff --stat
git diff -- scripts/skills.mjs scripts/lib .skills AGENTS.md .agents/rules/skill-routing.md .agents/references/agent-runtimes/shared-contract.md "vault/00 Repositories/playground/01 Architecture/Root Skills Architecture.md" "vault/00 Repositories/playground/02 Decisions/2026-04-29 Use Root Skills As Canonical Repo-Owned Skills Store.md" docs/superpowers/specs/2026-05-06-skill-catalog-cleanup-design.md docs/superpowers/plans/2026-05-06-skill-catalog-cleanup.md
```

Expected:

- diff stays focused on catalog metadata, ranking behavior, usage-cache support,
  and contract docs
- no unrelated runtime or hook behavior drifts into the slice
