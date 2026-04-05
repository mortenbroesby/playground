# @playground/host

Next.js orchestration shell that composes todo micro frontends at runtime.

## Runtime contract

The host loads each remote from a URL and expects a `mount(container, { bridge })` function.
The bridge exposes:

- `getSnapshot()`
- `publish(event)`
- `subscribe(listener)`

## Scripts

- `pnpm --filter @playground/host dev`
- `pnpm --filter @playground/host build`
- `pnpm --filter @playground/host type-check`
