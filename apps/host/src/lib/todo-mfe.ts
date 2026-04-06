export const DEFAULT_TODO_MFE_URL = 'http://127.0.0.1:3101/remoteEntry.js';

export const todoMfeUrl =
  process.env.NEXT_PUBLIC_TODO_MFE_URL ?? DEFAULT_TODO_MFE_URL;
