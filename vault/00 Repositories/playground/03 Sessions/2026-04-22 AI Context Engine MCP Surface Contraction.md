---
id: "mem-20260422-ai-context-engine-mcp-surface-contraction"
type: "session"
repo_slug: "playground"
title: "AI Context Engine MCP Surface Contraction"
status: archived
created: "2026-04-22"
updated: "2026-04-22"
owner: "agent"
summary: "Narrowed `@playground/ai-context-engine`'s MCP contract so agents use `query_code` as the single retrieval entrypoint instead of a parallel set of granular retrieval tools."
tags: []
keywords: []
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-05-06"
  expires_after: "2026-10-19"
  keep: false
---

## Summary

Narrowed `@playground/ai-context-engine`'s MCP contract so agents use
`query_code` as the single retrieval entrypoint instead of a parallel set of
granular retrieval tools.

## Why

The prior shape said `query_code` was the preferred surface, but the MCP server
still exposed `search_symbols`, `search_text`, `get_context_bundle`,
`get_ranked_context`, `get_file_content`, and `get_symbol_source` as separate
first-class tools. That kept the public boundary wider than the docs and repo
workflow intended.

## Changed

- removed the granular retrieval tools from the MCP tool list and dispatcher
- kept the granular library and CLI surfaces intact for debugging, benchmarks,
  and engine development
- updated the exported `ENGINE_TOOLS` contract to advertise `query_code`
  instead of the retired MCP retrieval tools
- rewrote the MCP interface tests around `query_code` discover, source, and
  assemble intents
- updated repo workflow docs and context-engineering guidance to point agents at
  `query_code`, `get_file_outline`, `get_file_tree`, and `diagnostics`

## Verification

- `pnpm --filter @playground/ai-context-engine build`
- `pnpm --filter @playground/ai-context-engine type-lint`
- `pnpm --filter @playground/ai-context-engine test`
- `pnpm markdown:check`
- `pnpm knowledge:check`
