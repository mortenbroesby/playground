import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/header';
import { MobileDrawer } from '@/components/mobile-drawer';
import { Sidebar } from '@/components/sidebar';
import type { NavItem } from '@/lib/nav';

type AppShellProps = {
  brandLabel: string;
  brandTitle: string;
  drawerTitle: string;
  drawerSubtitle: string;
  footerLinkHref?: string;
  footerLinkLabel?: string;
  navItems: readonly NavItem[];
  primaryBadge: string;
  showRouteMeta?: boolean;
  showSidebarMeta?: boolean;
};

export function AppShell({
  brandLabel,
  brandTitle,
  drawerTitle,
  drawerSubtitle,
  footerLinkHref,
  footerLinkLabel,
  navItems,
  primaryBadge,
  showRouteMeta = true,
  showSidebarMeta = true,
}: AppShellProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  return (
    <div className="terminal-app flex h-screen flex-col overflow-hidden text-foreground antialiased">
      <Header
        brandLabel={brandLabel}
        brandTitle={brandTitle}
        onMenuOpen={() => setIsDrawerOpen(true)}
        primaryBadge={primaryBadge}
        showRouteMeta={showRouteMeta}
      />
      <MobileDrawer
        footerLinkHref={footerLinkHref}
        footerLinkLabel={footerLinkLabel}
        isOpen={isDrawerOpen}
        navItems={navItems}
        onClose={closeDrawer}
        title={drawerTitle}
        subtitle={drawerSubtitle}
        showMeta={showSidebarMeta}
      />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar
          footerLinkHref={footerLinkHref}
          footerLinkLabel={footerLinkLabel}
          navItems={navItems}
          title={drawerTitle}
          subtitle={drawerSubtitle}
          showMeta={showSidebarMeta}
        />
        <main className="terminal-grid terminal-scrollbars flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
