export const appStatusMeta: Record<string, { code: string; status: string }> = {
  '/about': { code: 'DOC-01', status: 'profile' },
  '/playground': { code: 'LAB-01', status: 'live' },
  '/system': { code: 'UI-01', status: 'online' },
  '/todo': { code: 'MF-01', status: 'online' },
  '/game': { code: 'GM-01', status: 'online' },
  '/uses': { code: 'DOC-02', status: 'redirect' },
  '/uses/gear': { code: 'DOC-02', status: 'indexed' },
  '/readme': { code: 'DOC-01', status: 'redirect' },
};
