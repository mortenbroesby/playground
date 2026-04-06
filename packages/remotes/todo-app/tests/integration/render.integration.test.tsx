import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { mount } from '../../src/mount';

describe('todo app integration', () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    document.body.innerHTML = '';
    localStorage.clear();
  });

  it('renders and supports bidirectional communication with the host', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    const onEvent = vi.fn();
    let handle!: ReturnType<typeof mount>;

    await act(async () => {
      handle = mount(target, { onEvent });
    });

    expect(target.textContent).toContain('No tasks yet. Add one above.');
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ready',
      }),
    );

    await act(async () => {
      handle.replaceTodos([{ id: 'host-seeded', title: 'Seeded by host', completed: false }]);
    });

    expect(target.textContent).toContain('Seeded by host');
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'todos:replaced',
      }),
    );

    const checkbox = target.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    expect(checkbox).not.toBeNull();

    await act(async () => {
      checkbox!.click();
    });

    expect(handle.getSnapshot().todos[0].completed).toBe(true);
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'todo:toggled',
        todo: expect.objectContaining({
          title: 'Seeded by host',
          completed: true,
        }),
      }),
    );

    await act(async () => {
      handle.clearTodos();
    });

    expect(target.textContent).toContain('No tasks yet. Add one above.');
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'todos:cleared',
      }),
    );

    await act(async () => {
      handle.unmount();
    });
  });
});
