# @playground/todo-app

Injected todo microfrontend for the playground host.

## Commands

```bash
pnpm --filter @playground/todo-app build
pnpm --filter @playground/todo-app test
pnpm --filter @playground/todo-app test:integration
```

## Mount contract

- Exposes `mount(target, options)`
- Returns a handle with `getSnapshot()`, `replaceTodos()`, `clearTodos()`, and `unmount()`
- Emits structured host events like `ready`, `todo:toggled`, and `todos:replaced`
- Is loaded by the host through an injected client-side import, not a browser URL

## Testing

- Unit coverage lives in `src/store.test.ts`
- Integration coverage lives in `tests/integration/render.integration.test.tsx`
- The integration test proves both rendering and bidirectional host↔mFE communication
