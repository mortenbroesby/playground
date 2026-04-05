---
name: wave-orchestration
description: "Use this skill when dispatching multiple Claude sub-agents to work in parallel on independent tasks, when decomposing a large implementation into isolated work streams with no file overlap, or when you need to orchestrate sequential waves where Wave N unblocks Wave N+1."
version: 1.0.0
---

# Wave Orchestration

A pattern for dispatching Claude sub-agents in coordinated parallel waves so that large implementations complete faster, with zero merge conflicts, and full orchestrator control over git history.

---

## 1. The Wave Pattern

An orchestrator agent decomposes a large task into groups of independent work units called **waves**. Within each wave, all agents run in true parallel. The orchestrator waits for every agent in Wave N to complete before dispatching Wave N+1.

```
Orchestrator
  │
  ├── Wave 1 ──┬── Agent A (owns files: X, Y)
  │            ├── Agent B (owns files: P, Q)
  │            └── Agent C (owns files: M, N)
  │            └── [wait for all three]
  │
  ├── git commit (Wave 1 checkpoint)
  │
  ├── Wave 2 ──┬── Agent D (owns files: R, S — depends on X from Wave 1)
  │            └── [wait]
  │
  ├── git commit (Wave 2 checkpoint)
  │
  └── Wave 3 ── Agent E (owns files: README.md)
```

**Strict file ownership is the invariant that makes this safe.** Each file is owned by exactly one agent across the entire run. Because no two agents ever write to the same path, there are no conflicts to resolve — not even optimistic ones.

---

## 2. Waves vs. Pure Parallel

**Use pure parallel** (a single wave) when all tasks are completely independent — no agent's output is an input to any other agent.

**Use waves** when a dependency exists at the file level: Agent D needs a file that Agent B produces. In that case Agent D belongs in a later wave, after Agent B's wave completes and is committed.

Decision rule:

```
For each agent, ask:
  "Does any file I read get written by another agent in this run?"
  YES → place me in a wave AFTER that writer's wave
  NO  → I can be in Wave 1
```

Typical dependency triggers that force a second wave:
- A package that imports another package being scaffolded in Wave 1
- A config file (tsconfig, eslint) that tooling in Wave 2 extends
- A shared type definition generated in Wave 1 that Wave 2 consumers import

---

## 3. File Ownership Rules

### The Cardinal Rule

> One agent owns each file. Assign every output path to exactly one agent before dispatching any wave.

Build an ownership manifest before writing a single agent prompt:

```
root-scaffolder   → turbo.json, pnpm-workspace.yaml, package.json, .gitignore
config-builder    → packages/config/tsconfig.base.json, packages/config/package.json
ui-builder        → packages/ui/src/index.ts, packages/ui/package.json, packages/ui/tsconfig.json
readme-writer     → README.md
```

If a path appears twice in the manifest, you have a conflict before any agent runs. Resolve it by ownership transfer — decide which agent truly owns the file and remove it from the other's list.

### Common Failure Modes

**Implicit shared files** — Both agents need to update `package.json` at the repo root. Fix: assign it to one agent; have the other agent's prompt describe what that root `package.json` should contain, and let the owner write it.

**README sprawl** — Multiple agents each write "their section" of a top-level README. Fix: defer README to a final wave with a single dedicated writer agent.

**Generated index re-exports** — Two agents each add exports to `packages/ui/src/index.ts`. Fix: either merge them into one agent or split into separate index files with a barrel merger in a later wave.

**config cascade** — Agent writes `tsconfig.json` while assuming a base config exists that hasn't been created yet. Fix: the base config author belongs in an earlier wave.

---

## 4. Agent Prompt Structure

Every sub-agent prompt must contain these sections. Don't omit any.

### File Ownership Declaration

```
You own exactly these files — create or modify only these paths:
  - packages/config/tsconfig.base.json
  - packages/config/package.json

Do NOT touch any file outside this list, even if you think it would help.
```

### Git Prohibition

```
Do NOT run git add, git commit, or git push.
The orchestrator handles all commits after each wave completes.
```

### Step-by-Step Instructions

Write ordered, concrete steps. Vague goals produce hallucinated file structures.

```
1. Create packages/config/ directory.
2. Write tsconfig.base.json with strict mode, path aliases for @repo/config.
3. Write package.json with name "@repo/config", version "0.0.0", no dependencies.
4. Do not create any other files.
```

### Completion Signal

```
When finished, reply with exactly:
  WAVE1_CONFIG_BUILDER_DONE
followed by a one-paragraph summary of what you created.
```

The orchestrator matches on this token to confirm completion before proceeding.

### Minimal Full Example

```
You are the config-builder agent for Wave 1.

You own exactly these files:
  - packages/config/tsconfig.base.json
  - packages/config/package.json

Do NOT touch any file outside this list.
Do NOT run any git commands.

Steps:
1. mkdir -p packages/config
2. Write packages/config/tsconfig.base.json — strict TypeScript base with composite: true.
3. Write packages/config/package.json — name "@repo/config", version "0.0.0".

When done, reply: WAVE1_CONFIG_BUILDER_DONE
Then summarize what you wrote.
```

---

## 5. Real Example — Building This Monorepo

This monorepo was scaffolded using a three-wave dispatch. The structure is a direct record of real execution.

### Wave 1 — Foundation (3 agents in parallel)

