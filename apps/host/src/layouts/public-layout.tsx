import { AppShell } from '../App';
import { SITE_NAV_ITEMS } from '../lib/nav';

export function PublicLayout() {
  return (
    <AppShell
      brandLabel="@mortenbroesby"
      brandTitle="personal site"
      drawerTitle="Site map"
      drawerSubtitle="Explore pages"
      navItems={SITE_NAV_ITEMS}
      primaryBadge="site live"
      showRouteMeta={false}
      showSidebarMeta={false}
    />
  );
}
