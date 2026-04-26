import { Badge, Button, Panel } from '@playground/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { NowPlayingWidget } from '@/domain/spotify/NowPlayingWidget';
import { CommandMenu } from '@/ui/CommandMenu/CommandMenu';
import { MobileDrawer } from '@/ui/MobileDrawer/MobileDrawer';
import { SITE_NAV_ITEMS } from '@/infrastructure/nav';
import { cn } from '@/utils/utils';

function getActiveNavLabel(pathname: string) {
  if (pathname === '/') {
    return 'Home';
  }

  return SITE_NAV_ITEMS.find((item) => item.href !== '/' && pathname.startsWith(item.href))?.label;
}

export function PublicLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [queryClient] = useState(() => new QueryClient());
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const location = useLocation();
  const activeNavLabel = getActiveNavLabel(location.pathname);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen text-foreground antialiased">
        <header className="px-4 pt-4 sm:px-6 sm:pt-6">
          <Panel tone="quiet" className="mx-auto max-w-4xl">
            <div className="flex items-start justify-between gap-4 px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <p className="chrome-label text-primary">personal site</p>
                <NavLink to="/" className="mt-2 block terminal-heading text-sm text-foreground sm:text-base">
                  Morten Broesby-Olsen
                </NavLink>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-2 lg:flex">
                  <Badge tone="primary">public shell</Badge>
                  {activeNavLabel ? <Badge tone="muted">{activeNavLabel}</Badge> : null}
                </div>

                <CommandMenu />

                <Button
                  type="button"
                  variant="secondary"
                  data-testid="mobile-menu-button"
                  onClick={() => setIsDrawerOpen(true)}
                  aria-label="Open navigation menu"
                  className="min-h-0 px-3 py-2 md:hidden"
                >
                  Menu
                </Button>
              </div>
            </div>

            <div className="hidden border-t border-border/70 px-4 py-3 md:block sm:px-5">
              <nav className="flex flex-wrap gap-2">
                {SITE_NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        'terminal-heading inline-flex rounded-md border px-3 py-2 text-xs uppercase tracking-[0.16em]',
                        isActive
                          ? 'border-primary/50 bg-primary/10 text-foreground shadow-[inset_0_0_0_1px_rgba(110,255,184,0.08)]'
                          : 'border-border/60 bg-background/20 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </Panel>
        </header>

        <MobileDrawer
          isOpen={isDrawerOpen}
          navItems={SITE_NAV_ITEMS}
          onClose={closeDrawer}
          title="Pages"
          subtitle="Main site"
          showMeta={false}
          variant="public"
        />

        <main className="pb-6">
          <Outlet />
        </main>

        <footer className="mt-10 px-4 pb-8 sm:px-6 sm:pb-10">
          <Panel tone="quiet" className="mx-auto max-w-4xl">
            <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <p className="chrome-label text-primary">site footer</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  © 2022-present Morten Broesby-Olsen. All rights reserved.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge tone="muted">personal site</Badge>
                <Badge tone="accent">playground linked</Badge>
              </div>
            </div>
          </Panel>
        </footer>

        <NowPlayingWidget />
      </div>
    </QueryClientProvider>
  );
}
