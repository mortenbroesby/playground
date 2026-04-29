# Lint Prepush Fallback Wrapper

## Summary

The `lint-prepush` package crashes internally in this repo even after its task
completes successfully, so the pre-push hook now uses a wrapper with a
repo-owned fallback path.

## What Changed

- Added `scripts/run-prepush.mjs`.
- `.husky/pre-push` now calls the wrapper instead of invoking `lint-prepush`
  directly.
- `package.json` `lint:prepush` now points to the wrapper.
- The wrapper tries `pnpm exec lint-prepush` first, then falls back to
  `scripts/lint-prepush.mjs` when the package fails with the known internal
  error.

## Why

This preserves the package-managed integration while preventing pushes from
failing due to a third-party `lint-prepush` crash.

## Verification

- `node --check scripts/run-prepush.mjs`
- `node scripts/run-prepush.mjs`
- `pnpm agents:check`
- `pnpm lint:md`
