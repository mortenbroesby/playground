---
id: "mem-20260429-spotify-now-playing-boundary"
type: "architecture-record"
repo_slug: "playground"
title: "Spotify Now Playing Boundary"
status: "accepted"
created: "2026-04-29"
updated: "2026-04-29"
owner: "morten"
summary: "Spotify now-playing is split between a Vercel Node function, a host server helper, and a React Query client hook."
tags:
  - "type/architecture"
  - "repo/playground"
keywords:
  - "spotify"
  - "now playing"
  - "vercel function"
  - "api boundary"
  - "react query"
links:
  parents: []
  children: []
  related: []
  supersedes: []
  superseded_by: []
retention:
  review_after: "2026-10-26"
  expires_after: null
  keep: true
related_paths:
  - "apps/host/api/now-playing.ts"
  - "apps/host/src/server/now-playing.ts"
  - "apps/host/src/domain/spotify/use-now-playing.ts"
  - "apps/host/src/domain/spotify/NowPlayingWidget.tsx"
---

## Runtime Shape

The public site footer can show Spotify now-playing state. The boundary has three layers:

- `apps/host/api/now-playing.ts` is the Vercel Node.js function entrypoint.
- `apps/host/src/server/now-playing.ts` owns token refresh, Spotify API calls, response
  normalization, idle fallback, cache headers, and error responses.
- `apps/host/src/domain/spotify/use-now-playing.ts` fetches `/api/now-playing` through React Query
  and refetches every 30 seconds.

## Environment Behavior

If `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, or `SPOTIFY_REFRESH_TOKEN` is missing, the server
returns the idle state instead of failing the page.

If the currently-playing endpoint returns no active track, the server tries the recently-played
endpoint and returns that track as `isPlaying: false`.

## Deployment Detail

This project is ESM-first. The API entrypoint imports the server helper with a `.js` extension so
Vercel's serverless loader resolves the compiled module correctly.
