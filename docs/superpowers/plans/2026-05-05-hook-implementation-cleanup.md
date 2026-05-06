# Hook Implementation Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the shared hook implementation layer by extracting repeated path and command evaluation logic, shrinking the main enforcement hooks, and landing only tiny justified policy corrections.

**Architecture:** Keep `.agents/hooks/lib/core.mjs` as the shared hook base, add helper extraction only where it removes real duplication, and leave each enforcement hook as a thin decision layer. Preserve behavior by default and keep any policy change explicit and small.

**Tech Stack:** Node.js ESM hook scripts, shared helper modules under `.agents/hooks/lib/`, `pnpm`, `rg`

---

### Task 1: Identify and extract repeated helper logic

**Files:**
- Modify: `.agents/hooks/lib/core.mjs`
- Create or modify: `.agents/hooks/lib/*.mjs`

- [ ] **Step 1: Extract reusable path or command evaluation helpers**

Move repeated rule-walk logic into shared helpers only where it is used by more
than one enforcement hook.

- [ ] **Step 2: Keep policy data near the owning hook where practical**

Do not move every rule into one giant registry. Extract only the generic
evaluation mechanics.

### Task 2: Simplify the main enforcement hooks

**Files:**
- Modify: `.agents/hooks/code-navigation-guard.mjs`
- Modify: `.agents/hooks/protect-files.mjs`
- Modify: `.agents/hooks/block-dangerous-commands.mjs`

- [ ] **Step 1: Reduce each entrypoint to parse → evaluate → return**

Refactor the hooks so they depend on the shared helpers and keep only the
hook-specific policy definitions and final decision logic.

- [ ] **Step 2: Preserve behavior by default**

Avoid policy churn unless a correction is clearly justified by the cleanup.

### Task 3: Apply tiny justified policy corrections

**Files:**
- Modify only the hook files above if needed

- [ ] **Step 1: Note any obvious false positive or uneven rule shape**

While refactoring, check whether a pattern is clearly too broad or too narrow.

- [ ] **Step 2: Land only small, easily justified corrections**

Skip this step entirely if no obvious cleanup-level policy fix appears.

### Task 4: Verify and finish

**Files:**
- No additional files beyond the spec and plan created above

- [ ] **Step 1: Run the setup verifier**

Run:

```bash
pnpm agents:check
```

Expected:

- command exits successfully

- [ ] **Step 2: Run markdown verification**

Run:

```bash
pnpm lint:md
```

Expected:

- command exits successfully

- [ ] **Step 3: Run targeted syntax checks if touched hook modules changed materially**

Run:

```bash
node --check .agents/hooks/code-navigation-guard.mjs
node --check .agents/hooks/protect-files.mjs
node --check .agents/hooks/block-dangerous-commands.mjs
node --check .agents/hooks/lib/core.mjs
```

Expected:

- all touched hook files parse successfully

- [ ] **Step 4: Inspect the final diff**

Run:

```bash
git diff --stat
git diff -- .agents/hooks/code-navigation-guard.mjs .agents/hooks/protect-files.mjs .agents/hooks/block-dangerous-commands.mjs .agents/hooks/lib docs/superpowers/specs/2026-05-05-hook-implementation-cleanup-design.md docs/superpowers/plans/2026-05-05-hook-implementation-cleanup.md
```

Expected:

- the diff stays focused on helper extraction, hook simplification, and small
  justified policy fixes
