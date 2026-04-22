# AI Context Engine Npm Bin Hardening

## Summary

Hardened `tools/ai-context-engine` for npm-style CLI use by adding an explicit
build contract, shipping built `dist` artifacts through `prepack`, and
verifying the packed tarball can install and run the `ai-context-engine` bin in
a temporary project.

## What Changed

- added `build`, `build:js`, and `build:types` scripts
- added `prepack` so `pnpm pack` builds `dist/` automatically
- switched package `main`, `types`, and `exports` to `dist/*`
- added `files` so the tarball includes built artifacts and the bin wrapper
- updated the bin wrapper to prefer `dist/*.js` and only fall back to
  `src/*.ts` in local workspace development
- added `scripts/smoke-package-bin.mjs` to pack, install, and execute the
  packaged CLI
- split out `tsconfig.build.json` for declaration emission
- changed internal benchmark self-imports to relative source imports so dev/test
  flows do not depend on built package exports

## Why

The previous bin contract only worked because the workspace could execute raw
TypeScript with Node strip-types mode. That is fine for local development, but
it is not the contract we want to ship as an npm CLI.

This slice moves the package toward a real published-module boundary without
forcing us to publish it yet.

## Verification

- `pnpm --filter @playground/ai-context-engine build`
- `pnpm --filter @playground/ai-context-engine test -- --run tests/interface.test.ts bench/tests/runner.test.ts`
- `pnpm --filter @playground/ai-context-engine test:package-bin`
- `pnpm exec markdownlint-cli2 tools/ai-context-engine/README.md`
