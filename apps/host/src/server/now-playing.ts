import { idleNowPlayingState, type NowPlayingState } from '../domain/spotify/now-playing.js';

const CACHE_CONTROL_HEADER = 'public, max-age=30';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_CURRENTLY_PLAYING_URL = 'https://api.spotify.com/v1/me/player/currently-playing';
const SPOTIFY_RECENTLY_PLAYED_URL = 'https://api.spotify.com/v1/me/player/recently-played?limit=1';

type SpotifyEnv = {
  SPOTIFY_CLIENT_ID?: string;
  SPOTIFY_CLIENT_SECRET?: string;
  SPOTIFY_REFRESH_TOKEN?: string;
};

type CreateNowPlayingResponseOptions = {
  env: SpotifyEnv;
  fetchImpl: typeof fetch;
};

type SpotifyTokenResponse = {
  access_token?: string;
};

type SpotifyCurrentlyPlayingResponse = {
  is_playing?: boolean;
  item?: {
    name?: string;
    artists?: Array<{ name?: string }>;
    album?: {
      images?: Array<{ url?: string }>;
    };
  };
};

type SpotifyTrack = {
  name?: string;
  artists?: Array<{ name?: string }>;
  album?: {
    images?: Array<{ url?: string }>;
  };
  external_urls?: {
    spotify?: string;
  };
};

type SpotifyRecentlyPlayedResponse = {
  items?: Array<{
    track?: SpotifyTrack;
  }>;
};

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}

function createIdleResponse() {
  return jsonResponse(idleNowPlayingState, {
    status: 200,
    headers: {
      'Cache-Control': CACHE_CONTROL_HEADER,
    },
  });
}

function normalizeTrack(
  track: SpotifyTrack | undefined,
  isPlaying: boolean,
): NowPlayingState {
  if (!track?.name) {
    return idleNowPlayingState;
  }

  const artist = track.artists
    ?.map((entry) => entry.name?.trim())
    .filter((name): name is string => Boolean(name))
    .join(', ');
  const albumArt = track.album?.images?.find((image) => image.url?.trim())?.url?.trim();

  if (!artist || !albumArt) {
    return idleNowPlayingState;
  }

  return {
    isPlaying,
    track: track.name,
    artist,
    albumArt,
    songUrl: track.external_urls?.spotify?.trim() || 'https://open.spotify.com/',
  };
}

function normalizeCurrentlyPlaying(payload: SpotifyCurrentlyPlayingResponse): NowPlayingState {
  return normalizeTrack(payload.item, Boolean(payload.is_playing));
}

function normalizeRecentlyPlayed(payload: SpotifyRecentlyPlayedResponse): NowPlayingState {
  return normalizeTrack(payload.items?.[0]?.track, false);
}

async function getAccessToken(env: Required<SpotifyEnv>, fetchImpl: typeof fetch) {
  const response = await fetchImpl(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: env.SPOTIFY_REFRESH_TOKEN,
    }),
  });

  if (!response.ok) {
    throw new Error(`Spotify token request failed with status ${response.status}`);
  }

  const data = (await response.json()) as SpotifyTokenResponse;

  if (!data.access_token) {
    throw new Error('Spotify token response did not include an access token');
  }

  return data.access_token;
}

function hasSpotifyEnv(env: SpotifyEnv): env is Required<SpotifyEnv> {
  return Boolean(env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET && env.SPOTIFY_REFRESH_TOKEN);
}

export async function createNowPlayingResponse({
  env,
  fetchImpl,
}: CreateNowPlayingResponseOptions) {
  if (!hasSpotifyEnv(env)) {
    return createIdleResponse();
  }

  try {
    const accessToken = await getAccessToken(env, fetchImpl);
    const response = await fetchImpl(SPOTIFY_CURRENTLY_PLAYING_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 204) {
      const recentResponse = await fetchImpl(SPOTIFY_RECENTLY_PLAYED_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!recentResponse.ok) {
        throw new Error(`Spotify recently played request failed with status ${recentResponse.status}`);
      }

      const payload = normalizeRecentlyPlayed(
        (await recentResponse.json()) as SpotifyRecentlyPlayedResponse,
      );

      return jsonResponse(payload, {
        status: 200,
        headers: {
          'Cache-Control': CACHE_CONTROL_HEADER,
        },
      });
    }

    if (!response.ok) {
      throw new Error(`Spotify currently playing request failed with status ${response.status}`);
    }

    const payload = normalizeCurrentlyPlaying(
      (await response.json()) as SpotifyCurrentlyPlayingResponse,
    );

    return jsonResponse(payload, {
      status: 200,
      headers: {
        'Cache-Control': CACHE_CONTROL_HEADER,
      },
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Failed to load now playing state',
      },
      {
        status: 502,
      },
    );
  }
}
