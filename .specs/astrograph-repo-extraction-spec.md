# Astrograph Standalone Repository Implementation Plan

## Objective

Extract Astrograph from this monorepo into the standalone `astrograph`
repository, rename the published package target to
`@mortenbroesby/astrograph`, and reach a state where the standalone repo can
build, test, pack, install, and publish without depending on `playground`.

Target standalone repository:

- `https://github.com/mortenbroesby/astrograph`

Target npm package:

- `@mortenbroesby/astrograph`

## Current State

Astrograph now has the core shape of a standalone package:

- package metadata and build entrypoints live in the sibling checkout at
  `../astrograph`
- CLI and MCP entrypoints are package-local
- the installer exists in `../astrograph/scripts/install.mjs`
- package-local tests and package smoke coverage already exist

`playground` consumes the sibling checkout through
`@mortenbroesby/astrograph: link:../astrograph`.

The main extraction blockers are:

- publishing still needs npm trusted publishing setup outside this repo
- the `playground` dependency still uses a local sibling link until the package
  is published
- historical specs, benchmark corpora, and vault notes still contain old
  `tools/ai-context-engine` paths where they describe earlier work

## Target State

At the end of this effort:

1. `mortenbroesby/astrograph` is the source of truth for Astrograph.
2. `@mortenbroesby/astrograph` builds and publishes from that repo.
3. CLI, MCP, library, and install flows work from a packed tarball and from a
   normal npm install.
4. The primary CLI bin remains `astrograph`.
5. The compatibility bin remains `ai-context-engine` until removal is planned
   separately.
6. `npx @mortenbroesby/astrograph install --ide codex` installs and configures
   Astrograph for a Codex user in an arbitrary repo.
7. The installer writes a managed Astrograph block to `.codex/config.toml` and
   preserves unrelated Codex config.
8. The standalone repo has its own CI, release automation, and contributor
   docs.
9. `playground` consumes Astrograph as an external package and no longer
   depends on an in-tree Astrograph workspace.

## Non-Goals

- redesigning Astrograph retrieval semantics
- replacing the MCP contract wholesale
- broad parser or ranking refactors not required for extraction
- migrating unrelated playground packages
- full multi-IDE installer parity during the first installer slice
- publishing the package before release gates are in place
- removing every historical `ai-context-engine` reference in one pass where a
  compatibility alias is still intentional
- making observability part of the default install path

## Implementation Phases

### Phase 0: Spec Consolidation Only

Merge the older standalone install spec into this canonical implementation
plan before code, script, or test edits.

Required work:

- fold `.specs/astrograph-standalone-install-spec.md` into this file
- make this file the only active spec for the migration
- use `@mortenbroesby/astrograph` for standalone-facing package requirements
- align existing workspace commands with `--filter @mortenbroesby/astrograph`
  until the package is excluded from the `playground` workspace during the
  consumer cutover
- remove or clearly retire `.specs/astrograph-standalone-install-spec.md`
- run markdown lint only against the spec files

Do not change scripts or tests in this phase.

### Phase 1: Package Identity And Self-Containment

Make the old in-tree Astrograph package able to stand alone while it still
lives inside `playground`.

Required work:

- rename package identity from `@astrograph/astrograph` to
  `@mortenbroesby/astrograph`
- keep `astrograph` as the primary CLI bin
- keep `ai-context-engine` as a temporary compatibility bin
- replace workspace-only tsconfig inheritance with package-local config
- remove workspace-only package dependencies such as `@playground/tsconfig`
- update package metadata to point at `mortenbroesby/astrograph`
- keep runtime behavior unchanged

This phase will touch package config and tests, but only after Phase 0 is
complete.

### Phase 2: Installer And Package Smoke

Make the packed package prove that an arbitrary repo can install and configure
Astrograph.

Required work:

- support `npx @mortenbroesby/astrograph install --ide codex`
- update installer contract to prefer `npx @mortenbroesby/astrograph mcp`
- ensure `astrograph install --ide codex --repo /abs/repo` writes a managed
  Astrograph block
- preserve unrelated `.codex/config.toml` content
- keep installer scope to Codex only for this migration
- ensure tarball smoke covers package install, CLI indexing, and installer dry
  run behavior
- keep observability optional and out of the default install path

### Phase 3: Standalone Repo Bootstrap

Populate `mortenbroesby/astrograph` as the future source of truth.

Required work:

