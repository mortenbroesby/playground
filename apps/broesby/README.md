# Broesby App

Local checks:

- `pnpm --filter @playground/broesby type-check`
- `pnpm --filter @playground/broesby test`
- `pnpm --filter @playground/broesby build`

Required env vars:

- `VITE_BROESBY_SHARED_PASSWORD`

Persistence notes:

- anecdotes and chat are stored in browser `localStorage`
- content is not shared across devices or browsers
