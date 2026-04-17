# `@playground/ai-context-engine`

Local deterministic context engine for AI-assisted code exploration.

## Why this name

The current spec frames the product as an AI context engine, not generic code
intelligence. The package name follows that framing so the contract, docs, and
future MCP tools all describe the same thing.

## Phase 1 contract

This workspace package currently establishes the Phase 1 contract from
[`/.specs/ai-code-context-engine-spec.md`](../../.specs/ai-code-context-engine-spec.md):

- Tree-sitter as the parsing direction
- SQLite in WAL mode
- repo-local storage under `.ai-context-engine/`
- discovery-first tools before broad retrieval
- exact retrieval as the non-negotiable source of truth

The implemented slice now includes:

- package scaffold and storage/config contract
- Tree-sitter parsing for `ts`, `tsx`, `js`, and `jsx`
- SQLite-backed file, symbol, import, and content-blob storage in WAL mode
- JSON CLI entrypoint in `src/cli.ts`
- stdio MCP server in `src/mcp.ts`
- `index_folder` and `index_file`
- `get_repo_outline`, `get_file_tree`, and `get_file_outline`
- `search_symbols` and `search_text`
- `get_context_bundle` for bounded, query-driven context assembly
- `get_file_content`, `get_symbol_source`, and `diagnostics`
- fixture-backed tests proving indexing and exact retrieval
- diagnostics now includes indexed timestamps, snapshot hashes, and live drift
  counts so stale metadata can be distinguished from a fresh index

## Commands

- `pnpm --filter @playground/ai-context-engine cli -- index-folder --repo /abs/repo`
- `pnpm --filter @playground/ai-context-engine cli -- get-repo-outline --repo /abs/repo`
- `pnpm --filter @playground/ai-context-engine cli -- get-context-bundle --repo /abs/repo --query Greeter --budget 120`
- `pnpm --filter @playground/ai-context-engine cli -- diagnostics --repo /abs/repo`
- `pnpm --filter @playground/ai-context-engine mcp`

The CLI prints JSON for each command. The MCP server speaks stdio JSON-RPC with
MCP-style `tools/list` and `tools/call` routing.

## Mutation testing

Early Stryker adoption is wired in two lanes:

- `pnpm --filter @playground/ai-context-engine test:mutation`
  is an informational opt-in gate. It does not run Stryker directly.
- `pnpm --filter @playground/ai-context-engine test:mutation:full`
  is the same gate for the broader profile.
- `pnpm --filter @playground/ai-context-engine mutation:smoke`
  runs the carved-down smoke profile against dedicated boundary tests only.
- `pnpm --filter @playground/ai-context-engine mutation:full`
  runs the broader boundary profile when you intentionally want a deeper
  survivor hunt.

Mutation testing is intentionally optional until the runtime story is better.
The smoke profile is intentionally narrow so it can stay under about a minute in
normal local use. The full profile is slower and is not intended for the tight
inner loop. Plain `vitest` remains the normal fast feedback loop.

Next slices should add:

- richer ranking and query suggestion quality
- bounded context bundles and ranked context assembly
- watch-mode health and status surfacing beyond the current CLI event stream
