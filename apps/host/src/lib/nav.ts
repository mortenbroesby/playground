export type NavItem = {
  href: string;
  label: string;
};

export const SITE_NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/writing', label: 'Writing' },
  { href: '/uses', label: 'Uses' },
  { href: '/playground', label: 'Playground' },
] as const satisfies readonly NavItem[];

export const PLAYGROUND_NAV_ITEMS = [
  { href: '/playground', label: 'Playground' },
  { href: '/playground/system', label: 'System' },
  { href: '/playground/todo', label: 'Todo' },
  { href: '/playground/uplink', label: 'Uplink' },
] as const satisfies readonly NavItem[];
