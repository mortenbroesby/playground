# ai-context-engine-effect-live-observability-spec.md

## Status

Proposed on 2026-04-26.

Checked against the repo on 2026-04-26.

Current local implementation already includes:

- stdio MCP serving through the official MCP TypeScript SDK
- a nine-tool manifest with one shared MCP contract for registration and dispatch
- watch-mode batching via RxJS over native `fs.watch` with polling fallback
- child-process execution for explicit `index_folder` and `index_file` work
- repo-local freshness and watch diagnostics persisted in `.ai-context-engine`
- opt-in structured stderr logging via `pino`

Current local gap:

- observability exists as logs plus compact diagnostics state, but not as a
  first-class live developer surface
- the runtime is still Promise-first and function-first rather than lifecycle-
  managed around a long-lived service graph

## 1. Purpose

Answer two architecture questions for `@playground/ai-context-engine`:

1. whether Effect is a good fit now, later, or not at all
2. whether a local websocket-backed observability server should be added for
   live developer visibility into MCP requests, watch activity, indexing work,
   and health state

The goal is to make the next iteration narrower and more intentional, not to
introduce a new framework or daemon because it sounds more advanced.

## 2. Current Repo Ground Truth

The current engine already has a useful runtime shape:

- `src/mcp.ts` logs MCP tool call start, finish, and error with tool name,
  duration, and argument keys
- `src/storage.ts` emits watch lifecycle events of `ready`, `reindex`,
  `error`, and `close`
- watch state is persisted into repo meta as `status`, debounce/poll values,
  timestamps, changed paths, reindex count, last error, and last summary
- explicit `index_folder` and `index_file` work is already isolated behind a
  child-process boundary with start/finish/failure logging
- `diagnostics()` already returns a compact health snapshot that combines
  storage, freshness, summary-source, and watch status

What is missing is not raw telemetry. What is missing is one place where a
developer can watch these events live without scraping stderr or rerunning
`diagnostics()` manually.

## 3. Decision Summary

### 3.1 Effect

Recommendation: not now for the core engine, maybe later for a narrow runtime
layer if `ai-context-engine` grows into a multi-service local daemon.

### 3.2 Live observability server

Recommendation: yes, but only as an opt-in local developer tool with a narrow,
read-only websocket event stream and health snapshot API.

### 3.3 Overengineering line

Do not turn `ai-context-engine` into a general workflow engine, tracing
platform, or browser IDE backend.

The first observability slice should expose existing runtime facts cleanly. It
should not invent a richer control plane than the package actually needs.

## 4. Effect Evaluation

## 4.1 Why Effect is not the right move now

Current code shape does not justify a broad Effect migration:

- the MCP layer is thin and mostly callback-based around the MCP SDK
- the storage layer is already large, synchronous in critical SQLite paths, and
  optimized around deterministic direct function calls
- watch orchestration already uses RxJS successfully for the one place where
  stream coordination was needed
- current pain is visibility, not correctness under a complex dependency graph

Effect would add real benefits:

- explicit resource lifecycles
- typed error channels
- structured service boundaries
- streaming and supervision primitives
- optional tracing integration later

Those benefits become worth paying for only when runtime composition itself is a
problem. That is not the current bottleneck.

## 4.2 Migration cost

A real Effect migration would touch more than syntax:

- convert Promise-returning public APIs and internal helpers to `Effect`
- wrap `better-sqlite3` blocking work deliberately instead of calling it
  directly
- decide whether RxJS stays, gets bridged, or gets replaced in watch mode
- replace direct logger calls with Effect-aware logging adapters or accept a
  split model
- rewrite tests around layers, fibers, or Effect runtime helpers
- rework child-process orchestration, signal handling, and shutdown paths
- teach future contributors a second runtime model in a package that is
  currently plain TypeScript

That cost is too high for the current value gap.

## 4.3 Candidate seams if Effect is revisited later

