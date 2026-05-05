# Agent Runtime Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the shared agent runtime contract, trim duplicated adapter guidance, and preserve runtime behavior unless a small registration cleanup is clearly justified.

**Architecture:** Keep one canonical shared runtime contract in `.agents/references/agent-runtimes/shared-contract.md`, keep `AGENT_HOOKS.md` policy-focused, and reduce runtime-specific notes to concrete adapter facts. Treat `.claude/settings.json` and `.codex/hooks.json` as behavior-preserving registration adapters rather than documentation surfaces.

**Tech Stack:** Markdown docs, JSON hook adapters, shared hook scripts, `pnpm`, `rg`

---

### Task 1: Consolidate the shared runtime contract

**Files:**
- Modify: `.agents/references/agent-runtimes/shared-contract.md`
- Modify: `AGENT_HOOKS.md`

- [ ] **Step 1: Rewrite the contract ownership boundaries**

Update the shared contract so it more clearly distinguishes:

- shared implementation surfaces
- adapter-specific registration
- portable hook events versus runtime extensions

- [ ] **Step 2: Trim the hook policy note**

Update `AGENT_HOOKS.md` so it describes repo hook policy and points back to the
shared contract and workflow policy instead of partially duplicating them.

- [ ] **Step 3: Verify the docs now have clearer roles**

Run:

```bash
rg -n "shared contract|adapter|SessionStart|UserPromptSubmit|PreToolUse|PostToolUse|Stop|Notification" .agents/references/agent-runtimes/shared-contract.md AGENT_HOOKS.md
```

Expected:

- `shared-contract.md` reads like the canonical contract
- `AGENT_HOOKS.md` reads like a policy note, not a second contract

### Task 2: Tighten runtime-specific adapter notes

**Files:**
- Modify: `.agents/references/agent-runtimes/claude.md`
- Modify: `.agents/references/agent-runtimes/codex.md`

- [ ] **Step 1: Reduce repeated shared-contract language**

Keep only runtime-specific entrypoints, behavior notes, and adapter facts in
the Claude and Codex notes.

- [ ] **Step 2: Link each runtime note back to the canonical shared contract**

Make the connection explicit so future edits land in the correct source file.

- [ ] **Step 3: Verify the runtime notes remain concrete**

Run:

```bash
rg -n "shared-contract|entry points|Current Repo Setup|Behavior Notes|portable shared events|adapter extension" .agents/references/agent-runtimes/claude.md .agents/references/agent-runtimes/codex.md
```

Expected:

- both notes still explain their runtime-specific setup
- the duplicated shared-contract prose is reduced

### Task 3: Apply minimal adapter cleanup only if justified

**Files:**
- Review: `.claude/settings.json`
- Review: `.codex/hooks.json`

- [ ] **Step 1: Compare the adapter docs against the actual registration files**

Check whether the docs cleanup exposed any stale or contradictory registration
detail.

- [ ] **Step 2: Change registration only if the redundancy is obvious and safe**

Preserve behavior by default. Skip this step if the current adapters are still
coherent.

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

- [ ] **Step 3: Inspect the final diff**

Run:

```bash
git diff --stat
git diff -- AGENT_HOOKS.md .agents/references/agent-runtimes/shared-contract.md .agents/references/agent-runtimes/claude.md .agents/references/agent-runtimes/codex.md .claude/settings.json .codex/hooks.json docs/superpowers/specs/2026-05-05-agent-runtime-cleanup-design.md docs/superpowers/plans/2026-05-05-agent-runtime-cleanup.md
```

Expected:

- the diff stays focused on adapter cleanup and shared runtime clarity
