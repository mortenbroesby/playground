# @playground/host

Next.js shell for the playground microfrontend setup.

## Composition model

The host mounts the todo app from the workspace with a client-side dynamic import.

- No `remoteEntry.js`
- No proxy rewrite
- No copied remote bundle in `public/`

The host and todo app communicate through the mount contract:

- The host receives structured events from the microfrontend
- The host can seed or clear todos through the returned handle
- The todo app renders inside `/todo` but manages its own UI

## Local development

Run the host from the repo root:

```bash
pnpm dev:web
```

That starts the web stack and opens `http://127.0.0.1:3000/todo` automatically.

It runs:

- `@playground/host` on port `3000`

## Verification

- `pnpm --filter @playground/todo-app test`
- `pnpm --filter @playground/todo-app test:integration`
- `pnpm --filter @playground/host type-check`
