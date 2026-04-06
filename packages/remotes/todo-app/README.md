# @playground/todo-app

Vite-built todo microfrontend remote for the playground host.

## Commands

```bash
pnpm --filter @playground/todo-app dev
pnpm --filter @playground/todo-app build
pnpm --filter @playground/todo-app test
```

## Runtime contract

- Exposes `mount(target: HTMLElement): () => void`
- Builds `remoteEntry.js`
- Local dev server runs on `127.0.0.1:3101`
- Production bundle is copied into `apps/host/public/remotes/todo-app/`
