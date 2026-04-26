import { Button } from '@playground/ui';
import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { NavItem } from '@/infrastructure/nav';
import { cn } from '@/utils/utils';
import { appStatusMeta } from '@/infrastructure/theme';
import { NavigationFooterLink } from '@/ui/NavigationFooterLink/NavigationFooterLink';
import { NavigationMeta } from '@/ui/NavigationMeta/NavigationMeta';

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
          'fixed inset-y-0 left-0 z-50 w-72 p-4',
          variant === 'public' ? 'bg-transparent' : 'border-r border-border/80 bg-card/95 backdrop-blur-sm'
        )}
      >
        <div className="terminal-panel terminal-panel--quiet flex h-full flex-col p-3">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <div>
              <p className="chrome-label">{title}</p>
              <p className="terminal-heading mt-1 text-sm text-foreground">{subtitle}</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              data-testid="mobile-drawer-close"
              onClick={onClose}
              aria-label="Close navigation menu"
              className="min-h-0 px-3 py-2"
            >
              <span className="text-sm leading-none">Close</span>
            </Button>
          </div>

          <nav className="mt-3 space-y-2">
            {navItems.map((app) => (
              <NavLink
                key={app.href}
                to={app.href}
                className={({ isActive }) =>
                  cn(
                    'group block rounded-md border px-3 py-2 transition-colors',
                    variant === 'public'
                      ? isActive
                        ? 'border-primary/50 bg-primary/10 text-foreground shadow-[inset_0_0_0_1px_rgba(110,255,184,0.08)]'
                        : 'border-border/60 bg-background/20 text-muted-foreground hover:border-primary/30 hover:text-foreground'
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
                            'text-sm text-foreground',
                            variant === 'public'
                              ? 'terminal-heading uppercase tracking-[0.14em]'
                              : 'terminal-heading uppercase tracking-[0.16em]'
                          )}
                        >
                          {app.label}
                        </div>
                        {showMeta ? (
                          <NavigationMeta code={meta?.code ?? 'SYS-00'} status={meta?.status ?? 'standby'} />
                        ) : null}
                      </div>
                    </div>
                  );
                }}
              </NavLink>
            ))}
          </nav>

          {footerLinkHref && footerLinkLabel ? (
            <NavigationFooterLink
              className={cn(
                'mt-auto pt-3',
                variant === 'public' ? 'border-t border-border/60' : 'border-t border-border/70'
              )}
              href={footerLinkHref}
              label={footerLinkLabel}
              linkClassName={cn(
                'inline-flex items-center gap-2 text-sm transition-colors hover:text-foreground',
                variant === 'public' ? 'text-muted-foreground' : 'font-medium text-muted-foreground'
              )}
              onClick={onClose}
              showPrefix={variant !== 'public'}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
