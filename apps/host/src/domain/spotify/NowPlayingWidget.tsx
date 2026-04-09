import { ChevronUp, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNowPlaying } from './use-now-playing';

function NowPlayingWaveform({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 18 18"
      className={`${className} text-primary`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="1"
        y="6"
        width="3"
        height="11"
        rx="1.5"
        className="now-playing-wave-bar"
        fill="currentColor"
      />
      <rect
        x="7.5"
        y="2"
        width="3"
        height="15"
        rx="1.5"
        className="now-playing-wave-bar now-playing-wave-bar-2"
        fill="currentColor"
      />
      <rect
        x="14"
        y="8"
        width="3"
        height="9"
        rx="1.5"
        className="now-playing-wave-bar now-playing-wave-bar-3"
        fill="currentColor"
      />
    </svg>
  );
}

export function NowPlayingWidget() {
  const { data, isLoading, isError } = useNowPlaying();
  const [isExpanded, setIsExpanded] = useState(false);
  const trackData =
    data &&
    'track' in data &&
    data.track &&
    data.artist &&
    data.albumArt &&
    data.songUrl
      ? data
      : null;
  const trackKey = trackData
    ? `${trackData.isPlaying ? 'playing' : 'recent'}:${trackData.songUrl}:${trackData.track}:${trackData.artist}`
    : null;

  useEffect(() => {
    if (!trackKey) {
      return;
    }

    setIsExpanded(false);
  }, [trackKey]);

  if (
    isLoading ||
    isError ||
    !trackData ||
    !trackKey
  ) {
    return null;
  }

  return (
    <aside
      className="now-playing-card"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
      }}
      aria-live="polite"
    >
      <section
        data-testid="now-playing-widget"
        aria-label={`${trackData.isPlaying ? 'Now playing' : 'Last played'}: ${trackData.track} by ${trackData.artist}`}
        className="relative flex flex-col items-end"
      >
        {!isExpanded ? (
          <button
            type="button"
            data-testid="toggle-now-playing-widget"
            aria-expanded={false}
            aria-controls="now-playing-details"
            onClick={() => setIsExpanded(true)}
            className="relative rounded-xl border border-border/70 bg-[rgba(8,15,18,0.96)] p-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.22)] backdrop-blur-md transition-colors hover:border-border hover:bg-[rgba(10,18,22,0.98)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <div className="relative">
              <img
                src={trackData.albumArt}
                alt={`${trackData.track} by ${trackData.artist}`}
                width={44}
                height={44}
                loading="lazy"
                className={['h-11 w-11 shrink-0 rounded-md object-cover ring-1 ring-border/60', !trackData.isPlaying ? 'opacity-70' : ''].join(' ')}
              />
              {trackData.isPlaying ? (
                <div className="absolute bottom-1 right-1 rounded bg-black/70 p-0.5 backdrop-blur-sm">
                  <NowPlayingWaveform className="h-3 w-3" />
                </div>
              ) : null}
            </div>
          </button>
        ) : (
          <div
            id="now-playing-details"
            data-testid="now-playing-details"
            role="button"
            tabIndex={0}
            aria-label="Collapse"
            onClick={() => setIsExpanded(false)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsExpanded(false); }}
            className="now-playing-panel relative w-[min(14rem,calc(100vw-1rem))] cursor-pointer overflow-hidden rounded-xl border border-border/70 bg-[rgba(8,15,18,0.98)] shadow-[0_18px_40px_rgba(0,0,0,0.3)]"
          >
            {/* Full-width album art */}
            <div className="relative">
              <img
                src={trackData.albumArt}
                alt=""
                width={224}
                height={224}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
              <div className="absolute right-2 top-2">
                <button
                  type="button"
                  aria-label="Collapse"
                  aria-expanded={true}
                  aria-controls="now-playing-details"
                  onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                  className="inline-flex h-7 w-7 touch-manipulation items-center justify-center rounded-md bg-black/60 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <ChevronUp aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Track info */}
            <div className="p-3">
              <p
                data-testid="now-playing-track"
                className="truncate text-sm font-medium tracking-tight text-foreground"
              >
                {trackData.track}
              </p>
              <p data-testid="now-playing-artist" className="truncate text-xs text-muted-foreground">
                {trackData.artist}
              </p>

              <div className="mt-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {trackData.isPlaying ? (
                    <>
                      <NowPlayingWaveform className="h-3.5 w-3.5" />
                      <span>Playing now</span>
                    </>
                  ) : (
                    <span>Recently played</span>
                  )}
                </div>
                <a
                  href={trackData.songUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Open in Spotify"
                  className="inline-flex touch-manipulation items-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </section>
    </aside>
  );
}
