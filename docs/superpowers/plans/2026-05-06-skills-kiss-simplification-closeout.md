# Skills KISS Simplification Closeout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish and safely ship the in-progress simplification of the repo-owned skills system so it uses a smaller, deterministic policy model and remains easy to recover if the session is interrupted.

**Architecture:** Keep the public command surface unchanged at repo root (`pnpm skills:list|search|read|route|registry`) while simplifying the underlying policy model inside `tools/agent-skills`. Replace the multi-knob policy (`routing_weight`, `daily_driver`, `agent_benefit`, `activation_mode`) and hidden recency state with a smaller explicit model (`group`, `tier`) plus evidence-driven ranking.

**Tech Stack:** TypeScript, `tsup`, Node.js, `pnpm`, checked-in `.skills/.metadata/*.json` artifacts, Husky hooks.

---

## File Structure

Current touched files and responsibilities:

- Modify: [.skills/.metadata/registry.metadata.json](/Users/macbook/personal/playground/.skills/.metadata/registry.metadata.json)
  - Canonical checked-in per-skill metadata. Target shape is `tags`, `triggers`, `anti_triggers`, `group`, `tier`.
- Modify: [.skills/.metadata/registry.generated.json](/Users/macbook/personal/playground/.skills/.metadata/registry.generated.json)
  - Deterministic generated artifact rebuilt from `SKILL.md` identity plus `registry.metadata.json`.
- Modify: [.skills/README.md](/Users/macbook/personal/playground/.skills/README.md)
  - Human-facing contract for the simplified metadata model.
- Modify: [tools/agent-skills/src/lib/skills-metadata.ts](/Users/macbook/personal/playground/tools/agent-skills/src/lib/skills-metadata.ts)
  - Parser and validator for checked-in metadata. Must accept only the reduced schema.
- Modify: [tools/agent-skills/src/lib/skills-registry.ts](/Users/macbook/personal/playground/tools/agent-skills/src/lib/skills-registry.ts)
  - Loader/emitter for the generated registry. Must emit and validate `group` and `tier`.
- Modify: [tools/agent-skills/src/lib/skills-routing.ts](/Users/macbook/personal/playground/tools/agent-skills/src/lib/skills-routing.ts)
  - Evidence scoring, search ranking, default list behavior, and route selection. Must be deterministic and not rely on hidden local usage state.
- Delete: [tools/agent-skills/src/lib/skills-usage-cache.ts](/Users/macbook/personal/playground/tools/agent-skills/src/lib/skills-usage-cache.ts)
  - No longer needed after removing warm-recency behavior.
- Modify: [tools/agent-skills/src/cli.ts](/Users/macbook/personal/playground/tools/agent-skills/src/cli.ts)
  - CLI output and argument handling. Must stop advertising deprecated flags and stop recording usage.
- Modify: [tools/agent-skills/src/skills-smoke.test.ts](/Users/macbook/personal/playground/tools/agent-skills/src/skills-smoke.test.ts)
  - Regression contract for the simplified schema and output.
- Modify: [tools/agent-skills/scripts/skills-smoke.mjs](/Users/macbook/personal/playground/tools/agent-skills/scripts/skills-smoke.mjs)
  - Wrapper that builds and runs the smoke test using package-local `dist/`.
- Modify: [tools/agent-skills/package.json](/Users/macbook/personal/playground/tools/agent-skills/package.json)
  - Keep one stable internal script surface per action; remove duplicate aliases where possible.
- Modify: [.gitignore](/Users/macbook/personal/playground/.gitignore)
  - Remove the stale usage-cache ignore entry now that the feature is gone.

Target metadata example:

```json
{
  "frontend-design": {
    "tags": ["ui", "layout"],
    "triggers": ["design review", "visual polish"],
    "anti_triggers": ["api bug"],
    "group": "specialist",
    "tier": "normal"
  }
}
```

Target registry entry example:

```ts
type RegistrySkill = {
  id: string;
  display_name: string;
  description: string;
  tags: string[];
  triggers: string[];
  anti_triggers: string[];
  group: "workflow" | "support" | "specialist" | "imported";
  tier: "daily" | "normal" | "quiet" | "explicit";
};
```

### Task 1: Reconfirm the Simplified Metadata Contract

**Files:**
- Modify: [tools/agent-skills/src/lib/skills-metadata.ts](/Users/macbook/personal/playground/tools/agent-skills/src/lib/skills-metadata.ts)
- Modify: [tools/agent-skills/src/lib/skills-registry.ts](/Users/macbook/personal/playground/tools/agent-skills/src/lib/skills-registry.ts)
- Modify: [.skills/README.md](/Users/macbook/personal/playground/.skills/README.md)

