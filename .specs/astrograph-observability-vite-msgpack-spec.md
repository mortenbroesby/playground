# astrograph-observability-vite-msgpack-spec.md

## Status

Proposed on 2026-04-26.

Checked against the repo on 2026-04-26.

## Objective

Replace the inline Astrograph observability viewer with a React client built by
Vite, add workspace dev hot reload, and introduce a MessagePack transport for
the observability API while preserving a JSON fallback.

## Constraints

- Bun still owns the local observability HTTP and websocket server
- Node still owns `diagnostics` and SQLite-backed health snapshots
- packaged npm use must work without Vite dev tooling
- workspace development should not require prebuilding the viewer
- JSON clients should keep working during the transition

## Architecture

1. Add a Vite React app under `tools/ai-context-engine/observability/`.
2. In packaged or built mode, Bun serves the Vite build output as static files.
3. In workspace dev mode, Bun auto-starts a Vite dev server and serves an HTML
   shell that loads the Vite client, React Refresh preamble, and app entry from
   the Vite origin.
4. The React app uses same-origin Astrograph APIs for `/health`, `/recent`, and
   `/events`.
5. HTTP endpoints support MessagePack via `Accept: application/msgpack` or
   `?format=msgpack`.
6. Websocket events support MessagePack via `?encoding=msgpack`, with JSON
   fallback as the default compatibility mode.

## Protocol

Envelope shape stays the same; only the wire encoding changes.

- content type for MessagePack responses: `application/msgpack`
- websocket message shapes:
  - `{ type: "snapshot", snapshot }`
  - `{ type: "recent", events }`
  - `{ type: "event", event }`
  - `{ type: "error", message }`

## Acceptance Criteria

1. `pnpm exec ai-context-engine observability --repo /abs/repo` serves the
   React viewer, either from built assets or auto-dev mode.
2. `pnpm exec ai-context-engine observability --repo /abs/repo --dev` starts
   Vite-backed hot reload in workspace development.
3. The viewer uses MessagePack for `/health`, `/recent`, and `/events`.
4. `/health` and `/recent` still return JSON when MessagePack is not requested.
5. The existing JSON websocket path still works for compatibility tests.
6. `prepack` includes the built observability client so npm consumers do not
   need Vite tooling at runtime.

## Verification

- `pnpm --filter @playground/ai-context-engine type-check`
- `pnpm --filter @playground/ai-context-engine type-lint`
- `pnpm --filter @playground/ai-context-engine test -- --run tests/engine-contract.test.ts tests/interface.test.ts`
- `pnpm markdown:check .specs/astrograph-observability-vite-msgpack-spec.md tools/ai-context-engine/README.md`
