import { createTheme, MantineProvider } from '@mantine/core';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, expect, vi } from 'vitest';
import { App } from '../src/App';

let root: Root | null = null;

const theme = createTheme({
  primaryColor: 'green',
  defaultRadius: 'xs',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  headings: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
});

export async function renderApp() {
  document.body.innerHTML = '<div id="root"></div>';
  const container = document.getElementById('root');

  if (!container) {
    throw new Error('Missing root container');
  }

  root = createRoot(container);

  await act(async () => {
    root!.render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <App />
      </MantineProvider>,
    );
    await Promise.resolve();
  });

  return { container };
}

export function getByText(text: string): HTMLElement {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);

  while (walker.nextNode()) {
    const node = walker.currentNode as HTMLElement;
    if (node.textContent?.includes(text)) {
      return node;
    }
  }

  throw new Error(`Expected to find text: ${text}`);
}

export async function click(element: HTMLElement): Promise<void> {
  await act(async () => {
    element.click();
    await Promise.resolve();
  });
}

export async function typeInto(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: string,
): Promise<void> {
  await act(async () => {
    const prototype = Object.getPrototypeOf(element) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');

    descriptor?.set?.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    await Promise.resolve();
  });
}

export async function waitForText(text: string): Promise<void> {
  await vi.waitFor(() => {
    expect(getByText(text)).toBeTruthy();
  });
}

afterEach(async () => {
  await act(async () => {
    await Promise.resolve();
    root?.unmount();
    await Promise.resolve();
  });

  root = null;
});
