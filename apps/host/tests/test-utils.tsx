import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { RouterProviderProps } from 'react-router-dom';
import { afterEach, expect, vi } from 'vitest';
import { HostApp } from '../src/host-app';
import { createAppRouter } from '../src/routes';

let root: Root | null = null;

export async function renderRoute(
  path: string,
): Promise<{ router: RouterProviderProps['router']; container: HTMLElement }> {
  document.body.innerHTML = '<div id="root"></div>';
  const container = document.getElementById('root');

  if (!container) {
    throw new Error('Missing root container');
  }

  const router = createAppRouter({ initialEntries: [path] });
  root = createRoot(container);

  await act(async () => {
    root!.render(<HostApp router={router} />);
    await Promise.resolve();
  });

  return { router, container };
}

export function getByTestId(id: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(`[data-testid="${id}"]`);

  expect(element, `Expected element with data-testid="${id}"`).not.toBeNull();

  return element!;
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

export async function keydown(key: string, init?: KeyboardEventInit): Promise<void> {
  await act(async () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }));
    await Promise.resolve();
  });
}

export async function typeInto(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): Promise<void> {
  await act(async () => {
    const prototype = Object.getPrototypeOf(element) as
      | HTMLInputElement
      | HTMLTextAreaElement;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');

    descriptor?.set?.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    await Promise.resolve();
  });
}

export async function waitForText(testId: string, text: string): Promise<void> {
  await vi.waitFor(() => {
    expect(getByTestId(testId).textContent).toContain(text);
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
