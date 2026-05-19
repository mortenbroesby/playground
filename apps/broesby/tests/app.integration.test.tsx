import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../src/App';

let root: Root | null = null;

afterEach(async () => {
  await act(async () => {
    await Promise.resolve();
    root?.unmount();
    await Promise.resolve();
  });

  root = null;
  document.body.innerHTML = '';
});

describe('broesby app shell', () => {
  it('renders the password gate by default', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    const container = document.getElementById('root');

    if (!container) {
      throw new Error('Missing root container');
    }

    root = createRoot(container);

    await act(async () => {
      root!.render(<App />);
      await Promise.resolve();
    });

    const heading = document.querySelector('h1');
    const passwordInput = document.querySelector<HTMLInputElement>('input[aria-label="Shared password"]');

    expect(heading?.textContent).toMatch(/broesby family/i);
    expect(passwordInput).toBeTruthy();
  });
});
