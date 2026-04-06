# @playground/host

Next.js orchestrator shell for the todo micro frontends.

## Runtime remotes

The shell loads micro frontends from URL-based ES modules:

- `NEXT_PUBLIC_TODO_INPUT_REMOTE_URL` (default `http://localhost:3101/remoteEntry.js`)
- `NEXT_PUBLIC_TODO_LIST_REMOTE_URL` (default `http://localhost:3102/remoteEntry.js`)
- `NEXT_PUBLIC_TODO_STATS_REMOTE_URL` (default `http://localhost:3103/remoteEntry.js`)
