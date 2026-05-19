import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { AnecdotesSection } from '../src/components/AnecdotesSection';
import { resetStoredContent } from '../src/lib/storage';

let root: Root | null = null;

function setTextareaValue(element: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    'value',
  )?.set;

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
  resetStoredContent();
  document.body.innerHTML = '';
});

describe('AnecdotesSection', () => {
  it('submits and renders a new anecdote', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    const container = document.getElementById('root');

    if (!container) {
      throw new Error('Missing root container');
    }

    root = createRoot(container);

    await act(async () => {
      root!.render(<AnecdotesSection displayName="Morten" />);
      await Promise.resolve();
    });

    const textarea = document.querySelector<HTMLTextAreaElement>('textarea[aria-label="New anecdote"]');
    const button = Array.from(document.querySelectorAll('button')).find(
      (element) => element.textContent === 'Share anecdote',
    );

    if (!textarea || !button) {
      throw new Error('Missing anecdote controls');
    }

    await act(async () => {
      setTextareaValue(textarea, 'The summer cabin coffee tradition is still undefeated.');
      button.click();
      await Promise.resolve();
    });

    expect(document.body.textContent).toContain('The summer cabin coffee tradition is still undefeated.');
    expect(document.body.textContent).toContain('Morten');
  });
});
