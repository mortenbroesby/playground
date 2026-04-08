# @playground/host

Vite shell for the playground microfrontend setup and the first `@mortenbroesby` site pivot.

The host now uses two route-level shells:

- a calmer public-site shell for `/`, `/about`, `/writing`, and `/uses`
- a denser playground shell for `/playground`, `/playground/system`, `/playground/todo`, and `/playground/uplink`
- the playground shell only lists playground-exclusive surfaces and provides a separate path back to `/`

## Composition model

The host mounts the todo app from the workspace with a client-side dynamic import.

- No `remoteEntry.js`
- No proxy rewrite
- No copied remote bundle in `public/`

The host and todo app communicate through the mount contract:

- The host receives structured events from the microfrontend
- The host can seed or clear todos through the returned handle
- The todo app renders inside `/playground/todo` but manages its own UI
- The personal site now lands on `/`
- Writing now lives at `/writing` with MDX-backed post content in the host workspace
- The personal content route now lives at `/uses`
- `/readme` redirects to `/about`
- Legacy app routes like `/system`, `/todo`, and `/game` redirect into `/playground/*`

## Local development

Run the host from the repo root:

```bash
pnpm dev:web
```

That starts the web stack and opens `http://127.0.0.1:3000/` automatically.

It runs:

- `@playground/host` on port `3000`

## Verification

- `pnpm --filter @playground/host test`
- `pnpm --filter @playground/todo-app test`
- `pnpm --filter @playground/todo-app test:integration`
- `pnpm --filter @playground/host type-check`
