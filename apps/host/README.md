# @playground/host

Next.js orchestrator shell for the todo micro frontends.

## Composition modes

By default, the host **injects** child apps directly from workspace packages (no remote URL servers required).

- `NEXT_PUBLIC_TODO_COMPOSITION_MODE=injected` (default)
  - Loads children from local package modules (`@playground/todo-*`).
- `NEXT_PUBLIC_TODO_COMPOSITION_MODE=runtime`
  - Loads children from runtime URL-based ES modules.

## Runtime remotes (runtime mode only)

When `NEXT_PUBLIC_TODO_COMPOSITION_MODE=runtime`, the shell loads the todo micro frontend from:

- `NEXT_PUBLIC_TODO_MFE_URL` (default `http://localhost:3101/remoteEntry.js`)
