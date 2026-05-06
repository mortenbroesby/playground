# Obsidian Memory MCP SDK Refactor Design

**Date:** 2026-05-06
**Status:** Approved for implementation

## Goal

Refactor `tools/obsidian-memory` so its MCP surface uses the official Model
Context Protocol TypeScript SDK instead of a hand-rolled stdio JSON-RPC loop.

The first slice should fix the local integration architecture for Codex and
similar process-spawned clients while preserving the current tool behavior. The
refactor should also leave a clean seam for a later Streamable HTTP adapter
without taking that second transport on in this slice.

## Scope

This design covers:

1. SDK-backed `stdio` integration
2. transport/core separation
3. stable tool compatibility for the current memory surface
4. transport-level test and rollout changes

This design does not include shipping a working HTTP transport in the first
slice.

## Current Problems

- `tools/obsidian-memory/src/rag-mcp-server.mjs` currently mixes transport
  handling, tool registration, error shaping, corpus bootstrap, and retrieval
  behavior in one file.
- The server currently implements its own wire protocol loop even though MCP has
  an official TypeScript SDK for server transports and tool registration.
- The current structure makes it hard to tell whether failures come from the
  transport boundary, the retrieval domain logic, or local client startup and
  config behavior.
- A future remote transport would currently require pulling transport concerns
  back out of vault-specific logic that should already be isolated.

## External Reference

The official MCP guidance says local process-spawned integrations should use
`stdio`, while remote servers should use Streamable HTTP. The official SDK also
encourages building a server by registering tools/resources/prompts on a server
instance and then connecting a transport, which matches the separation this
refactor needs.

Primary references:

- https://github.com/modelcontextprotocol/typescript-sdk
- https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md
- https://modelcontextprotocol.io/docs/sdk

Note: the current SDK `main` branch docs describe a v2 line that is still
pre-alpha, while the project states `v1.x` remains the recommended production
line. The implementation should choose the stable production SDK line rather
than blindly following the newest branch.

## Desired Outcome

After the refactor:

- the Obsidian memory MCP server uses the official SDK for local `stdio`
  integration
- the entrypoint becomes a thin launcher rather than a mixed transport/domain
  file
- transport-agnostic server registration is reusable by a later HTTP adapter
- the current user-facing memory tools remain behavior-compatible
- protocol-surface tests validate the real local spawn path through the SDK

## Approach Options

### Option A: SDK wrapper only

Keep the current file structure mostly intact and swap only the handwritten
protocol loop for SDK wiring.

Pros:

- fastest migration
- smallest diff

Cons:

- preserves mixed responsibilities
- weaker foundation for later HTTP support

### Option B: Transport/core split

Extract a transport-agnostic MCP core that registers the current tools and
delegates to focused memory services, then add a thin SDK-backed `stdio`
launcher.

Pros:

- fixes the MCP integration properly
- gives a clean seam for a later HTTP adapter
- keeps behavior stable while improving structure

Cons:

- more work than a simple wrapper swap

### Option C: Full surface redesign

Adopt the SDK while also redesigning the tool/resource/prompt surface in the
same pass.

Pros:

- biggest long-term cleanup opportunity

Cons:

- mixes migration with product redesign
- much higher regression risk

## Chosen Approach

Choose Option B.

This gives the repo a real MCP integration now without taking on the unrelated
risk of a surface redesign or an HTTP rollout in the same slice.

## Design

### Transport boundary

- Replace the custom stdio protocol loop with `McpServer` and
  `StdioServerTransport` from the official SDK.
- Keep the launch surface compatible with the current package script:
  `pnpm --filter @playground/obsidian-memory mcp`.
- Treat the transport as an adapter only. It should own startup and connection,
  not retrieval behavior.

### Core server factory

- Introduce a transport-agnostic core module that creates the MCP server,
  registers tools, and applies shared instructions or metadata.
- The core should be reusable by any future transport adapter.
- Tool registration should move out of the entrypoint file and into this shared
  core.

### Domain services

Split the current mixed server logic into focused services:

- corpus bootstrap and cache loading
- memory search
- context retrieval
- unfold lookup
- governance/write-preview and cleanup helpers if those tools stay in slice one

The point is not to create many layers for their own sake. The point is that
transport code should not know retrieval details, and retrieval logic should not
know transport details.

### Compatibility contract

- Preserve the current user-facing tools:
  - `memory_search`
  - `memory_context`
  - `memory_unfold`
- Preserve current compact-vs-full output behavior.
- Preserve repo-root, vault-root, and index-root resolution behavior, including
  current environment overrides.
- Preserve lazy corpus loading and on-demand index bootstrap unless a concrete
  issue discovered during implementation justifies changing them.

Although the main compatibility bar is the three tools above, the safer first
slice is to keep the full currently registered surface if it is already exposed
by the runtime:

- `classify`
- `propose_write`
- `clean_dry_run`

This avoids shipping a “more correct MCP server” that is missing tools that
existing workflows already depend on.

### Error handling

- Move away from handwritten protocol-level response construction.
- Use SDK-native tool handler behavior and return tool-level errors in the way
  the SDK expects.
- Keep error messages stable where practical, but prefer SDK-correct behavior
  over preserving custom wire details that should no longer exist.

### Future HTTP seam

- Do not ship Streamable HTTP in this slice.
- Keep the server factory reusable so a later adapter can construct the same
  tool surface over HTTP.
- Avoid introducing `stdio`-only assumptions into the tool handlers or core
  server registration.

## Non-Goals

- No Streamable HTTP rollout in this first slice
- No redesign of the user-facing memory tool surface
- No vault schema rewrite
- No broad retrieval-ranking redesign
- No attempt to solve every Codex configuration or session-loading issue in the
  same refactor

## Verification

- existing retrieval and domain tests for `tools/obsidian-memory`
- updated MCP integration tests that exercise the SDK-backed local server
- explicit local spawn verification through the package script entrypoint
- targeted verification of:
  - `initialize`
  - `tools/list`
  - representative tool calls for the registered memory tools

Expected command-level checks:

- `pnpm --filter @playground/obsidian-memory test:retrieval`
- targeted runtime spawn checks for `pnpm --filter @playground/obsidian-memory mcp`

## Rollout Notes

- Keep `.codex/config.toml` unchanged if the package script entrypoint remains
  the same.
- If the launcher changes, update the repo-owned Codex config block and the
  runtime reference docs together.
- If Codex still fails to attach after the SDK migration, treat the remaining
  issue as likely client config/session-loading behavior rather than proof that
  the server implementation is still invalid.

## Risks And Mitigations

- Risk: SDK adoption changes exact `tools/list` metadata or error wording
  Mitigation: preserve semantic behavior and intentionally update tests that are
  asserting custom wire details.

- Risk: the refactor becomes a broad retrieval cleanup
  Mitigation: keep the first slice focused on the transport/core boundary and
  compatibility preservation.

- Risk: the server becomes more “official” but still does not load in Codex
  Mitigation: add real local spawn verification and keep the diagnosis separate
  from client-side config or session issues.

- Risk: the core abstraction becomes over-engineered
  Mitigation: keep the split minimal and responsibility-driven rather than
  layering for its own sake.
