import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';

import { TodoInputApp } from './TodoInputApp';

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: () => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}


describe('TodoInputApp', () => {
  it('publishes creation events for non-empty titles', () => {
    const publish = vi.fn();

    render(
      <MantineProvider>
        <TodoInputApp
          bridge={{
            getSnapshot: () => ({ todos: [], version: 0 }),
            publish,
            subscribe: () => () => undefined,
          }}
        />
      </MantineProvider>,
    );

    fireEvent.change(screen.getByLabelText('Todo title'), { target: { value: 'Document contract' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(publish).toHaveBeenCalledWith({
      type: 'todo:created',
      payload: { title: 'Document contract' },
    });
  });
});