- [x] **Step 1: Verify the only supported checked-in metadata fields are the reduced set**

Expected allowed fields:

```ts
const SUPPORTED_SKILL_METADATA_FIELDS = [
  "tags",
  "triggers",
  "anti_triggers",
  "group",
  "tier",
];
```

- [x] **Step 2: Verify the only allowed enum values are the simplified sets**

Expected values:

```ts
const ALLOWED_GROUPS = ["workflow", "support", "specialist", "imported"];
const ALLOWED_TIERS = ["daily", "normal", "quiet", "explicit"];
```

- [x] **Step 3: Run typecheck on the package**

Run:

```bash
pnpm --filter @playground/agent-skills run typecheck
```

Expected: PASS with no TypeScript errors.

- [x] **Step 4: Verify docs describe only `group` and `tier`**

Run:

```bash
rg -n "routing_weight|daily_driver|agent_benefit|catalog_group|activation_mode" .skills/README.md tools/agent-skills/src/lib/skills-metadata.ts tools/agent-skills/src/lib/skills-registry.ts
```

Expected: no matches.

- [ ] **Step 5: Commit the metadata-contract slice**

```bash
git add .skills/README.md tools/agent-skills/src/lib/skills-metadata.ts tools/agent-skills/src/lib/skills-registry.ts
git commit -m "refactor: simplify skills metadata contract"
```

### Task 2: Reconfirm Deterministic Ranking and CLI Output

**Files:**
- Modify: [tools/agent-skills/src/lib/skills-routing.ts](/Users/macbook/personal/playground/tools/agent-skills/src/lib/skills-routing.ts)
- Modify: [tools/agent-skills/src/cli.ts](/Users/macbook/personal/playground/tools/agent-skills/src/cli.ts)
- Delete: [tools/agent-skills/src/lib/skills-usage-cache.ts](/Users/macbook/personal/playground/tools/agent-skills/src/lib/skills-usage-cache.ts)
- Modify: [.gitignore](/Users/macbook/personal/playground/.gitignore)

- [x] **Step 1: Verify the default list is driven only by `tier === "daily"`**

Expected default filter:

```ts
return entry.skill.tier === "daily";
```

- [x] **Step 2: Verify policy ranking does not use hidden usage state**

Run:

```bash
rg -n "recentUsageScore|warm-recency|usageCache|loadUsageCache|getRecentUsageScore" tools/agent-skills/src/lib/skills-routing.ts tools/agent-skills/src/cli.ts
```

Expected: no matches.

- [x] **Step 3: Verify the usage-cache module is gone and the ignore entry is removed**

Run:

```bash
test ! -f tools/agent-skills/src/lib/skills-usage-cache.ts
rg -n "usage-cache.local.json" .gitignore tools/agent-skills/src tools/agent-skills/scripts
```

Expected: deleted module, and no remaining references.

- [x] **Step 4: Verify list/search output uses the simplified hints**

Run:

```bash
pnpm skills:list
pnpm skills:search workflow
```

Expected output shape:

```text
engineering-workflow: ... [group: workflow] [tier: daily]
```

- [ ] **Step 5: Commit the routing/CLI simplification slice**

```bash
git add .gitignore tools/agent-skills/src/lib/skills-routing.ts tools/agent-skills/src/cli.ts tools/agent-skills/src/lib/skills-usage-cache.ts
git commit -m "refactor: remove hidden skills ranking state"
```

### Task 3: Rebuild Artifacts and Reconfirm Metadata Curation

**Files:**
- Modify: [.skills/.metadata/registry.metadata.json](/Users/macbook/personal/playground/.skills/.metadata/registry.metadata.json)
- Modify: [.skills/.metadata/registry.generated.json](/Users/macbook/personal/playground/.skills/.metadata/registry.generated.json)

- [x] **Step 1: Rebuild the generated registry from the simplified metadata**

Run:

```bash
pnpm skills:registry
```

Expected:

```text
Wrote .skills/.metadata/registry.generated.json
```

- [x] **Step 2: Verify the generated artifact is current**

Run:

```bash
pnpm skills:registry -- --check
```

Expected:

```text
Skill registry is current: .skills/.metadata/registry.generated.json
```

- [x] **Step 3: Verify the curated daily set is intentionally small**

Run:

```bash
pnpm skills:list
```

Expected: only the small curated daily-driver replacement set appears by default:

