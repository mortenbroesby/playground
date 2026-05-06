# AGENTS.md

Scoped instructions for `tools/agent-skills`.

## Scope

- Applies to everything under `tools/agent-skills/`.
- Inherit the repo-root [AGENTS.md](/Users/macbook/personal/playground/AGENTS.md) first.

## Purpose

- This package owns the TypeScript runtime for repo-owned skill discovery,
  ranking, routing, registry generation, and hook validation.
- Treat it as the implementation layer behind the root `pnpm skills:*`
  commands.

## Source Of Truth

- Skill identity lives in checked-in `.skills/<skill-id>/SKILL.md`.
- Skill catalog metadata lives in
  [`.skills/.metadata/registry.metadata.json`](/Users/macbook/personal/playground/.skills/.metadata/registry.metadata.json).
- Generated registry output lives in
  [`.skills/.metadata/registry.generated.json`](/Users/macbook/personal/playground/.skills/.metadata/registry.generated.json).
- Current catalog policy is `group + tier`. Do not reintroduce older policy
  fields such as `daily_driver`, `agent_benefit`, `catalog_group`,
  `activation_mode`, or usage-warmth logic.

## Editing Rules

- Do not hand-edit `dist/`.
- Update `registry.generated.json` by running `pnpm skills:registry`, not by
  editing the file manually.
- Keep package runtime in TypeScript under `src/`.
- Keep Node wrappers in `scripts/` thin. They should only resolve/build/forward
  into compiled `dist/` artifacts.
- Prefer deterministic behavior. Hidden local state should not influence skill
  ranking or default list output.

## Current Shape

- `src/cli.ts`: CLI entrypoint for `list`, `search`, `read`, `route`,
  and `registry`.
- `src/lib/skills-metadata.ts`: frontmatter and catalog metadata parsing.
- `src/lib/skills-registry.ts`: registry loading, validation, and generation.
- `src/lib/skills-routing.ts`: ranking, routing, and list/search policy.
- `src/hooks/skills-metadata-hook.ts`: commit-hook metadata validation.
- `src/skills-smoke.test.ts`: package smoke coverage for command surface and
  routing policy.

## Verification

- Run after meaningful package changes:
  - `pnpm --filter @playground/agent-skills run typecheck`
  - `pnpm --filter @playground/agent-skills run skills:smoke`
- Run when metadata or skill inventory changes:
  - `pnpm skills:registry`
  - `pnpm skills:list`
- Run full repo tests before claiming the broader change is done:
  - `pnpm test`

## Change Boundaries

- If you remove or rename a skill, also clean:
  - `.skills/.metadata/registry.metadata.json`
  - generated registry output
  - repo docs or routing rules that still reference the deleted skill
- If you change ranking policy or CLI semantics, update the package smoke test
  in the same pass.
