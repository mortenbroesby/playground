# Astrograph Standalone Install Spec

## Objective

Make Astrograph installable as a standalone npm package with a real bootstrap
flow:

- `npx @astrograph/astrograph install --ide codex`

The installed package must no longer depend on this monorepo to run.

## Target User

- an engineer inside an arbitrary git repo
- using Codex as the MCP client
- wanting Astrograph installed and configured from one command

## Constraints

- publishable npm package name must be `@astrograph/astrograph`
- keep `ai-context-engine` as a temporary bin alias for compatibility
- MCP, CLI, and install flows must work from the packed tarball, not only from
  workspace source
- observability must stay optional
- no workspace-only dependencies in the published package

## Non-Goals

- full multi-IDE installer parity in this slice
- npm publish itself
- replacing repo-local docs that still talk about `ai-context-engine`

## Required Changes

1. Change the package identity:
   - package name: `@astrograph/astrograph`
   - primary bin: `astrograph`
   - compatibility bin: `ai-context-engine`
2. Remove workspace-only runtime dependencies from the package:
   - specifically `@playground/ui`
3. Add an install command:
   - `astrograph install --ide codex`
4. The installer must:
   - detect the repo root
   - ensure `.codex/config.toml` contains an Astrograph-managed MCP block
   - prefer `npx @astrograph/astrograph mcp` as the portable execution path
   - preserve unrelated config content
5. Update package smoke coverage so the packed tarball proves:
   - CLI indexing works
   - installer writes a usable Codex config block

## Acceptance Criteria

- `pnpm pack` output can be installed into a temp repo and run as
  `pnpm exec astrograph ...`
- `pnpm exec astrograph install --ide codex --repo /abs/repo` writes a managed
  Astrograph block to `.codex/config.toml`
- the published package no longer depends on `@playground/ui`
- observability viewer build still works with package-local styling

## Verification

- `pnpm --filter @astrograph/astrograph type-lint`
- `pnpm --filter @astrograph/astrograph test -- --run tests/engine-contract.test.ts tests/engine-behavior.test.ts tests/interface.test.ts`
- `pnpm --filter @astrograph/astrograph build:observability`
- `pnpm --filter @astrograph/astrograph test:package-bin`
- `pnpm markdown:check .specs/astrograph-standalone-install-spec.md tools/ai-context-engine/README.md`
