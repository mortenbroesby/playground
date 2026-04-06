# @playground/host

Next.js shell for the playground microfrontend setup.

## Runtime model

The host always loads the todo remote from the same browser URL:

- `/remotes/todo-app/remoteEntry.js`

That path behaves consistently across environments:

- In development, Next.js rewrites it to `http://127.0.0.1:3101/remoteEntry.js`
- In production, the host build copies the remote bundle into `public/remotes/todo-app/`

## Local development

Run both workspaces together from the repo root:

```bash
pnpm dev:web
```

That starts the web stack and opens `http://127.0.0.1:3000/todo` automatically.

It runs:

- `@playground/host` on port `3000`
- `@playground/todo-app` on port `3101`

## Override

If needed, you can still override the remote URL with `NEXT_PUBLIC_TODO_MFE_URL`.
