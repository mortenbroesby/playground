---
name: engineering-workflow
description: Use for spec, plan, build, test, review, simplify, or ship workflows. Adapts the agent-skills lifecycle for this repo while keeping Codex, Claude, Copilot, and OpenCode on the shared .agents surface.
---

# Engineering Workflow

This skill adapts the useful lifecycle pattern from `addyosmani/agent-skills`
for this repo's shared `.agents` setup. Use it as process guidance, not as a
runtime-specific plugin.

## Lifecycle

- Define: clarify the objective, users, constraints, acceptance criteria, and
  non-goals before broad implementation.
- Plan: split work into small, ordered, verifiable tasks. Prefer vertical slices
  over horizontal layers.
- Build: implement one slice at a time. Keep the tree working after each slice.
- Test: prove behavior with the narrowest useful verification. For bug fixes,
  reproduce the bug before fixing it when practical.
- Review: check correctness, readability, architecture, security, performance,
  and missing tests before merge.
- Simplify: reduce complexity only after behavior is understood and protected.
- Ship: confirm checks, docs, rollback shape, and any monitoring or deployment
  expectations before pushing live.

## Repo Adaptation

- Follow `AGENTS.md` and `.agents/rules/` first.
- Use `pnpm` commands only.
- Use `obsidian-memory` for repo history and `jcodemunch` for code navigation
  when available.
- Keep durable workflow or architecture changes in
  `vault/02 Repositories/playground/`.
- Keep commands in `.agents/commands/` so Claude slash commands and Codex
  prompts share the same source.

## Command Mapping

- `/spec` or `spec.md`: define what to build before coding.
- `/plan` or `plan.md`: produce ordered tasks with acceptance criteria.
- `/build` or `build.md`: implement the next slice and verify it.
- `/test` or `test.md`: write or run proof for behavior.
- `/review` or `review.md`: review changes across quality axes.
- `/code-simplify` or `code-simplify.md`: simplify while preserving behavior.
- `/ship` or `ship.md`: run release readiness checks.
- `ralph-plan.md`: use for interactive Ralph-loop command planning.

## Guardrails

- Do not force a full spec for tiny, obvious edits. Scale the workflow to risk.
- Do not skip verification because the diff is small.
- Do not import runtime-specific setup into `.claude/`, `.codex/`, `.github/`,
  or `.opencode/` when a shared `.agents` file can serve all runtimes.
- Do not duplicate long process docs in multiple agent adapters.

## Evidence

Before finishing a workflow-driven change, report:

- what changed
- which checks ran
- what remains unverified, if anything
