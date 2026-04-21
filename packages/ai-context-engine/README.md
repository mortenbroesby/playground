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
- `get_ranked_context` for inspectable query ranking plus bounded selection
- `get_file_content`, batched `get_symbol_source`, and `diagnostics`
- fixture-backed tests proving indexing and exact retrieval
- diagnostics defaults to cheap metadata reads, with optional live drift
  scanning when callers explicitly request freshness checks
- diagnostics includes indexed timestamps, snapshot hashes, and live drift
  counts so stale metadata can be distinguished from a fresh index
- diagnostics also persists the latest watch-session state so agents can inspect
  recent watch health without being attached to the live CLI event stream
- watch mode now prefers a native filesystem watcher and falls back to the
  internal polling detector when native watching is unavailable or errors
- symbol search now supports `language` and `filePattern` filters, and text
  search supports `filePattern`
- repo inputs anchored to any Git subdirectory resolve to the enclosing worktree
  root for storage and indexing

## Commands

- `pnpm exec ai-context-engine cli index-folder --repo /abs/repo`
- `pnpm exec ai-context-engine cli get-repo-outline --repo /abs/repo`
- `pnpm exec ai-context-engine cli search-symbols --repo /abs/repo --query Greeter --language ts --file-pattern 'src/*.ts'`
- `pnpm exec ai-context-engine cli get-symbol-source --repo /abs/repo --symbols id1,id2 --context-lines 2`
- `pnpm exec ai-context-engine cli get-context-bundle --repo /abs/repo --query Greeter --budget 120`
- `pnpm exec ai-context-engine cli get-ranked-context --repo /abs/repo --query Greeter --budget 120`
- `pnpm exec ai-context-engine cli diagnostics --repo /abs/repo`
- `pnpm exec ai-context-engine cli diagnostics --repo /abs/repo --scan-freshness`
- `pnpm exec ai-context-engine mcp`
- `pnpm --filter @playground/ai-context-engine bench:small`
- `pnpm --filter @playground/ai-context-engine bench:cli`
- `pnpm --filter @playground/ai-context-engine cli -- index-folder --repo /abs/repo`
- `pnpm --filter @playground/ai-context-engine cli -- get-repo-outline --repo /abs/repo`
- `pnpm --filter @playground/ai-context-engine cli -- search-symbols --repo /abs/repo --query Greeter --language ts --file-pattern 'src/*.ts'`
- `pnpm --filter @playground/ai-context-engine cli -- get-symbol-source --repo /abs/repo --symbols id1,id2 --context-lines 2`
- `pnpm --filter @playground/ai-context-engine cli -- get-context-bundle --repo /abs/repo --query Greeter --budget 120`
- `pnpm --filter @playground/ai-context-engine cli -- get-ranked-context --repo /abs/repo --query Greeter --budget 120`
- `pnpm --filter @playground/ai-context-engine cli -- diagnostics --repo /abs/repo`
- `pnpm --filter @playground/ai-context-engine cli -- diagnostics --repo /abs/repo --scan-freshness`
- `pnpm --filter @playground/ai-context-engine mcp`

The shortest workspace-local entrypoint is `pnpm exec ai-context-engine ...`.
The CLI prints JSON for each command. The MCP server speaks stdio JSON-RPC with
MCP-style `tools/list` and `tools/call` routing.

`bench:cli` uses `hyperfine` and expects that binary to already be installed on
the machine. If it is missing, the script fails with an install hint instead of
silently skipping CLI benchmarks.

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
- richer relationship tools across imports and callers
- narrower incremental indexing beyond current file and folder entrypoints
