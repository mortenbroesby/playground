# Extract Astrograph To Standalone Repo

## Status

Phase 4 in progress.

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

The standalone repository has been bootstrapped and pushed. During the consumer
cutover, `playground` consumes the sibling checkout through:

```json
"@mortenbroesby/astrograph": "link:../astrograph"
```

Normal agent MCP startup should use the package invocation instead of the
in-tree wrapper:

```sh
npx @mortenbroesby/astrograph mcp
```

## Verification

Previous package-in-workspace checks:

- `pnpm --filter @mortenbroesby/astrograph build`
- `pnpm --filter @mortenbroesby/astrograph type-lint`
- `pnpm --filter @mortenbroesby/astrograph test`
- `pnpm --filter @mortenbroesby/astrograph test:package-bin`
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

- Verify all normal playground agent workflows use the linked standalone
  package.
- Remove the in-tree `tools/ai-context-engine` workspace in Phase 5 after the
  linked consumer path is proven.
