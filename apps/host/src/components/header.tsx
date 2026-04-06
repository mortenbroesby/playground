import { useLocation } from 'react-router-dom';
import { appStatusMeta } from '@/lib/theme';

export function Header() {
  const location = useLocation();
  const activeRoute = appStatusMeta[location.pathname] ?? {
    code: 'SYS-00',
    status: 'standby',
  };

  return (
    <header className="border-b border-border/80 bg-card/80 px-4 py-3 backdrop-blur-sm sm:px-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="status-led status-led--live" aria-hidden="true" />
            <div className="min-w-0">
              <p className="chrome-label text-primary">playground</p>
              <p className="terminal-heading truncate text-sm text-foreground">operations shell</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <span className="signal-badge signal-badge--primary">host online</span>
            <span className="signal-badge signal-badge--muted">{activeRoute.code}</span>
            <span className="chrome-label text-muted-foreground">{activeRoute.status}</span>
          </div>
        </div>

        <a
          href="https://github.com/mortenbroesby/playground"
          target="_blank"
          rel="noopener noreferrer"
          className="terminal-button terminal-button--ghost px-3 py-2 text-[0.7rem]"
        >
          GitHub ↗
        </a>
      </div>
    </header>
  );
}
