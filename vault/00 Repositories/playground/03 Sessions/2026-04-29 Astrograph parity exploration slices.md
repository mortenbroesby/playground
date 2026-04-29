# 2026-04-29 Astrograph parity exploration slices

## Summary

- tightened the Astrograph code-index MCP parity spec into an execution-ready
  proposal
- landed the first exploration-surface slice in `tools/ai-context-engine`
- landed the next status and fallback-summary slice in
  `tools/ai-context-engine`

## Key changes

- added first-class exploration tools and adapters for:
  - `find_files`
  - `search_text`
  - `get_file_summary`
  - `get_project_status`
- kept `query_code` as the structured retrieval path instead of collapsing the
  new exploration surface into it
- made file summaries distinguish:
  - the tier actually used for the returned summary
  - the broader set of tiers the file class supports
- added deterministic fallback summary strategies for discovery-only files such
  as Markdown, JSON, YAML, SQL, shell, and plain-text paths

## Verification

- `pnpm agents:check`
- `pnpm --filter @astrograph/astrograph type-check`
- `pnpm --filter @astrograph/astrograph test`

## Known limitation

- `pnpm --filter @astrograph/astrograph test:package-bin` is still blocked in
  the sandbox because the temp install smoke step requires registry access
