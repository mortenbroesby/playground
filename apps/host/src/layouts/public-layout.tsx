import { NavLink, Outlet } from 'react-router-dom';
import { CommandMenu } from '@/components/command-menu';
import { SITE_NAV_ITEMS } from '../lib/nav';

export function PublicLayout() {
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

          <CommandMenu />
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
