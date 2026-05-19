import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { ChatSection } from '../src/components/ChatSection';
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

describe('ChatSection', () => {
  it('stores and renders a local chat message', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    const container = document.getElementById('root');

    if (!container) {
      throw new Error('Missing root container');
    }

    root = createRoot(container);

    await act(async () => {
      root!.render(<ChatSection displayName="Morten" />);
      await Promise.resolve();
    });

    const textarea = document.querySelector<HTMLTextAreaElement>('textarea[aria-label="Message"]');
    const button = Array.from(document.querySelectorAll('button')).find(
      (element) => element.textContent === 'Send message',
    );

    if (!textarea || !button) {
      throw new Error('Missing chat controls');
    }

    await act(async () => {
      setTextareaValue(textarea, 'Noted. We will bring dessert.');
      button.click();
      await Promise.resolve();
    });

    expect(document.body.textContent).toContain('Noted. We will bring dessert.');
    expect(document.body.textContent).toContain('Morten');
  });
});