```text
brainstorming
code-review-and-quality
debugging-and-error-recovery
engineering-workflow
planning-and-task-breakdown
using-superpowers
verification-before-completion
writing-plans
```

- [x] **Step 4: Verify no old metadata keys remain in the checked-in metadata files**

Run:

```bash
rg -n "routing_weight|daily_driver|agent_benefit|catalog_group|activation_mode" .skills/.metadata/registry.metadata.json .skills/.metadata/registry.generated.json
```

Expected: no matches.

- [ ] **Step 5: Commit the metadata-artifact slice**

```bash
git add .skills/.metadata/registry.metadata.json .skills/.metadata/registry.generated.json
git commit -m "refactor: simplify skills catalog tiers"
```

### Task 4: Reconfirm Package Runner and Smoke Harness Simplicity

**Files:**
- Modify: [tools/agent-skills/package.json](/Users/macbook/personal/playground/tools/agent-skills/package.json)
- Modify: [tools/agent-skills/scripts/skills-smoke.mjs](/Users/macbook/personal/playground/tools/agent-skills/scripts/skills-smoke.mjs)
- Modify: [tools/agent-skills/src/skills-smoke.test.ts](/Users/macbook/personal/playground/tools/agent-skills/src/skills-smoke.test.ts)

- [x] **Step 1: Verify duplicate internal package scripts are gone**

Run:

```bash
cat tools/agent-skills/package.json
```

Expected scripts section contains only:

```json
{
  "build": "tsup",
  "typecheck": "tsc --noEmit true --allowImportingTsExtensions true",
  "agent-skills": "node scripts/skills.mjs",
  "skills:smoke": "node scripts/skills-smoke.mjs",
  "skills:metadata-hook": "node scripts/skills-metadata-hook.mjs"
}
```

- [x] **Step 2: Verify the smoke wrapper builds first and then runs the package-local dist test**

Expected command shape in the wrapper:

```js
spawnSync("pnpm", ["--filter", "@playground/agent-skills", "run", "build"], ...)
spawnSync("node", ["--test", "dist/skills-smoke.test.js"], ...)
```

- [x] **Step 3: Run the package smoke test**

Run:

```bash
pnpm --filter @playground/agent-skills run skills:smoke
```

Expected: PASS with the smoke suite green.

- [x] **Step 4: Verify the smoke test asserts the simplified output contract**

Run:

```bash
rg -n "\\[tier: daily\\]|\\[tier: quiet\\]|group: workflow|group: imported" tools/agent-skills/src/skills-smoke.test.ts
```

Expected: matches only the new `group/tier` contract.

- [ ] **Step 5: Commit the package-surface slice**

```bash
git add tools/agent-skills/package.json tools/agent-skills/scripts/skills-smoke.mjs tools/agent-skills/src/skills-smoke.test.ts
git commit -m "refactor: trim agent-skills package surface"
```

### Task 5: Final Verification, Diff Review, and Ship

**Files:**
- Review only: current working tree

- [x] **Step 1: Run the hook gates**

Run:

```bash
./.husky/pre-commit
./.husky/pre-push
```

Expected: both commands exit successfully.

- [x] **Step 2: Run the full repo test suite**

Run:

```bash
pnpm test
```

Expected: PASS across the full repo.

- [x] **Step 3: Inspect the final diff for scope discipline**

Run:

```bash
git diff --stat
git diff -- .skills .gitignore tools/agent-skills
```

Expected: only the skills KISS simplification surfaces are touched:
- schema/doc cleanup
- generated metadata artifacts
- routing and CLI simplification
- package runner cleanup
- usage-cache removal

- [ ] **Step 4: Commit the final closeout if the work is still uncommitted**

```bash
git add .gitignore .skills tools/agent-skills
git commit -m "refactor: simplify skills policy model"
```

- [ ] **Step 5: Push**

```bash
git push origin main
```

Expected: branch updates successfully on `origin/main`.

## Self-Review

Spec coverage:
- Simplified metadata schema: covered in Task 1 and Task 3.
- Deterministic ranking with no hidden warm state: covered in Task 2.
- Smaller visible daily set: covered in Task 3.
- Leaner package surface and smoke harness: covered in Task 4.
- Safe verification and ship sequence: covered in Task 5.

Placeholder scan:
- No TBD/TODO placeholders remain.
- All commands are explicit.
- The target metadata and registry shapes are shown inline.

Type consistency:
- Plan uses `group` and `tier` consistently.
- Plan treats `skills:list|search|read|route|registry` as the stable root command surface.
- Plan treats `tools/agent-skills` as the implementation package.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-06-skills-kiss-simplification-closeout.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
