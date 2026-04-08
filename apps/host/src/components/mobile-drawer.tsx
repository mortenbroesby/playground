import { useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import type { NavItem } from '@/lib/nav';
import { cn } from '@/lib/utils';
import { appStatusMeta } from '@/lib/theme';

interface MobileDrawerProps {
  footerLinkHref?: string;
  footerLinkLabel?: string;
  isOpen: boolean;
  navItems: readonly NavItem[];
  onClose: () => void;
  title: string;
  subtitle: string;
  showMeta?: boolean;
}

export function MobileDrawer({
  footerLinkHref,
  footerLinkLabel,
  isOpen,
  navItems,
  onClose,
  title,
  subtitle,
  showMeta = true,
}: MobileDrawerProps) {
  const location = useLocation();

  // Close on route change
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        data-testid="mobile-drawer"
        className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border/80 bg-card/95 p-4 backdrop-blur-sm"
      >
        <div className="terminal-panel terminal-panel--quiet flex h-full flex-col p-3">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <div>
              <p className="chrome-label">{title}</p>
              <p className="terminal-heading mt-1 text-sm text-foreground">{subtitle}</p>
            </div>
            <button
              data-testid="mobile-drawer-close"
              onClick={onClose}
              aria-label="Close navigation menu"
              className="rounded-md border border-border/60 bg-background/30 p-1.5 text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            >
              <span className="chrome-label text-sm leading-none">✕</span>
            </button>
          </div>

          <nav className="mt-3 space-y-2">
            {navItems.map((app) => (
              <NavLink
                key={app.href}
                to={app.href}
                className={({ isActive }) =>
                  cn(
                    'group block rounded-md border px-3 py-2 transition-colors',
                    isActive
                      ? 'border-primary/50 bg-primary/10 text-foreground shadow-[inset_0_0_0_1px_rgba(110,255,184,0.08)]'
                      : 'border-border/60 bg-background/30 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  )
                }
              >
                {({ isActive }) => {
                  const meta = appStatusMeta[app.href];
                  return (
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          'status-led mt-1',
                          isActive ? 'status-led--live' : 'status-led--accent opacity-60'
                        )}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <div className="terminal-heading text-sm uppercase tracking-[0.16em]">
                          {app.label}
                        </div>
                        {showMeta ? (
                          <div className="mt-1">
                            <div className="chrome-label">{meta?.code ?? 'SYS-00'}</div>
                            <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/80">
                              {meta?.status ?? 'standby'}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                }}
              </NavLink>
            ))}
          </nav>

          {footerLinkHref && footerLinkLabel ? (
            <div className="mt-auto border-t border-border/70 pt-3">
              <Link
                to={footerLinkHref}
                onClick={onClose}
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <span className="chrome-label text-primary">exit</span>
                <span>{footerLinkLabel}</span>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
