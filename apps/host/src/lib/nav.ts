export const NAV_APPS = [
  { href: '/about', label: 'About' },
  { href: '/system', label: 'System' },
  { href: '/todo', label: 'Todo' },
  { href: '/game', label: 'Uplink' },
] as const;

export type NavApp = (typeof NAV_APPS)[number];