- move the package source, package-local docs, package tests, scripts,
  observability app, and reusable bench harness
- do not move `playground` agent hooks, `.codex`, `.claude`, root scripts, or
  playground-specific benchmark corpora
- add standalone root package metadata, lockfile, README, license, and
  contribution docs
- add CI for install, build, type-lint, tests, package smoke, and version
  policy
- choose a release mechanism

Default release recommendation:

- GitHub Actions with npm trusted publishing and a simple tag-based release
  flow for the first release

### Phase 4: Playground Consumer Cutover

Make `playground` consume Astrograph as an external dependency.

Required work:

- replace workspace dependency usage with the standalone package or a linked
  checkout during migration
- update Codex and Claude config to use the package invocation path
- keep repo-local helper scripts only as consumer glue
- stop assuming an in-tree Astrograph workspace exists for normal agent
  workflows
- leave playground-specific benchmark corpus files in `playground`

### Phase 5: Cleanup

Remove the in-tree Astrograph workspace only after the standalone repo and
playground consumer path are proven.

Required work:

- remove stale active docs that point to an in-tree Astrograph workspace as the
  source package location
- remove obsolete workspace references
- keep compatibility wording for `ai-context-engine` only where it describes
  the bin alias
- confirm fresh setup of both repos works

## Agent Work Packages

### `spec-consolidation`

Merge both specs into one canonical implementation plan. No scripts or tests.

### `package-self-containment`

Handle package rename, package-local tsconfig, metadata, and workspace
dependency removal.

### `installer-smoke`

Update install behavior and package smoke coverage for
`@mortenbroesby/astrograph`.

### `standalone-bootstrap`

Create the standalone repo layout, CI, docs, and release wiring.

### `playground-consumer`

Update this repo to consume the standalone package without relying on in-tree
paths.

### `bench-boundary`

Move reusable bench harness code upstream and keep playground-specific
benchmark manifests downstream.

## Acceptance Criteria

- there is exactly one active spec for this migration
- the active spec names `@mortenbroesby/astrograph` as the target npm package
- the active spec contains the installer requirements from the old standalone
  install spec
- no scripts or tests are changed during spec consolidation
- the package can later be built and tested without `playground` workspace
  config
- the standalone repo can later publish without depending on files from this
  repo
- `playground` can later consume Astrograph as an external package

## Verification Matrix

Spec-only phase:

- `pnpm exec markdownlint-cli2 .specs/astrograph-repo-extraction-spec.md`

Completed package phase before consumer cutover:

- `pnpm --dir ../astrograph build`
- `pnpm --dir ../astrograph type-lint`
- `pnpm --dir ../astrograph test`
- `pnpm --dir ../astrograph test:package-bin`

Playground consumer phase after local standalone linking:

- `CI=1 pnpm install --frozen-lockfile`
- `pnpm list @mortenbroesby/astrograph --depth 0`
- `pnpm exec astrograph cli diagnostics --repo .`
- `npx --no-install @mortenbroesby/astrograph cli diagnostics --repo .`
- `pnpm agents:check`
- `pnpm exec markdownlint-cli2 README.md AGENTS.md CLAUDE.md .agents/rules/repo-workflow.md .specs/astrograph-repo-extraction-spec.md vault/00\ Repositories/playground/04\ Tasks/Extract\ Astrograph\ To\ Standalone\ Repo.md`

Standalone repo phase:

- `pnpm install`
- `pnpm build`
- `pnpm type-lint`
- `pnpm test`
- `pnpm test:package-bin`
- CI package smoke in a fresh temp repo
- installer smoke with
  `npx @mortenbroesby/astrograph install --ide codex --repo /abs/repo --dry-run`

Playground cutover phase:

- root install succeeds
- agent startup can find Astrograph through the package path
- Codex MCP config starts Astrograph without an in-tree Astrograph workspace
- markdown and docs checks pass for updated references

## Open Decisions

- Should `bench/` reusable harness code move to the standalone repo in the
  first cut, or should it wait until path abstractions are cleaned up?
- Should observability remain in the core package, or become a separate
  package or optional app after extraction?
- Is Node `>=24` plus Bun part of Astrograph's intended public support policy,
  or only an artifact of current implementation choices?
- During migration, should `playground` consume Astrograph via published npm
  versions, linked checkout, or tarball installs?
- Should release automation stay with the default simple GitHub Actions and npm
  trusted publishing flow, or adopt a heavier versioning tool later?
