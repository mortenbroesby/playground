# AI Context Engine Type Lint Enforcement

## Summary

Made `ai-context-engine` type cleanliness a required gate before push and a
required predecessor for Turbo builds.

## What Changed

- added `type-lint` to `tools/ai-context-engine/package.json`
- `type-lint` now runs:
  - package `tsc --noEmit`
  - bench `tsc -p ./bench/tsconfig.json --noEmit`
  - build `tsc -p ./tsconfig.build.json --noEmit`
- added root `type-lint` as `turbo type-lint`
- added a Turbo `type-lint` task
- made `build` depend on local `type-lint` and upstream `^type-lint`
- updated `.husky/pre-push` to enforce `ai-context-engine` type linting after
  markdown linting

## Why

Recent `ai-context-engine` changes crossed package, bench, and packaging
boundaries. A plain package `type-check` is no longer enough to catch the real
TypeScript drift. The bench tsconfig and build tsconfig must also stay clean.

## Verification

- `pnpm --filter @playground/ai-context-engine type-lint`
- `pnpm turbo run build --filter @playground/ai-context-engine --dry=json`
- `sh .husky/pre-push`
