const DEV_TODO_MFE_URL = 'http://127.0.0.1:3101/remoteEntry.js';
const PROD_TODO_MFE_URL = '/remotes/todo-app/remoteEntry.js';

export const DEFAULT_TODO_MFE_URL =
  process.env.NODE_ENV === 'production' ? PROD_TODO_MFE_URL : DEV_TODO_MFE_URL;

export const todoMfeUrl =
  process.env.NEXT_PUBLIC_TODO_MFE_URL ?? DEFAULT_TODO_MFE_URL;
