# Skills Logic Tooling Migration Design

**Date:** 2026-05-06
**Status:** Draft

## Goal

Move the skills command surface implementation (`pnpm skills:*`), registry/parsing
logic, and metadata hook into a workspace tool package under `tools/`, implemented
entirely in TypeScript. The root `scripts/` directory should only retain thin
compatibility shims and workflow glue.

## Background

The current layout stores the canonical skill runtime in `scripts/` as JavaScript
modules:

- `scripts/skills.mjs`
- `scripts/lib/skills-registry.mjs`
- `scripts/lib/skills-metadata.mjs`
- `scripts/lib/skills-usage-cache.mjs`
- `scripts/skills-metadata-hook.mjs`
- `scripts/skills-smoke.mjs`

Meanwhile this repository already treats `tools/*` as a first-class workspace in
`pnpm-workspace.yaml`, which is the natural place for reusable developer tooling.

## Scope

In scope:

- Create a dedicated TypeScript tool package under `tools/` for skills logic.
- Migrate CLI, parsing, registry, and cache logic into that package.
- Keep `pnpm skills:list|search|route|read|registry`, hook checks, and smoke checks
  available under the same root command names.
- Keep hook behavior for pre-commit/pre-push unchanged.
- Update references and docs that mention the old implementation path.
- Keep runtime behavior unchanged unless explicitly improved with stronger typing.

Out of scope:

- Refactoring skill metadata schema.
- Changing ranking heuristics beyond path-level refactor.
- Reworking unrelated automation outside `scripts/` and `tools/`.

## Architectural Direction

Introduce a new package, `tools/agent-skills`, with explicit boundaries:

- `src/cli.ts`: thin command dispatcher for `skills:list`, `skills:search`,
  `skills:route`, `skills:read`, and `skills:registry` flows.
- `src/lib/*`: domain modules for parsing, registry loading/generation, and usage
  cache behavior.
- `src/hooks/skills-metadata-hook.ts`: metadata verification entrypoint used by hooks.
- `tests/*`: smoke tests and command-level assertions that previously lived in
  `scripts/skills-smoke.mjs`.
- `package.json`: package-local scripts for build/typecheck/command execution.
- `tsconfig.json`: strict TypeScript configuration for this package.

The root `scripts/` files become compatibility wrappers that call into the new
tool package while preserving existing invocation expectations.

## Target Layout

- `tools/agent-skills/package.json`
- `tools/agent-skills/tsconfig.json`
- `tools/agent-skills/src/cli.ts`
- `tools/agent-skills/src/lib/skills-metadata.ts`
- `tools/agent-skills/src/lib/skills-registry.ts`
- `tools/agent-skills/src/lib/skills-usage-cache.ts`
- `tools/agent-skills/src/hooks/skills-metadata-hook.ts`
- `tools/agent-skills/src/lib/commands/skills-list.ts` (optional split if growth
  makes `cli.ts` noisy)
- `tools/agent-skills/tests/skills-smoke.test.ts`
- `tools/agent-skills/README.md` (command contract and local run guide)

Compatibility shims retained in `scripts/`:

- `scripts/skills.mjs`
- `scripts/skills-smoke.mjs`
- `scripts/skills-metadata-hook.mjs`

## Command Contract

End-user behavior must remain stable:

- `pnpm skills:list [--all|--group|--daily-driver|--cold]`
- `pnpm skills:search <query>`
- `pnpm skills:route "<task description>" [--json]`
- `pnpm skills:read "<skill-id>[,<skill-id>...]"`
- `node scripts/skills-metadata-hook.mjs` (pre-commit)
- `node scripts/skills-metadata-hook.mjs --auto-range` (pre-push)

The hook compatibility script should preserve its public behavior even if the
implementation moves to `tools/agent-skills`.

For package-level development work, keep direct commands available:

- `pnpm --filter @playground/agent-skills run cli -- list`
- `pnpm --filter @playground/agent-skills run cli -- search workflow`
- `pnpm --filter @playground/agent-skills run smoke`
- `pnpm --filter @playground/agent-skills run metadata-hook -- --auto-range`

## Migration Strategy

### Phase 1: Package scaffold and API extraction

