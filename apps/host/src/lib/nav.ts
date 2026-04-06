export const NAV_APPS = [
  { href: '/todo', label: 'Todo' },
  { href: '/readme', label: 'README' },
] as const;

export type NavApp = (typeof NAV_APPS)[number];
