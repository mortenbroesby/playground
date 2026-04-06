export const NAV_APPS = [
  { href: '/about', label: 'About' },
  { href: '/system', label: 'System' },
  { href: '/todo', label: 'Todo' },
] as const;

export type NavApp = (typeof NAV_APPS)[number];
