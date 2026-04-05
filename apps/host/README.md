# @playground/host

Next.js orchestration shell that composes todo micro frontends at runtime.

## Runtime contract

The host loads each remote from a URL and expects a `mount(container, { bridge })` function.
The bridge exposes:

- `getSnapshot()`
- `publish(event)`
- `subscribe(listener)`

## Deployment notes (Vercel)

- This repository-level `vercel.json` is configured for `@playground/host`.
- If you create a separate Vercel project, set **Root Directory** to repository root (uses root `vercel.json`) or to `apps/host` (where `next` is declared in `package.json`).

## Scripts

- `pnpm --filter @playground/host dev`
- `pnpm --filter @playground/host build`
- `pnpm --filter @playground/host type-check`
- `pnpm --filter @playground/host test:browser`
