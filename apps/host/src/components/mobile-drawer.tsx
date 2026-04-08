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
  variant?: 'public' | 'playground';
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
  variant = 'playground',
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
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 p-4',
          variant === 'public'
            ? 'border-r border-border/60 bg-background'
            : 'border-r border-border/80 bg-card/95 backdrop-blur-sm'
        )}
      >
        <div
          className={cn(
            'flex h-full flex-col',
            variant === 'public' ? 'p-0' : 'terminal-panel terminal-panel--quiet p-3'
          )}
        >
          <div
            className={cn(
              'flex items-center justify-between pb-3',
              variant === 'public' ? 'border-b border-border/60' : 'border-b border-border/70'
            )}
          >
            <div>
              <p className={cn(variant === 'public' ? 'text-xs text-muted-foreground' : 'chrome-label')}>
                {title}
              </p>
              <p
                className={cn(
                  'mt-1 text-xs text-foreground',
                  variant === 'public' ? 'font-medium tracking-tight' : 'terminal-heading'
                )}
              >
                {subtitle}
              </p>
            </div>
            <button
              data-testid="mobile-drawer-close"
              onClick={onClose}
              aria-label="Close navigation menu"
              className={cn(
                'text-muted-foreground transition-colors hover:text-foreground',
                variant === 'public'
                  ? 'rounded-md border border-border/50 bg-background p-1.5'
                  : 'min-w-11 rounded-sm border border-border/60 bg-background/30 px-3 py-2 hover:border-primary/30'
              )}
            >
              <span className={cn('text-sm leading-none', variant === 'public' ? '' : 'chrome-label')}>
                ✕
              </span>
            </button>
          </div>

          <nav className="mt-3 space-y-2">
            {navItems.map((app) => (
              <NavLink
                key={app.href}
                to={app.href}
                end={app.href === '/playground'}
                className={({ isActive }) =>
                  cn(
                    'group block rounded-md px-3 py-2 transition-colors',
                    variant === 'public'
                      ? isActive
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      : isActive
                        ? 'border border-primary/50 bg-primary/10 text-foreground shadow-[inset_0_0_0_1px_rgba(110,255,184,0.08)]'
                        : 'border border-border/60 bg-background/30 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  )
                }
              >
                {({ isActive }) => {
                  const meta = appStatusMeta[app.href];
                  return (
                    <div className={cn('flex items-start', variant === 'public' ? 'gap-0' : 'gap-3')}>
                      {variant === 'playground' ? (
                        <span
                          className={cn(
                            'status-led mt-1',
                            isActive ? 'status-led--live' : 'status-led--accent opacity-60'
                          )}
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="min-w-0">
                        <div
                          className={cn(
                            'text-xs text-foreground',
                            variant === 'public'
                              ? 'font-medium tracking-tight'
                              : 'terminal-heading uppercase tracking-[0.14em]'
                          )}
                        >
                          {app.label}
                        </div>
                        {showMeta ? (
                          <div className="mt-1">
                            <div className="chrome-label">{meta?.code ?? 'SYS-00'}</div>
                            <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
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
            <div
              className={cn(
                'mt-auto pt-3',
                variant === 'public' ? 'border-t border-border/60' : 'border-t border-border/70'
              )}
            >
              <Link
                to={footerLinkHref}
                onClick={onClose}
                className={cn(
                  'inline-flex items-center gap-2 text-xs transition-colors hover:text-foreground',
                  variant === 'public' ? 'text-muted-foreground' : 'font-medium text-muted-foreground'
                )}
              >
                {variant === 'public' ? null : <span className="chrome-label text-primary">exit</span>}
                <span>{footerLinkLabel}</span>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
