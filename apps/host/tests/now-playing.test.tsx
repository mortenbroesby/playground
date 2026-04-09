import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NowPlayingWidget } from '../src/domain/spotify/NowPlayingWidget';
import { useNowPlaying } from '../src/domain/spotify/use-now-playing';

let root: Root | null = null;

function getByTestId(id: string) {
  const element = document.querySelector<HTMLElement>(`[data-testid="${id}"]`);

  if (!element) {
    throw new Error(`Expected element with data-testid="${id}"`);
  }

  return element;
}

function NowPlayingProbe() {
  const query = useNowPlaying();

  if (query.isLoading) {
    return <div data-testid="now-playing-probe">loading</div>;
  }

  if (query.isError) {
    return <div data-testid="now-playing-probe">error</div>;
  }

  return (
    <div data-testid="now-playing-probe">
      {query.data?.isPlaying ? `${query.data.track} by ${query.data.artist}` : 'idle'}
    </div>
  );
}

async function renderWithQuery(ui: JSX.Element) {
  document.body.innerHTML = '<div id="root"></div>';
  const container = document.getElementById('root');

  if (!container) {
    throw new Error('Missing root container');
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  root = createRoot(container);

  await act(async () => {
    root!.render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
    await Promise.resolve();
  });
}

async function waitForQueryUpdate(assertion: () => void) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    await act(async () => {
      await Promise.resolve();
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Query update did not settle');
}

describe('now playing query', () => {
  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
      root?.unmount();
      await Promise.resolve();
    });

    root = null;
  });

  it('returns playing data through the query hook', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          isPlaying: true,
          track: 'Halcyon',
          artist: 'Orbital',
          albumArt: 'https://images.example/halcyon.jpg',
          songUrl: 'https://open.spotify.com/track/halcyon',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    await renderWithQuery(<NowPlayingProbe />);

    await waitForQueryUpdate(() => {
      expect(getByTestId('now-playing-probe').textContent).toContain('Halcyon by Orbital');
    });
  });

  it('treats a 204 response as idle state', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));

    await renderWithQuery(<NowPlayingProbe />);

    await waitForQueryUpdate(() => {
      expect(getByTestId('now-playing-probe').textContent).toBe('idle');
    });
  });

  it('hides the widget when the request fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network unavailable'));

    await renderWithQuery(<NowPlayingWidget />);

    await waitForQueryUpdate(() => {
      expect(document.querySelector('[data-testid="now-playing-widget"]')).toBeNull();
    });
  });

  it('renders the footer widget when Spotify is active', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          isPlaying: true,
          track: 'Archangel',
          artist: 'Burial',
          albumArt: 'https://images.example/archangel.jpg',
          songUrl: 'https://open.spotify.com/track/archangel',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    await renderWithQuery(<NowPlayingWidget />);

    await waitForQueryUpdate(() => {
      expect(getByTestId('now-playing-widget').getAttribute('aria-label')).toBe(
        'Now playing: Archangel by Burial',
      );
      expect(getByTestId('toggle-now-playing-widget').getAttribute('aria-expanded')).toBe('false');
      expect(document.querySelector('[data-testid="now-playing-details"]')).toBeNull();
      expect(document.querySelector('[data-testid="now-playing-track"]')).toBeNull();
    });
  });

  it('renders the footer widget with a last played label when Spotify is paused', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          isPlaying: false,
          track: 'Club Cant Handle Me',
          artist: 'Flo Rida, David Guetta',
          albumArt: 'https://images.example/club-cant-handle-me.jpg',
          songUrl: 'https://open.spotify.com/track/club-cant-handle-me',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    await renderWithQuery(<NowPlayingWidget />);

    await waitForQueryUpdate(() => {
      expect(getByTestId('now-playing-widget').getAttribute('aria-label')).toBe(
        'Last played: Club Cant Handle Me by Flo Rida, David Guetta',
      );
      expect(document.querySelector('[data-testid="now-playing-artist"]')).toBeNull();
      expect(document.querySelector('[data-testid="now-playing-track"]')).toBeNull();
    });
  });

  it('shows details when the folded card is clicked', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          isPlaying: false,
          track: 'Nightcall',
          artist: 'Kavinsky',
          albumArt: 'https://images.example/nightcall.jpg',
          songUrl: 'https://open.spotify.com/track/nightcall',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    await renderWithQuery(<NowPlayingWidget />);

    await waitForQueryUpdate(() => {
      expect(getByTestId('toggle-now-playing-widget').getAttribute('aria-expanded')).toBe('false');
    });

    await act(async () => {
      getByTestId('toggle-now-playing-widget').click();
      await Promise.resolve();
    });

    expect(getByTestId('toggle-now-playing-widget').getAttribute('aria-expanded')).toBe('true');
    expect(getByTestId('now-playing-track').textContent).toBe('Nightcall');
    expect(getByTestId('now-playing-artist').textContent).toBe('Kavinsky');
    expect(getByTestId('dismiss-now-playing-widget')).toBeTruthy();
  });

  it('allows the current card to be dismissed', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          isPlaying: false,
          track: 'Midnight City',
          artist: 'M83',
          albumArt: 'https://images.example/midnight-city.jpg',
          songUrl: 'https://open.spotify.com/track/midnight-city',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    await renderWithQuery(<NowPlayingWidget />);

    await waitForQueryUpdate(() => {
      expect(getByTestId('now-playing-widget')).not.toBeNull();
    });

    await act(async () => {
      getByTestId('toggle-now-playing-widget').click();
      await Promise.resolve();
    });

    await act(async () => {
      getByTestId('dismiss-now-playing-widget').click();
      await Promise.resolve();
    });

    expect(document.querySelector('[data-testid="now-playing-widget"]')).toBeNull();
    expect(localStorage.getItem('spotify-card-dismissed-track')).toContain('Midnight City');
  });
});
