# Obsidian Memory MCP SDK Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hand-rolled Obsidian memory MCP stdio loop with an official SDK-backed `stdio` server while preserving the current tool surface and leaving a clean seam for a later HTTP adapter.

**Architecture:** Split the current `rag-mcp-server.mjs` responsibilities into a thin SDK launcher, a transport-agnostic server factory, and focused memory service modules. Keep the existing registered tools and package script stable so Codex continues to spawn the same workspace entrypoint while the runtime internals become proper MCP SDK code.

**Tech Stack:** Node.js, `pnpm`, official MCP TypeScript SDK for server/stdio transport, existing Obsidian RAG modules, Node test runner.

---

## File Structure

- Modify: [tools/obsidian-memory/package.json](/Users/macbook/personal/playground/tools/obsidian-memory/package.json)
  - Add the MCP SDK dependency and keep the `mcp` package script stable.
- Create: [tools/obsidian-memory/src/mcp-server-core.mjs](/Users/macbook/personal/playground/tools/obsidian-memory/src/mcp-server-core.mjs)
  - Build the transport-agnostic MCP server and register all current tools.
- Create: [tools/obsidian-memory/src/mcp-memory-service.mjs](/Users/macbook/personal/playground/tools/obsidian-memory/src/mcp-memory-service.mjs)
  - Own corpus bootstrap, cache loading, and tool-facing operations such as search, context, unfold, classify, write-preview, and cleanup.
- Modify: [tools/obsidian-memory/src/rag-mcp-server.mjs](/Users/macbook/personal/playground/tools/obsidian-memory/src/rag-mcp-server.mjs)
  - Reduce to the SDK-backed `stdio` launcher.
- Modify: [tools/obsidian-memory/tests/query-surface.test.mjs](/Users/macbook/personal/playground/tools/obsidian-memory/tests/query-surface.test.mjs)
  - Keep protocol-surface tests but point them at the SDK-backed server behavior instead of custom wire semantics.
- Create if needed: [tools/obsidian-memory/tests/mcp-stdio-entrypoint.test.mjs](/Users/macbook/personal/playground/tools/obsidian-memory/tests/mcp-stdio-entrypoint.test.mjs)
  - Verify the package-script entrypoint shape from repo root if the existing query-surface tests are not enough.

## Task 1: Add a Failing SDK Integration Test

**Files:**
- Modify: [tools/obsidian-memory/tests/query-surface.test.mjs](/Users/macbook/personal/playground/tools/obsidian-memory/tests/query-surface.test.mjs)

- [ ] **Step 1: Add a new failing assertion that proves the server is running through the SDK-backed contract**

Add one test that still spawns the current entrypoint but asserts the result shape we expect to preserve through the migration, including the full current tool list and stable `serverInfo.name`.

- [ ] **Step 2: Run the targeted test to confirm current red/green baseline**

Run:

```bash
pnpm --filter @playground/obsidian-memory test:retrieval -- --test-name-pattern "tools/list exposes the expected MCP discovery contract"
```

Expected before code changes: either PASS as a baseline or FAIL only if the new assertion proves the current implementation needs adjustment for the SDK migration.

- [ ] **Step 3: Add one failing entrypoint-level test if package-script coverage is missing**

If the current test file does not exercise `pnpm --filter @playground/obsidian-memory mcp`, add a test that spawns the package script from repo root and sends `initialize`.

- [ ] **Step 4: Run the targeted entrypoint test and watch it fail for the right reason if newly added**

Run:

```bash
pnpm --filter @playground/obsidian-memory test:retrieval -- --test-name-pattern "package-script MCP entrypoint initializes from repo root"
```

Expected: FAIL only because the package-script spawn coverage does not yet match the new test assumptions.

## Task 2: Extract the Memory Service and Core Factory

**Files:**
- Create: [tools/obsidian-memory/src/mcp-memory-service.mjs](/Users/macbook/personal/playground/tools/obsidian-memory/src/mcp-memory-service.mjs)
- Create: [tools/obsidian-memory/src/mcp-server-core.mjs](/Users/macbook/personal/playground/tools/obsidian-memory/src/mcp-server-core.mjs)
- Modify: [tools/obsidian-memory/src/rag-mcp-server.mjs](/Users/macbook/personal/playground/tools/obsidian-memory/src/rag-mcp-server.mjs)

