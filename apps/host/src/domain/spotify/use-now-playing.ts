import { useQuery } from '@tanstack/react-query';
import { idleNowPlayingState, type NowPlayingState } from './now-playing';

async function fetchNowPlaying(): Promise<NowPlayingState> {
  const response = await fetch('/api/now-playing');

  if (response.status === 204) {
    return idleNowPlayingState;
  }

  if (!response.ok) {
    throw new Error(`Failed to load now playing state (${response.status})`);
  }

  return (await response.json()) as NowPlayingState;
}

export function useNowPlaying() {
  return useQuery({
    queryKey: ['now-playing'],
    queryFn: fetchNowPlaying,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    retry: false,
  });
}
