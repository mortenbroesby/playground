import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../api/now-playing';

const originalEnv = { ...process.env };

function setSpotifyEnv() {
  process.env.SPOTIFY_CLIENT_ID = 'client-id';
  process.env.SPOTIFY_CLIENT_SECRET = 'client-secret';
  process.env.SPOTIFY_REFRESH_TOKEN = 'refresh-token';
}

describe('now playing api', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns normalized track data when Spotify is actively playing', async () => {
    setSpotifyEnv();

    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'access-token' }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            is_playing: true,
            item: {
              name: 'Night Drive',
              artists: [{ name: 'Chromatics' }, { name: 'Guest Vocal' }],
              album: {
                images: [{ url: 'https://images.example/night-drive.jpg' }],
              },
              external_urls: {
                spotify: 'https://open.spotify.com/track/night-drive',
              },
            },
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=30');
    await expect(response.json()).resolves.toEqual({
      isPlaying: true,
      track: 'Night Drive',
      artist: 'Chromatics, Guest Vocal',
      albumArt: 'https://images.example/night-drive.jpg',
      songUrl: 'https://open.spotify.com/track/night-drive',
    });
  });

  it('returns last played data when Spotify has a current item but playback is paused', async () => {
    setSpotifyEnv();

    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'access-token' }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            is_playing: false,
            item: {
              name: 'Club Cant Handle Me',
              artists: [{ name: 'Flo Rida' }, { name: 'David Guetta' }],
              album: {
                images: [{ url: 'https://images.example/club-cant-handle-me.jpg' }],
              },
              external_urls: {
                spotify: 'https://open.spotify.com/track/club-cant-handle-me',
              },
            },
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=30');
    await expect(response.json()).resolves.toEqual({
      isPlaying: false,
      track: 'Club Cant Handle Me',
      artist: 'Flo Rida, David Guetta',
      albumArt: 'https://images.example/club-cant-handle-me.jpg',
      songUrl: 'https://open.spotify.com/track/club-cant-handle-me',
    });
  });

  it('returns an idle payload when Spotify reports nothing is playing', async () => {
    setSpotifyEnv();

    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'access-token' }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [
              {
                track: {
                  name: 'Midnight City',
                  artists: [{ name: 'M83' }],
                  album: {
                    images: [{ url: 'https://images.example/midnight-city.jpg' }],
                  },
                  external_urls: {
                    spotify: 'https://open.spotify.com/track/midnight-city',
                  },
                },
              },
            ],
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=30');
    await expect(response.json()).resolves.toEqual({
      isPlaying: false,
      track: 'Midnight City',
      artist: 'M83',
      albumArt: 'https://images.example/midnight-city.jpg',
      songUrl: 'https://open.spotify.com/track/midnight-city',
    });
  });

  it('returns idle when nothing is currently or recently available', async () => {
    setSpotifyEnv();

    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'access-token' }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ items: [] }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ isPlaying: false });
  });

  it('returns an idle payload when Spotify credentials are absent', async () => {
    delete process.env.SPOTIFY_CLIENT_ID;
    delete process.env.SPOTIFY_CLIENT_SECRET;
    delete process.env.SPOTIFY_REFRESH_TOKEN;

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ isPlaying: false });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns a 502 response when Spotify fails upstream', async () => {
    setSpotifyEnv();

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'bad_token' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    );

    const response = await GET();

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: 'Spotify token request failed with status 500',
    });
  });
});