If `ai-context-engine` later grows into a long-lived local service, Effect
should start at the runtime edge, not in the retrieval core.

Best future seams:

1. an opt-in local daemon that owns watch mode, health snapshots, and
   observability fan-out
2. supervision around child index workers and future background jobs
3. a typed internal event bus that can feed logs, websocket clients, and tests
4. lifecycle-managed startup and shutdown for combined MCP plus observability
   processes

Bad first seams:

- rewriting `storage.ts` retrieval functions just to make them "more Effect"
- converting SQLite queries to Effect wrappers without a concrete runtime need
- replacing working RxJS watch batching only for framework consistency

## 4.4 Final Effect recommendation

Use Effect later only if all of the following become true:

1. `ai-context-engine` starts running as a longer-lived local daemon
2. multiple background subsystems need coordinated startup, shutdown, and
   supervision
3. one event stream needs to feed more than stderr logs and ad hoc diagnostics
4. the team wants tracing/resource semantics strongly enough to pay the
   migration cost

Until then, keep the engine Promise-first and function-first.

## 5. Live Observability Evaluation

## 5.1 Why a local websocket server is justified

This is a better fit than Effect right now because it solves the active gap
directly.

Current repo behavior already produces the right signals:

- MCP tool dispatch lifecycle
- watch lifecycle and changed-path batches
- child worker lifecycle
- freshness and watch health snapshots

Those signals are just fragmented across stderr logs, watch sidecars, and
manual diagnostics calls.

A websocket-backed local server would provide:

- one live stream for developers during agent and watch debugging
- a stable surface for a later tiny browser UI or CLI tail client
- no required changes to the public MCP tool contract
- a clearer basis for future tests around runtime visibility

## 5.2 Recommended scope

Add a new opt-in local observability surface for development only.

In scope for the first slice:

- bind only to `127.0.0.1`
- expose a websocket event stream
- expose a health snapshot endpoint
- publish events for MCP tool calls, watch lifecycle, index workers, and health
- keep the surface read-only
- keep payloads metadata-first rather than content-heavy

Out of scope for the first slice:

- remote access
- auth and multi-user sessions
- browser command/control of the engine
- full trace trees
- persistent metrics backends
- replaying full tool inputs or source payloads

## 6. Recommended Architecture

## 6.1 Runtime shape

Add a separate opt-in command, for example:

- `ai-context-engine observability --repo <root>`

That command should:

1. start a tiny local HTTP server
2. upgrade websocket clients on `/events`
3. serve the latest health snapshot on `/health`
4. optionally serve a recent-event buffer on `/recent`

The server should not proxy MCP traffic. It should consume a shared event sink.

## 6.2 Shared event sink

Because MCP, watch, and child workers may live in different processes, use a
repo-local append-only event log as the shared source of truth.

Recommended artifact:

- `.ai-context-engine/events.jsonl`

Each producer appends one compact JSON event per line:

- MCP server process
- watch process
- index worker parent process
- observability server itself for health snapshots

The websocket server tails this file and broadcasts new events to connected
clients. This keeps process boundaries simple and avoids coupling the server to
the MCP runtime through in-memory globals.

## 6.3 Why JSONL is the right first transport

JSONL is the narrowest useful bridge because it is:

- process-agnostic
- easy to inspect manually
- easy to rotate or truncate
- compatible with the current stderr log style
- sufficient for one-writer-at-a-time event append patterns in this package

Do not start with a second SQLite database, a custom IPC broker, or a richer
event-sourcing substrate.

## 6.4 Health snapshots

Health should stay derived from `diagnostics()` rather than becoming a separate
truth source.

The observability server should publish a fresh health snapshot:

- at startup
- on a short interval such as 1 second while clients are connected
- after any watch or worker event that likely changes health state

That keeps the live view aligned with the existing repo meta and diagnostics
path rather than creating a shadow health model.

## 7. Event Model

Use one envelope for every emitted event:

