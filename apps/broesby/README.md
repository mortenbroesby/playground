# Broesby App

Local checks:

- `pnpm --filter @playground/broesby type-check`
- `pnpm --filter @playground/broesby test`
- `pnpm --filter @playground/broesby build`

Optional env vars:

- `VITE_BROESBY_SHARED_PASSWORD`

Leave `VITE_BROESBY_SHARED_PASSWORD` empty for no password gate.

Persistence notes:

- anecdotes and chat are stored in browser `localStorage`
- content is not shared across devices or browsers
