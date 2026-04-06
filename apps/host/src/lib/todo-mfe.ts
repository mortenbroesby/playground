export const DEFAULT_TODO_MFE_URL = 'http://localhost:3101/remoteEntry.js';

export const todoMfeUrl =
  process.env.NEXT_PUBLIC_TODO_MFE_URL ?? DEFAULT_TODO_MFE_URL;
