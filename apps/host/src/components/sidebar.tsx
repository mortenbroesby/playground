import { Link, NavLink } from 'react-router-dom';
import type { NavItem } from '@/lib/nav';
import { cn } from '@/lib/utils';
import { appStatusMeta } from '@/lib/theme';

interface SidebarProps {
  footerLinkHref?: string;
  footerLinkLabel?: string;
  navItems: readonly NavItem[];
  title: string;
  subtitle: string;
  showMeta?: boolean;
}

export function Sidebar({
  footerLinkHref,
  footerLinkLabel,
  navItems,
  title,
  subtitle,
  showMeta = true,
}: SidebarProps) {
  return (
    <aside className="hidden w-24 shrink-0 border-r border-border/80 bg-card/70 p-3 md:block md:w-60 md:p-4">
      <div className="terminal-panel terminal-panel--quiet flex h-full flex-col p-2 sm:p-3">
        <div className="border-b border-border/70 px-2 pb-3">
          <p className="chrome-label">{title}</p>
          <p className="terminal-heading mt-2 hidden text-xs text-foreground sm:block">{subtitle}</p>
        </div>

        <nav className="mt-3 space-y-2">
          {navItems.map((app) => (
            <NavLink
              key={app.href}
              to={app.href}
              end={app.href === '/playground'}
              className={({ isActive }) =>
                cn(
                  'group block rounded-md border px-2 py-2 transition-colors sm:px-3',
                  isActive
                    ? 'border-primary/50 bg-primary/10 text-foreground shadow-[inset_0_0_0_1px_rgba(110,255,184,0.08)]'
                    : 'border-border/60 bg-background/30 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                )
              }
            >
              {({ isActive }) => {
                const meta = appStatusMeta[app.href];

                return (
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span
                      className={cn(
                        'status-led mt-1 hidden sm:inline-block',
                        isActive ? 'status-led--live' : 'status-led--accent opacity-60'
                      )}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div className="terminal-heading text-[11px] uppercase tracking-[0.18em] sm:text-xs sm:tracking-[0.14em]">
                        {app.label}
                      </div>
                      {showMeta ? (
                        <div className="mt-1 hidden sm:block">
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
          <div className="mt-auto border-t border-border/70 px-2 pt-3">
            <Link
              to={footerLinkHref}
              className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="chrome-label text-primary">exit</span>
              <span>{footerLinkLabel}</span>
            </Link>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