| Agent | Owned Files |
|---|---|
| `root-scaffolder` | `turbo.json`, `pnpm-workspace.yaml`, `package.json`, `.gitignore`, `.npmrc` |
| `config-builder` | `packages/config/tsconfig.base.json`, `packages/config/package.json` |
| `claude-agents-mover` | Everything under `apps/claude-agents/**` |

All three ran simultaneously. None of their file sets overlapped.

### Wave 2 — UI Package (1 agent, after Wave 1)

| Agent | Owned Files | Dependency |
|---|---|---|
| `ui-builder` | `packages/ui/src/**`, `packages/ui/package.json`, `packages/ui/tsconfig.json` | Extends `packages/config/tsconfig.base.json` from Wave 1 |

`ui-builder` could not run in Wave 1 because it extends the tsconfig base that `config-builder` produces. Running it in Wave 1 would require reading a file that doesn't exist yet.

### Wave 3 — Documentation (1 agent, after Wave 2)

| Agent | Owned Files | Dependency |
|---|---|---|
| `readme-writer` | `README.md` | Needed to know final package names, workspace structure |

Deferred to Wave 3 so the README accurately reflects the completed workspace rather than a predicted one.

### Outcome

- Zero merge conflicts across all three waves
- Full git history: one commit per wave, each in a clean state
- Total wall-clock time significantly less than sequential execution

---

## 6. Orchestrator Responsibilities

The orchestrator agent never writes source files. Its only jobs are:

1. **Plan** — produce the ownership manifest, assign waves
2. **Dispatch** — send all agents in a wave simultaneously (see Section 7)
3. **Wait** — block until all completion tokens for the current wave are received
4. **Commit** — stage and commit all changes from the wave before dispatching the next
5. **Audit** — after each wave, verify no agent wrote outside its declared ownership

### Committing After Each Wave

```bash
git add -A
git commit -m "wave 1: root scaffolding, config package, claude-agents migration"
```

Committing after each wave creates recovery checkpoints. If Wave 2 fails, you can inspect a clean Wave 1 state, diagnose, and re-run Wave 2 without contamination.

### Never Let Agents Commit

If agents commit, their commits interleave unpredictably with parallel siblings. The orchestrator loses control of the history and recovery becomes complex. Enforce this with the git prohibition line in every agent prompt.

---

## 7. Dispatching in Claude Code

To achieve true parallelism, all agents in a wave must be dispatched in a **single message** using the Agent tool with `run_in_background: true`.

### Single-Message Dispatch

Send one message containing all Agent tool calls for the wave simultaneously:

```
[Agent call 1: root-scaffolder, run_in_background: true]
[Agent call 2: config-builder,  run_in_background: true]
[Agent call 3: claude-agents-mover, run_in_background: true]
```

Claude Code schedules all three for parallel execution. If you send them in separate messages, they run sequentially — defeating the purpose.

### Waiting for Completion

After dispatching, wait for all background agents to complete before issuing the commit or dispatching the next wave. Claude Code will surface each agent's response as it finishes. Collect all completion tokens before proceeding.

### Wave 2 Dispatch Timing

Only after every Wave 1 agent has returned its completion token and you have committed:

```
[Agent call 4: ui-builder, run_in_background: true]
```

Even if `ui-builder` could theoretically start earlier, don't. The wave boundary + commit is the safety checkpoint.

---

## 8. Troubleshooting

### An agent wrote to a file it shouldn't have

**Symptom:** Post-wave audit finds a modified file not in the agent's ownership list.

**Response:**
1. Do not commit. Inspect the diff carefully.
2. If the change is benign (e.g. the agent also updated a lockfile), decide whether to keep it and update the manifest retroactively.
3. If the change conflicts with another agent's ownership, `git checkout -- <path>` to restore, then re-run the offending agent with a stricter prompt that calls out the specific path it must not touch.

### A wave partially fails

**Symptom:** Two of three Wave 1 agents complete; one returns an error or stalls.

**Response:**
1. Do not commit the partial wave.
2. Identify which files the failed agent was responsible for.
3. Re-dispatch only that agent. The completed agents' files are already on disk and stable — the re-run agent won't touch them.
4. Once all three are done, commit the full wave atomically.

### Agents need coordination mid-wave

**Symptom:** You realize mid-dispatch that Agent B needs a value Agent A is computing (e.g. a generated package version).

**Response:** This is a wave decomposition error. Abort the wave, re-plan:
- Move the shared value into a static constant defined before any wave runs, or
- Split into two sub-waves: Wave 1a (Agent A), commit, Wave 1b (Agent B reads A's output).

Never introduce a side-channel between parallel agents (shared file, environment variable). The file ownership model only works when agents are truly isolated.

### An agent ignores the no-commit rule

**Symptom:** `git log` shows a commit from inside a wave.

**Response:**
1. Identify what was committed and whether it's clean.
2. If safe, incorporate it into the wave checkpoint commit message for traceability.
3. Strengthen the git prohibition wording in future prompts: add "Running git commands will cause the orchestration to fail" as a consequence statement.

---

## Related Skills

- [`../plugin-authoring/SKILL.md`](../plugin-authoring/SKILL.md) — conventions for writing agent frontmatter, skill structure, and plugin.json
- [`../turborepo-workspace-setup/SKILL.md`](../turborepo-workspace-setup/SKILL.md) — the workspace structure that wave orchestration was used to build
