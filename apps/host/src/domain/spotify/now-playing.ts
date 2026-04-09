export type NowPlayingIdleState = {
  isPlaying: false;
};

export type NowPlayingTrackState = {
  isPlaying: boolean;
  track: string;
  artist: string;
  albumArt: string;
  songUrl: string;
};

export type NowPlayingState = NowPlayingIdleState | NowPlayingTrackState;

export const idleNowPlayingState: NowPlayingIdleState = {
  isPlaying: false,
};
