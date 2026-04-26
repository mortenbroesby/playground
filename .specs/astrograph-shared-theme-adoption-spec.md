# Astrograph Shared Theme Adoption Spec

## Objective

Adopt the existing shared `@playground/ui` theme in Astrograph's observability
viewer so the first design-system migration slice ships in the package that
already carries the `@astrograph` alias.

## Constraints

- Keep the package name, CLI name, and runtime storage paths unchanged.
- Reuse the existing shared theme package rather than creating a new token
  system.
- Keep the observability surface optional and Bun-backed as it is today.
- Do not broaden this slice into host or admin migration work.

## Non-goals

- Renaming `@playground/ui` to `@astrolux` in this slice.
- Migrating `apps/host` or `apps/admin` in this slice.
- Reworking observability transport, API shape, or event semantics.

## Acceptance Criteria

- `tools/ai-context-engine` depends on `@playground/ui` for shared theme usage.
- The observability viewer imports the shared theme CSS.
- The observability viewer uses the shared terminal visual language instead of
  the previous bespoke light-theme CSS.
- README notes that observability now reuses the shared UI theme package.
- `IDEAS.md` is rewritten to remove the stale top-level token-package idea and
  replace the remaining design work with smaller concrete follow-ups.

## Verification

- `pnpm --filter @playground/ai-context-engine build:observability`
- `pnpm --filter @playground/ai-context-engine type-lint`
- `pnpm markdown:check tools/ai-context-engine/README.md IDEAS.md .specs/astrograph-shared-theme-adoption-spec.md`
