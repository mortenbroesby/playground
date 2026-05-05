# Agent Workflow Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate shared agent workflow guidance, normalize active Astrograph-first naming, and simplify only the small runtime surfaces that remain redundant after that cleanup.

**Architecture:** Keep one canonical owner for each kind of guidance. `AGENTS.md` stays thin, `.agents/rules/repo-workflow.md` owns always-on workflow policy, `.skills/engineering-workflow/SKILL.md` owns lifecycle guidance, and vault notes explain architecture and decisions. Naming cleanup updates active durable artifacts to one vocabulary, and runtime simplification is limited to obvious residue.

**Tech Stack:** Markdown docs, repo-local agent rules and skills, shared hook helpers, `pnpm`, `rg`

---

### Task 1: Consolidate the workflow docs

**Files:**
- Modify: `AGENTS.md`
- Modify: `.agents/rules/repo-workflow.md`
- Modify: `.skills/engineering-workflow/SKILL.md`
- Modify: `vault/00 Repositories/playground/01 Architecture/Agent Rules.md`

- [ ] **Step 1: Rewrite the bootstrap and canonical-policy boundaries**

Update the files so:

- `AGENTS.md` stays short and points to canonical owners.
- `.agents/rules/repo-workflow.md` owns the durable workflow policy.
- `.skills/engineering-workflow/SKILL.md` focuses on lifecycle shape and repo adaptation.
- the vault architecture note explains the same ownership model.

- [ ] **Step 2: Verify the consolidation reads consistently**

Run:

```bash
rg -n "Code Exploration Policy|Repo Workflow|engineering-workflow|Astrograph|obsidian-memory" AGENTS.md .agents/rules/repo-workflow.md .skills/engineering-workflow/SKILL.md "vault/00 Repositories/playground/01 Architecture/Agent Rules.md"
```

Expected:

- the files still mention the current retrieval and memory tools
- the overlap is reduced
- the ownership boundaries are obvious

### Task 2: Normalize active naming and artifact language

**Files:**
- Modify or rename: `vault/00 Repositories/playground/02 Decisions/2026-04-25 Use Official MCP SDK With Astrograph.md`
- Modify or rename: `vault/00 Repositories/playground/04 Tasks/tasks/rebuild-astrograph-style-code-intelligence-layer.md`
- Modify references that point at the renamed notes

- [ ] **Step 1: Rename active durable notes to Astrograph-first filenames**

Rename files whose current filenames still encode old naming even though their
content is already Astrograph-first.

- [ ] **Step 2: Rewrite titles, summaries, ids, and references**

Update frontmatter and any inbound references so the renamed notes remain
coherent and searchable.

- [ ] **Step 3: Verify stale active naming is gone**

Run:

```bash
rg -n "jcodemunch|Jcodemunch|Keep Jcodemunch Fallback" vault .agents .skills AGENTS.md CLAUDE.md AGENT_HOOKS.md -g '!**/03 Sessions/**' -g '!docs/superpowers/**'
```

Expected:

- no remaining active current-state guidance uses the old naming
- any remaining matches are either intentional archives or generated output

### Task 3: Apply minimal runtime/helper simplification

**Files:**
- Review: `.agents/hooks/lib/astrograph-code-navigation.mjs`
- Review: `.agents/settings.cjs`
- Modify only if the earlier tasks expose redundant wording or structure

- [ ] **Step 1: Inspect helper files for redundancy exposed by the docs cleanup**

Limit changes to wording, comments, or tiny structural cleanup that make the
shared agent surface easier to understand.

- [ ] **Step 2: Avoid speculative behavior changes**

Do not change runtime behavior unless a change is clearly dead, redundant, and
safe.

### Task 4: Verify and finish

**Files:**
- No new files beyond the spec and plan created above

- [ ] **Step 1: Run repo validation**

Run:

```bash
pnpm agents:check
```

Expected:

- command exits successfully

- [ ] **Step 2: Run markdown-oriented verification if useful**

Run:

```bash
pnpm lint:md
```

Expected:

- command exits successfully, or if unavailable, note that it is unavailable

- [ ] **Step 3: Inspect the final diff**

Run:

```bash
git diff --stat
git diff -- AGENTS.md .agents/rules/repo-workflow.md .skills/engineering-workflow/SKILL.md "vault/00 Repositories/playground/01 Architecture/Agent Rules.md" "vault/00 Repositories/playground/02 Decisions" "vault/00 Repositories/playground/04 Tasks/tasks" .agents/hooks/lib/astrograph-code-navigation.mjs .agents/settings.cjs docs/superpowers/specs/2026-05-05-agent-workflow-consolidation-design.md docs/superpowers/plans/2026-05-05-agent-workflow-consolidation.md
```

Expected:

- the diff is limited to the planned consolidation, naming cleanup, and small
  justified simplifications
