---
name: ralph-loop
description: "Use this skill when the user wants Codex to keep iterating on the same task until it satisfies explicit completion criteria, when a task benefits from repeated inspect-fix-verify passes, or when the user explicitly asks for a Ralph loop, convergence loop, or autonomous retry-until-done workflow."
version: 1.0.0
---

# Ralph Loop

Run a bounded, verification-first convergence loop inside Codex.

This skill adapts the Ralph Loop idea to Codex. Claude's plugin can relaunch itself across sessions with a stop hook; Codex usually cannot. In Codex, emulate the pattern inside the current session by running deliberate iterations with explicit success checks, keeping a tight memory of what changed, what failed, and what the next pass must prove.

## When to Use This Skill

- The user says `ralph loop`, `loop on this`, `keep going until it's done`, or similar
- A task has clear success criteria and cheap verification
- A first pass is unlikely to be enough, but repeated targeted passes are likely to converge
- You need a disciplined inspect -> edit -> verify -> reassess cycle instead of a single broad attempt

Avoid this skill when:

- Success criteria are subjective or still unknown
- Verification is extremely slow, destructive, or unavailable
- The task is mostly planning, ideation, or open-ended research

## Codex Adaptation

Treat Ralph Loop as a workflow, not a literal self-relaunch mechanism.

- Default to `max_iterations: 3` for normal tasks
- Raise to `5` only when checks are fast and the user clearly wants persistence
- Stop early the moment the completion criteria are met
- If blocked, stop honestly with the blocker, current state, and the exact next move

Never claim convergence without evidence from the relevant checks.

## Loop Contract

Before the first edit, lock these four things:

1. **Task**: one sentence describing the concrete job
2. **Completion promise**: the observable end state that means "done"
3. **Checks**: the commands, tests, or inspections that prove the promise
4. **Iteration cap**: how many passes you will attempt before reporting status

If the user did not provide a completion promise, infer one from the task and state it in a short progress update before proceeding.

## Per-Iteration Protocol

For each iteration:

1. Re-state the current hypothesis in one sentence.
2. Inspect the current failure, gap, or remaining risk.
3. Make the smallest high-confidence change that addresses that specific gap.
4. Run the narrowest meaningful verification.
5. Record the outcome:
   - what changed
   - what passed
   - what still blocks completion
6. Decide:
   - `DONE` if the completion promise is satisfied
   - `CONTINUE` if another targeted pass is justified
   - `STOP` if blocked, the cap is reached, or the remaining work needs user input

Keep each pass focused. Do not mix unrelated cleanup into the loop.

## Verification Rules

Prefer cheap proof first, then broader proof only when the change boundary widens.

- For one-workspace changes in this monorepo, start with the narrowest `pnpm --filter ...` command from `AGENTS.md`
- For shared-contract or cross-workspace changes, expand to the relevant shared checks
- If a command fails for environmental reasons, capture the exact failure and continue only if another trustworthy check exists

If you skip a verification step, say exactly why it was skipped.

## Working Style

Use short progress updates that make the loop visible:

- iteration number
- current focus
- result of the latest check
- whether you are continuing or stopping

Inside the loop:

- prefer targeted diffs over broad rewrites
- preserve unrelated user changes
- avoid speculative refactors
- tighten scope when the feedback signal is noisy

## Exit Conditions

Exit with `DONE` only when all of these are true:

- the requested behavior or artifact exists
- the completion promise is satisfied
- the most relevant checks passed, or you explicitly documented the remaining verification gap
- there is no known blocker hidden behind "should be fine"

Exit with `STOP` when:

- iteration cap reached without convergence
- required information is missing
- verification reveals a deeper issue that changes scope materially
- further retries would just repeat the same failing strategy

When stopping short of done, leave the user with:

- current state
- strongest evidence gathered
- likely root cause
- recommended next action

## Prompt Shape

When the user asks for a Ralph loop explicitly, interpret the request like this:

```text
Run a bounded Ralph loop on this task.
Task: <task>
Completion promise: <observable done state>
Checks: <tests/commands/manual proof>
Max iterations: <default 3 unless specified>
```

If the user omits some fields, infer them and continue unless the risk is genuinely high.

## Good Fits

- fix a failing test and keep iterating until it passes
- finish a small feature with explicit acceptance criteria
- repair a broken build with fast local verification
- tighten a flaky workflow by repeating until checks are green

## Bad Fits

- vague "make this better" requests
- multi-day architecture rewrites with no test harness
- tasks requiring fresh human judgment each pass

## Final Response Pattern

In the final answer, report:

1. whether the loop finished `DONE` or `STOP`
2. the highest-signal change made
3. the verification result
4. any remaining risk or next step

Be concise. The value of the loop is proven progress, not narration.
