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

The implemented slice is intentionally thin:

- package scaffold
- storage/config contract
- Phase 1 tool manifest
- tests proving the contract shape

The next implementation slice should add actual indexing and retrieval
behavior behind this package surface.