```ts
interface EngineEventEnvelope {
  id: string;
  ts: string;
  repoRoot: string;
  source: "mcp" | "watch" | "index-worker" | "health";
  event: string;
  level: "debug" | "info" | "warn" | "error";
  correlationId?: string;
  data: Record<string, unknown>;
}
```

Recommended first event set:

- `mcp.tool.started`
- `mcp.tool.finished`
- `mcp.tool.failed`
- `watch.ready`
- `watch.reindex`
- `watch.error`
- `watch.closed`
- `index-worker.started`
- `index-worker.finished`
- `index-worker.failed`
- `index-worker.parse-failed`
- `health.snapshot`

Recommended data payload principles:

- include `toolName`, `durationMs`, and `argKeys` for MCP events
- include `changedPaths`, `indexedFiles`, `indexedSymbols`, and `staleStatus`
  for watch events
- include `command`, `filePath`, `durationMs`, and exit status for worker events
- include `staleStatus`, file counts, snapshot hashes, and compact watch state
  for health events

Do not include:

- raw MCP argument values by default
- source code payloads
- file contents
- full text-search previews

## 8. Implementation Order

## 8.1 Slice 1

Add shared event writing without changing any public interfaces.

- add `appendEngineEvent(...)`
- instrument `mcp.ts`
- instrument watch lifecycle in `storage.ts`
- instrument child worker lifecycle in `storage.ts`

## 8.2 Slice 2

Add the local observability server.

- websocket endpoint
- health endpoint
- recent-event ring buffer
- basic event-log tailing

## 8.3 Slice 3

Add a tiny developer viewer only if the websocket stream proves useful.

Possible follow-up:

- minimal HTML page in the same server
- or a separate small host page under `apps/host/`

Do not block slices 1 or 2 on a polished UI.

## 9. Risks

Main risks:

- event spam from fast watch cycles or frequent MCP tool calls
- partial writes or log-growth issues in the JSONL event file
- accidental payload leakage if raw args or code content are emitted
- false confidence if health snapshots drift from `diagnostics()`
- turning the server into a second runtime that also wants to own watch mode

Mitigations:

- keep payloads compact
- cap recent-event buffers in memory
- rotate or truncate the JSONL file opportunistically
- keep health derived from `diagnostics()`
- keep the first server read-only and non-authoritative

## 10. zyncbase Assessment

The requested reference is `https://github.com/mstdokumaci/zyncbase`.

Assessment for this spec: inspirational, not directly reusable yet.

Reason:

- the current `ai-context-engine` need is a narrow local event fan-out surface,
  not a broader replicated state or generalized live-runtime substrate
- no direct repo integration seam is visible from current local code
- introducing a foreign runtime substrate before proving the event model would
  raise integration cost faster than it would reduce design risk

Conservative recommendation:

- borrow ideas only at the level of event-view ergonomics, reconnect behavior,
  or lightweight local debugging UX
- do not assume its runtime model or transport layer should become part of
  `ai-context-engine`

Inference note:

This "inspirational only" call is intentionally conservative. It should remain
the default until there is a direct code review of that repository against the
specific event-sink and viewer needs listed here.

## 11. No-Go Line

Stop and reassess if the observability work starts requiring any of the
following before the first usable slice lands:

1. replacing MCP stdio with a new primary transport
2. replacing the existing watch implementation
3. replacing the storage layer with Effect services
4. adding full tracing infrastructure
5. capturing raw code payloads or full tool arguments by default
6. building a complex browser UI before the event stream itself proves useful

If any of those become prerequisites, the design has already drifted beyond the
actual problem.

## 12. Final Recommendation

Do two things, in this order:

1. add the local websocket-backed observability surface with a shared JSONL
   event sink and diagnostics-derived health snapshots
2. defer Effect adoption unless `ai-context-engine` later becomes a true
   multi-service local daemon with lifecycle and supervision complexity that the
   current Promise-first model no longer handles cleanly

This keeps the next step small, testable, and grounded in current repo
behavior.
