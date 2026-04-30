# Extract Astrograph To Standalone Repo

## Status

In progress.

## Context

Astrograph is being extracted from `tools/ai-context-engine` into the standalone
repository `https://github.com/mortenbroesby/astrograph` and will publish as
`@mortenbroesby/astrograph`.

The playground workspace package has been renamed to the target package name,
made self-contained with a package-local `tsconfig.base.json`, and the Codex
installer now emits the portable package invocation:

```sh
npx @mortenbroesby/astrograph mcp
```

The canonical implementation plan is
`.specs/astrograph-repo-extraction-spec.md`.

## Verification

- `pnpm --filter @mortenbroesby/astrograph build`
- `pnpm --filter @mortenbroesby/astrograph type-lint`
- `pnpm --filter @mortenbroesby/astrograph test`
- `pnpm --filter @mortenbroesby/astrograph test:package-bin`
- `pnpm exec markdownlint-cli2 .specs/astrograph-repo-extraction-spec.md .specs/in_progress/astrograph-code-index-mcp-parity-spec.md`

`test:package-bin` needs normal network access when its temporary project
resolves package dependencies during `pnpm add`.

## Next Work

- Bootstrap the empty standalone repository with the package contents and
  repo-local metadata.
- Add standalone CI and release gates before publishing.
- Cut `playground` over to consume `@mortenbroesby/astrograph` externally.
