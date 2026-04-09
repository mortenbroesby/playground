import { afterEach, beforeEach, vi } from 'vitest';

beforeEach(() => {
  (
    globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT: boolean;
    }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      if (url === '/api/now-playing') {
        return new Response(JSON.stringify({ isPlaying: false }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      throw new Error(`Unexpected fetch request in test: ${url}`);
    }),
  );
});

afterEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
