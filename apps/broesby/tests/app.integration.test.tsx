import fs from 'node:fs';
import path from 'node:path';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../src/App';

let root: Root | null = null;
const styles = fs.readFileSync(path.resolve(__dirname, '../src/styles.css'), 'utf8');

function setInputValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

  setter?.call(element, value);
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

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
  it('renders the password gate contract by default', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    const container = document.getElementById('root');

    if (!container) {
      throw new Error('Missing root container');
    }

    root = createRoot(container);

    await act(async () => {
      root!.render(<App sharedPassword="broesby" />);
      await Promise.resolve();
    });

    const gate = document.querySelector<HTMLElement>('[aria-label="Password gate"]');
    const heading = document.querySelector('h1');
    const passwordInput = document.querySelector<HTMLInputElement>('input[aria-label="Shared password"]');

    expect(gate).toBeTruthy();
    expect(heading?.textContent).toMatch(/broesby family/i);
    expect(passwordInput).toBeTruthy();
    expect(passwordInput?.getAttribute('type')).toBe('password');
    expect(passwordInput?.getAttribute('autocomplete')).toBe('current-password');
    expect(styles).toContain('.field input');
    expect(styles).toContain('box-sizing: border-box;');
  });

  it('unlocks the site and prompts for a display name', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    const container = document.getElementById('root');

    if (!container) {
      throw new Error('Missing root container');
    }

    root = createRoot(container);

    await act(async () => {
      root!.render(<App sharedPassword="broesby" />);
      await Promise.resolve();
    });

    const passwordInput = document.querySelector<HTMLInputElement>('input[aria-label="Shared password"]');
    const enterButton = Array.from(document.querySelectorAll('button')).find(
      (element) => element.textContent === 'Enter site',
    );

    if (!passwordInput || !enterButton) {
      throw new Error('Missing password gate controls');
    }

    await act(async () => {
      setInputValue(passwordInput, 'broesby');
      enterButton.click();
      await Promise.resolve();
    });

    expect(document.body.textContent).toContain('Choose a display name');
    expect(document.body.textContent).toContain('The family noticeboard');
  });
});
