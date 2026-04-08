import { Badge } from '@playground/ui';
import { useLocation } from 'react-router-dom';
import { appStatusMeta } from '@/lib/theme';

interface HeaderProps {
  onMenuOpen: () => void;
}

export function Header({ onMenuOpen }: HeaderProps) {
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
            <Badge tone="primary">host online</Badge>
            <Badge tone="muted">{activeRoute.code}</Badge>
            <span className="chrome-label text-muted-foreground">{activeRoute.status}</span>
          </div>
        </div>

        <button
          data-testid="mobile-menu-button"
          onClick={onMenuOpen}
          aria-label="Open navigation menu"
          className="flex items-center justify-center rounded-md border border-border/60 bg-background/30 p-2 text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground md:hidden"
        >
          <span className="chrome-label text-base leading-none">≡</span>
        </button>
      </div>
    </header>
  );
}
