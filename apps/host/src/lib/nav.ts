export const NAV_APPS = [
  { href: '/todo', label: 'Todo' },
  { href: '/uses', label: '@mortenbroesby' },
] as const;

export type NavApp = (typeof NAV_APPS)[number];
