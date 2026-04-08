import { useCallback, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { CommandMenu } from '@/components/command-menu';
import { MobileDrawer } from '@/components/mobile-drawer';
import { SITE_NAV_ITEMS } from '../lib/nav';

export function PublicLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  return (
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

          <div className="hidden md:block">
            <CommandMenu />
          </div>

          <button
            data-testid="mobile-menu-button"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="flex items-center justify-center text-sm text-muted-foreground transition-colors hover:text-foreground md:hidden"
          >
            Menu
          </button>
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
    </div>
  );
}
