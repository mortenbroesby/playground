# Spotify Now-Playing Design

**Date:** 2026-04-09
**Status:** Approved

## Summary

Add a persistent, ambient "now playing" widget to the public shell footer. The widget shows album art, track name, and artist with a subtle animated waveform when Spotify is active. It disappears entirely when nothing is playing. A thin Vercel serverless function proxies Spotify credentials so they never reach the client.

This also introduces TanStack Query as the host's general data-fetching foundation.

## Architecture

Three layers:

1. **Vercel serverless function** — `apps/host/api/now-playing.ts`
2. **TanStack Query hook** — `useNowPlaying` with polling and graceful idle handling
3. **Shell widget** — `NowPlayingWidget` rendered in the public shell footer

## Data Flow

Spotify OAuth credentials (`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`) are stored as Vercel environment variables.

On each request to `/api/now-playing`:

1. Function POSTs to Spotify token endpoint with the refresh token → receives a short-lived access token
2. GETs `/me/player/currently-playing` with that token
3. If 204 (nothing playing) → returns `{ isPlaying: false }`
4. If 200 → returns `{ isPlaying: true, track, artist, albumArt }`
5. Response includes `Cache-Control: public, max-age=30` so Vercel's CDN absorbs repeated hits

Credentials never leave the server. No client-side auth.

## TanStack Query Setup

- `QueryClientProvider` added at the public layout root
- `useNowPlaying` hook wraps `useQuery`:
  - `refetchInterval: 30_000`
  - `refetchOnWindowFocus: true`
  - 204 response treated as `{ isPlaying: false }`, not an error
  - Network errors fail silently — widget hides rather than shows an error state

## Widget Design

`NowPlayingWidget` lives in the public shell footer.

**When playing:**
- 40×40px album art thumbnail, rounded corners
- Track name + artist in two lines, small type, muted palette
- Three-bar waveform SVG with staggered CSS keyframe animation while playing

**When not playing or fetch fails:**
- Renders `null` — no empty state, no placeholder

**Accessibility:**
- `aria-label="Now playing: {track} by {artist}"` on the container
- Animation respects `prefers-reduced-motion` — bars are static when motion is reduced

## Environment Setup

| Variable | Purpose |
|---|---|
| `SPOTIFY_CLIENT_ID` | Spotify app client ID |
| `SPOTIFY_CLIENT_SECRET` | Spotify app client secret |
| `SPOTIFY_REFRESH_TOKEN` | Long-lived refresh token from one-time OAuth flow |

- A one-time local script generates the refresh token via the OAuth authorization code flow
- `.env.local` holds all three vars for local Vite dev
- When vars are absent the function returns `{ isPlaying: false }` gracefully

## Testing

- **Serverless function unit tests** — mock Spotify responses (200, 204, error), assert normalized payload shape
- **`useNowPlaying` hook unit tests** — mock `/api/now-playing`, assert query states (loading, playing, idle)
- No E2E test — widget is ambient UI, not a critical user path

## Out of Scope

- SSR integration (deferred — host stays CSR for now)
- Multiple widget placements (single footer placement only)
- "Recently played" fallback when nothing is active