- [ ] **Step 1: Move corpus bootstrap and cache behavior into a focused service module**

Extract:

- repo root / vault root / index root resolution
- `ensureCorpus`
- cached corpus loading
- tool-facing service functions for:
  - `memory_search`
  - `memory_unfold`
  - `memory_context`
  - `classify`
  - `propose_write`
  - `clean_dry_run`

- [ ] **Step 2: Create the transport-agnostic core server factory**

Register the full current tool list on a shared MCP server factory. Keep current tool names and input behavior stable.

- [ ] **Step 3: Reduce `rag-mcp-server.mjs` to a thin `stdio` launcher**

Expected shape:

```js
#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { createObsidianMemoryMcpServer } from "./mcp-server-core.mjs";

const server = createObsidianMemoryMcpServer();
const transport = new StdioServerTransport();

await server.connect(transport);
```

- [ ] **Step 4: Run the targeted MCP protocol tests**

Run:

```bash
pnpm --filter @playground/obsidian-memory test:retrieval -- --test-name-pattern "memory_search|tools/list|classify|memory_context|memory_unfold|clean_dry_run|propose_write"
```

Expected: the targeted MCP tests pass with the SDK-backed launcher.

## Task 3: Add the Official SDK Dependency and Fix Any Contract Drift

**Files:**
- Modify: [tools/obsidian-memory/package.json](/Users/macbook/personal/playground/tools/obsidian-memory/package.json)
- Modify: [tools/obsidian-memory/tests/query-surface.test.mjs](/Users/macbook/personal/playground/tools/obsidian-memory/tests/query-surface.test.mjs)
- Modify: [tools/obsidian-memory/src/mcp-server-core.mjs](/Users/macbook/personal/playground/tools/obsidian-memory/src/mcp-server-core.mjs)

- [ ] **Step 1: Add the official MCP SDK dependency on the stable production line**

Expected dependency direction:

```json
{
  "dependencies": {
    "@modelcontextprotocol/server": "<stable version>",
    "workspace-tools": "^0.41.4",
    "yaml": "^2.8.3"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
pnpm install
```

Expected: lockfile and package state update cleanly.

- [ ] **Step 3: Fix any test drift caused by SDK-native error or metadata behavior**

Allowed adjustments:

- update tests that were asserting custom protocol details
- keep tool names, core tool semantics, and `serverInfo.name` stable

- [ ] **Step 4: Re-run the focused MCP suite**

Run:

```bash
pnpm --filter @playground/obsidian-memory test:retrieval -- --test-name-pattern "memory_search|tools/list|classify|memory_context|memory_unfold|clean_dry_run|propose_write|package-script MCP entrypoint"
```

Expected: PASS.

## Task 4: Run Full Workspace Verification and Real Spawn Checks

**Files:**
- Modify only if verification requires a small follow-up fix in the files above.

- [ ] **Step 1: Run the full Obsidian memory test suite**

Run:

```bash
pnpm --filter @playground/obsidian-memory test:retrieval
```

Expected: PASS.

- [ ] **Step 2: Run a real package-script spawn check**

Run:

```bash
pnpm --filter @playground/obsidian-memory mcp
```

Then send `initialize` and `tools/list` over stdio.

Expected: valid MCP responses through the SDK-backed transport.

- [ ] **Step 3: Confirm the repo-owned Codex entrypoint remains unchanged**

Run:

```bash
sed -n '1,40p' .codex/config.toml
```

Expected: the `obsidian-memory` block can still point at:

```toml
command = "pnpm"
args = ["--filter", "@playground/obsidian-memory", "mcp"]
```

- [ ] **Step 4: Commit the refactor**

```bash
git add tools/obsidian-memory/package.json tools/obsidian-memory/src/rag-mcp-server.mjs tools/obsidian-memory/src/mcp-server-core.mjs tools/obsidian-memory/src/mcp-memory-service.mjs tools/obsidian-memory/tests/query-surface.test.mjs docs/superpowers/plans/2026-05-06-obsidian-memory-mcp-sdk-refactor.md
git commit -m "refactor: move obsidian memory MCP server to official SDK"
```
