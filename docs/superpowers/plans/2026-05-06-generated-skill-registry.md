# Generated Skill Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current filesystem-and-prose-heavy skill discovery flow with a generated registry derived from `.skills/*/SKILL.md`, then simplify the `pnpm skills:*` commands and the duplicated guidance that describes them.

**Architecture:** Keep skill authoring in `.skills/<skill>/SKILL.md`, add narrow metadata conventions in frontmatter, and generate one deterministic registry artifact that `scripts/skills.mjs` consumes for listing, searching, routing, and reading. Split the current all-in-one CLI into small registry-aware helpers so discovery, loading, and routing are explicit concerns instead of one file re-deriving everything ad hoc.

**Tech Stack:** Node.js ESM scripts, markdown frontmatter, generated JSON registry artifact, `pnpm`, `rg`

---

### Task 1: Define the metadata and registry contract

**Files:**
- Modify: `scripts/skills.mjs`
- Modify: `.skills/README.md`
- Modify: `.agents/rules/skill-routing.md`
- Create: `scripts/lib/skills-registry.mjs`
- Create: `scripts/lib/skills-metadata.mjs`

- [ ] **Step 1: Add a narrow metadata contract for repo-owned skills**

Define the metadata fields the registry will derive from each `SKILL.md`, using
frontmatter as the canonical machine-readable input. Start with:

- `name`
- `description`
- `tags`
- `triggers`
- `anti_triggers`
- `routing_weight`

- [ ] **Step 2: Document the new contract in the repo**

Update the skill authoring and routing docs so they describe the registry-first
model rather than command behavior inferred from raw markdown.

### Task 2: Build the generated registry

**Files:**
- Create: `scripts/lib/skills-registry.mjs`
- Create: `scripts/lib/skills-metadata.mjs`
- Create: `.skills/.metadata/registry.generated.json`
- Modify: `scripts/skills.mjs`

- [ ] **Step 1: Extract skill collection and metadata parsing out of `scripts/skills.mjs`**

Move skill crawling and frontmatter parsing into small helpers so the main CLI
stops owning every concern directly.

- [ ] **Step 2: Generate a deterministic registry artifact**

Create a generated registry file that includes:

- skill id
- display name
- description
- source directory
- source `SKILL.md` path
- tags
- triggers
- anti-triggers
- routing weight

- [ ] **Step 3: Ensure the registry can be rebuilt cheaply**

Make generation deterministic and cheap enough that the CLI can rebuild or
validate it without introducing heavy operational friction.

### Task 3: Refactor `pnpm skills:*` around the registry

**Files:**
- Modify: `scripts/skills.mjs`
- Modify: `package.json`
- Modify: `scripts/agent-setup-check.mjs` only if command expectations change

- [ ] **Step 1: Make `skills:list` registry-backed**

List registry entries instead of directory names discovered ad hoc at runtime.

- [ ] **Step 2: Make `skills:search` metadata-first**

Search names, descriptions, tags, and triggers first, then use content fallback
only if needed for a better result.

- [ ] **Step 3: Replace the current routing heuristic block with a registry-driven scorer**

Use explicit trigger and anti-trigger metadata plus a small deterministic scorer
instead of relying mostly on hard-coded prose heuristics.

- [ ] **Step 4: Keep `skills:read` source-backed**

Continue reading the actual `SKILL.md` files, but resolve the requested skills
through the registry so name resolution and metadata stay centralized.

### Task 4: Migrate a representative slice of skills to the new metadata shape

**Files:**
- Modify: representative `.skills/*/SKILL.md` files

- [ ] **Step 1: Update the core workflow skills first**

At minimum, migrate the most routing-critical skills such as:

- `.skills/engineering-workflow/SKILL.md`
- `.skills/brainstorming/SKILL.md`
- `.skills/planning-and-task-breakdown/SKILL.md`
- `.skills/code-review-and-quality/SKILL.md`
- `.skills/debugging-and-error-recovery/SKILL.md`
- `.skills/using-superpowers/SKILL.md`

- [ ] **Step 2: Add trigger and anti-trigger metadata where the router needs it most**

Focus the first migration on the skills that currently compete with one another
or have overlapping “load me” explanations.

### Task 5: Clean up duplicated skill-surface guidance

**Files:**
- Modify: `AGENTS.md`
- Modify: `.agents/rules/skill-routing.md`
- Modify: `.agents/references/agent-runtimes/shared-contract.md`
- Modify: `vault/00 Repositories/playground/01 Architecture/Root Skills Architecture.md`
- Modify: `vault/00 Repositories/playground/02 Decisions/2026-04-29 Use Root Skills As Canonical Repo-Owned Skills Store.md`

- [ ] **Step 1: Point docs to the registry-driven model**

Reduce repeated explanations of command-first discovery and routing behavior by
pointing to the registry-driven contract.

- [ ] **Step 2: Keep startup surfaces thin**

Do not let `AGENTS.md` or runtime adapter docs grow into new catalogs or
duplicate routing logic summaries.

### Task 6: Verify and finish

**Files:**
- No additional files beyond the spec and plan created above

- [ ] **Step 1: Verify the CLI commands end-to-end**

Run:

```bash
pnpm skills:list
pnpm skills:search skill
pnpm skills:route "refactor shared agent hook logic"
pnpm skills:read engineering-workflow
```

Expected:

- each command exits successfully
- outputs are registry-backed and still understandable

- [ ] **Step 2: Run repo checks**

Run:

```bash
pnpm agents:check
pnpm lint:md
```

Expected:

- both commands exit successfully

- [ ] **Step 3: Inspect the final diff**

Run:

```bash
git diff --stat
git diff -- package.json scripts/skills.mjs scripts/lib .skills AGENTS.md .agents/rules/skill-routing.md .agents/references/agent-runtimes/shared-contract.md "vault/00 Repositories/playground/01 Architecture/Root Skills Architecture.md" "vault/00 Repositories/playground/02 Decisions/2026-04-29 Use Root Skills As Canonical Repo-Owned Skills Store.md" docs/superpowers/specs/2026-05-06-generated-skill-registry-design.md docs/superpowers/plans/2026-05-06-generated-skill-registry.md
```

Expected:

- the diff stays focused on the generated-registry refactor, skill metadata
  migration, and duplicated-guidance cleanup
