# Extract Astrograph To Standalone Repo

## Status

Phase 5 in progress: stale playground task notes are being retired or
redirected to the standalone Astrograph repository.

## Context

Astrograph has been extracted into the standalone repository
`https://github.com/mortenbroesby/astrograph` and publishes as `astrograph`.

The standalone package emits the portable MCP invocation:

```sh
npx astrograph@0.3.1-alpha.74 mcp
```

The canonical implementation plan is
`.specs/astrograph-repo-extraction-spec.md`.

The standalone repository has been bootstrapped, pushed, and published.
`playground` consumes the npm package through:

```json
"astrograph": "0.3.1-alpha.74"
```

Normal agent MCP startup should use the package invocation instead of the
in-tree wrapper:

```sh
npx astrograph@0.3.1-alpha.74 mcp
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
- `pnpm list astrograph --depth 0`
- `astrograph cli diagnostics --repo .`
- `pnpm agents:check`
- `pnpm exec markdownlint-cli2 README.md vault/00\ Repositories/playground/04\ Tasks/Extract\ Astrograph\ To\ Standalone\ Repo.md .specs/astrograph-repo-extraction-spec.md`

`test:package-bin` needs normal network access when its temporary project
resolves package dependencies during `pnpm add`.

## Next Work

- Run the first tag-driven trusted-publishing release after npm trusted
  publishing is configured.
- Keep new Astrograph implementation and packaging follow-ups in
  `../astrograph`, not in removed pre-extraction playground paths.
