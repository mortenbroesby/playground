# Extract Astrograph To Standalone Repo

## Status

Phase 5 in progress: stale playground task notes are being retired or
redirected to the standalone Astrograph repository.

## Context

Astrograph has been extracted into the standalone repository
`https://github.com/mortenbroesby/astrograph` and will publish as
`@mortenbroesby/astrograph`.

The standalone package emits the portable MCP invocation:

```sh
npx @mortenbroesby/astrograph mcp
```

The canonical implementation plan is
`.specs/astrograph-repo-extraction-spec.md`.

The standalone repository has been bootstrapped, pushed, and published.
`playground` consumes the npm package through:

```json
"@mortenbroesby/astrograph": "latest"
```

Normal agent MCP startup should use the package invocation instead of the
in-tree wrapper:

```sh
npx @mortenbroesby/astrograph mcp
```

## Verification

Standalone package checks, after removing the in-tree copy:

- `pnpm --dir ../astrograph build`
- `pnpm --dir ../astrograph type-lint`
- `pnpm --dir ../astrograph test`
- `pnpm --dir ../astrograph test:package-bin`
- `pnpm exec markdownlint-cli2 .specs/astrograph-repo-extraction-spec.md .specs/in_progress/astrograph-code-index-mcp-parity-spec.md`

Consumer-cutover checks:

- `CI=1 pnpm install --frozen-lockfile`
- `pnpm list @mortenbroesby/astrograph --depth 0`
- `pnpm exec astrograph cli diagnostics --repo .`
- `npx --no-install @mortenbroesby/astrograph cli diagnostics --repo .`
- `pnpm agents:check`
- `pnpm exec markdownlint-cli2 README.md vault/00\ Repositories/playground/04\ Tasks/Extract\ Astrograph\ To\ Standalone\ Repo.md .specs/astrograph-repo-extraction-spec.md`

`test:package-bin` needs normal network access when its temporary project
resolves package dependencies during `pnpm add`.

## Next Work

- Run the first tag-driven trusted-publishing release after npm trusted
  publishing is configured.
- Keep new Astrograph implementation and packaging follow-ups in
  `../astrograph`, not in removed `tools/ai-context-engine` playground paths.
