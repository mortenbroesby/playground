import { AppShell } from '../App';
import { PLAYGROUND_NAV_ITEMS } from '@/infrastructure/nav';

export function PlaygroundLayout() {
  return (
    <AppShell
      brandLabel="playground"
      brandTitle="live experiments"
      drawerTitle="Lab map"
      drawerSubtitle="Apps and routes"
      footerLinkHref="/"
      footerLinkLabel="Back to main site"
      navItems={PLAYGROUND_NAV_ITEMS}
      primaryBadge="lab live"
      showRouteMeta
      showSidebarMeta
    />
  );
}
