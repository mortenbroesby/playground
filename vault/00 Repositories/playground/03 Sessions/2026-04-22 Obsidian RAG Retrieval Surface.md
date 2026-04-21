---
type: repo-session
repo: playground
date: 2026-04-22
started_at: 2026-04-22 11:20
branch: main
summary: Extracted Obsidian memory retrieval into a reusable module with structured candidates and bounded context assembly, added focused tests and a direct `rag:query` command, and rewired the memory verifier and MCP server to use the shared retrieval surface.
keywords:
  - obsidian-rag
  - memory-search
  - rag-query
  - mcp
  - retrieval
touched_paths:
  - tools/obsidian-rag.mjs
  - tools/obsidian-rag.test.mjs
  - tools/rag-query.mjs
  - tools/rag-mcp-server.mjs
  - scripts/verify-obsidian-rag.mjs
  - package.json
  - vault/00 Repositories/playground/01 Architecture/Repo Memory Architecture.md
tags:
  - type/session
  - repo/playground
---

# Obsidian RAG Retrieval Surface

## Summary

Moved the repo-memory retrieval logic out of the verification script and into a
shared module that can now be used by direct commands and the MCP server.

The new retrieval surface now provides:

- structured candidate retrieval with metadata-aware lexical scoring
- deterministic reranking and match reasons
- bounded context assembly with explicit references
- chunk lookup and repo-home context helpers

## What Changed

- added `tools/obsidian-rag.mjs` as the shared retrieval layer
- added `tools/obsidian-rag.test.mjs` with focused Node tests
- added `pnpm rag:query` for direct JSON queries over `.rag/obsidian-vault.corpus.json`
- rewired `scripts/verify-obsidian-rag.mjs` to use the shared retrieval layer
- rewired `tools/rag-mcp-server.mjs` to consume the same retrieval functions
- updated the repo memory architecture note to document the new retrieval path

## Verification

- `pnpm obsidian:test-rag`
- `pnpm rag:verify`
- `pnpm rag:query --query 'Who owns routing and page composition?' --limit 2 --budget 300`
- `pnpm exec markdownlint-cli2 'vault/00 Repositories/playground/01 Architecture/Repo Memory Architecture.md'`

## Notes

This is the first real step from "indexed notes plus verifier" toward a proper
repo-memory retrieval system.

The biggest structural improvement is that the verifier, direct query command,
and MCP server now share one retrieval implementation instead of drifting
independently.
