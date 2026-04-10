import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { NowPlayingWidget } from '@/domain/spotify/NowPlayingWidget';
import { CommandMenu } from '@/ui/CommandMenu/CommandMenu';
import { MobileDrawer } from '@/ui/MobileDrawer/MobileDrawer';
import { SITE_NAV_ITEMS } from '@/infrastructure/nav';

export function PublicLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [queryClient] = useState(() => new QueryClient());
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground antialiased">
        <header className="border-b border-border/60 px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
            <NavLink to="/" className="text-sm font-medium tracking-tight text-foreground">
              Morten Broesby-Olsen
            </NavLink>

            <nav className="hidden items-center gap-5 md:flex">
              {SITE_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    [
                      'text-sm transition-colors',
                      isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <CommandMenu />

              <button
                data-testid="mobile-menu-button"
                onClick={() => setIsDrawerOpen(true)}
                aria-label="Open navigation menu"
                className="flex items-center justify-center text-sm text-muted-foreground transition-colors hover:text-foreground md:hidden"
              >
                Menu
              </button>
            </div>
          </div>
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

        <main>
          <Outlet />
        </main>

        <footer className="mt-16 border-t border-border/60 px-4 py-8 sm:px-6 sm:py-10">
          <div className="mx-auto max-w-4xl text-sm text-muted-foreground">
            <p>© 2022-present Morten Broesby-Olsen. All rights reserved.</p>
          </div>
        </footer>

        <NowPlayingWidget />
      </div>
    </QueryClientProvider>
  );
}