Create `tools/agent-skills/package.json` with a local scripts section and explicit
module dependencies. Add `tools/agent-skills/tsconfig.json` with strict compiler
options (`strict`, `noImplicitAny`, `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`). Move shared helpers into `tools/agent-skills/src/lib/`
and keep module boundaries stable:

- registry parse/load/generate
- frontmatter parsing
- usage cache read/write/update
- scoring and routing helpers
- hook guard behavior
- registry schema typing

Export a single CLI entrypoint to minimize cross-module coupling.

### Phase 2: Move command entrypoints and tests

Move:

- `scripts/skills.mjs` -> `tools/agent-skills/src/cli.ts` logic
- `scripts/skills-smoke.mjs` -> `tools/agent-skills/tests/skills-smoke.test.ts`
- `scripts/skills-metadata-hook.mjs` -> `tools/agent-skills/src/hooks/skills-metadata-hook.ts`
- `scripts/lib/skills-*.mjs` -> `tools/agent-skills/src/lib/skills-*.ts`

Update message text and errors that currently hardcode `node scripts/skills.mjs`
to reference the new package contract (for example registry stale guidance).

### Phase 3: Replace root `scripts/` entrypoints with delegation wrappers

Rework `scripts/skills.mjs`, `scripts/skills-smoke.mjs`, and
`scripts/skills-metadata-hook.mjs` into intentional tiny shims that execute the
built TypeScript output (`dist/...`) for the new package, passing through argv/env
unchanged.

Update `package.json` scripts:

- `skills:list` -> tool package-backed command
- `skills:search` -> tool package-backed command
- `skills:route` -> tool package-backed command
- `skills:read` -> tool package-backed command
- `skills:registry` -> tool package-backed command
- optional: add direct `skills:smoke` and `skills:metadata-hook` scripts for debug

### Phase 4: Wiring and guard updates

- Update `.husky/pre-commit` and `.husky/pre-push` trigger points only if wrapper paths
  changed.
- Update `scripts/prepush-checks.mjs` trigger path list to include tool-backed files
  and avoid stale path checks.
- Update any user-facing messages that mention old script paths.
- Ensure `scripts/agent-setup-check.mjs` assertions still pass with new shim behavior.

### Phase 5: Cleanup

- Remove `scripts/lib/skills-*.mjs` and legacy skill implementation files from
  `scripts/` once wrappers are stable.
- Add/adjust lockfile and workspace resolution if needed.
- Add README or contract note in `tools/agent-skills` for local execution.
- Keep shim files minimal and explicit about `dist` location and executed command.
- Optional: remove now-redundant `--help` text mentioning `node scripts/skills.mjs`
  internals.

## Verification Plan

- `pnpm --filter @playground/agent-skills run build`
- `pnpm --filter @playground/agent-skills run typecheck`
- `pnpm --filter @playground/agent-skills run smoke` (or focused smoke command)
- `pnpm skills:list`
- `pnpm skills:search workflow`
- `pnpm skills:route "refactor hook logic"`
- `pnpm skills:read engineering-workflow`
- `node scripts/skills-metadata-hook.mjs --auto-range` with a fixture change set
- `node scripts/skills-metadata-hook.mjs` with a valid and invalid SKILL change
  list

## Risks and Mitigations

- **Path drift in user-facing text and tests**: update all hardcoded references and
  keep wrappers for backward-compatibility.
- **Hook contract regression**: keep the wrapper behavior identical and preserve
  env-based fixture override and auto-range mode.
- **Workspace/package script friction**: verify `pnpm` invocation forms in `package.json`
  for argument forwarding and keep `pnpm`-only requirement.
- **Type migration drift**: require `pnpm --filter @playground/agent-skills run typecheck`
  before changing wrapper commands.
- **Behavior change risk during migration**: stage changes with checkpoints and run
  smoke tests after each phase.

## Success Criteria

- No skill-routing, registry, or metadata implementation remains in `scripts/`
  beyond delegation wrappers.
- `pnpm skills:*` commands and hook checks pass exactly as before.
- Existing generated artifacts (`.skills/registry.generated.json`,
  `.skills/registry.metadata.json`) remain source-compatible.
- New package code is TypeScript first-class with strict typing.
- The plan can be reverted via wrappers by pointing wrappers back to `scripts/` if
  needed during rollout.
